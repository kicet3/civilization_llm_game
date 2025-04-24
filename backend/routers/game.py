import uuid
import random
import time
import math
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any, Set, Tuple
from prisma.models import GameSession, Player, Hexagon, City, Unit, UnitType, Terrain, Resource
from models.game import GameSessionCreate, GameSessionResponse, GameState, GameOptions, GameOptionsResponse
from models.map import MapType, Difficulty
from core.config import prisma_client, settings
import json

router = APIRouter()

# 헥스 좌표 저장을 위한 튜플 타입
HexCoord = Tuple[int, int, int]
import hashlib

def generate_deterministic_seed(mode, difficulty, civ, map_type, civ_count):

    # 모든 입력 파라미터를 문자열로 결합
    seed_input = f"{mode}_{difficulty}_{civ}_{map_type}_{civ_count}"
    
    # SHA-256 해시를 사용하여 고유한 정수 시드 생성
    hash_object = hashlib.sha256(seed_input.encode())
    
    # 해시의 처음 8바이트를 사용하여 큰 정수 생성
    seed_int = int.from_bytes(hash_object.digest()[:8], byteorder='big')
    
    return seed_int


async def create_initial_city(game_session_id: str, player_id: int, start_hex: Hexagon, civ: str):
    """플레이어 초기 도시 생성"""
    # 문명별 초기 도시 이름 결정
    civ_city_names = {
        "korea": "서울",
        "japan": "도쿄",
        "china": "베이징",
        "mongol": "카라코룸",
        "india": "델리",
        "england": "런던",
        "france": "파리",
        "germany": "베를린",
        "rome": "로마",
        "america": "워싱턴"
    }
    
    city_name = civ_city_names.get(civ, "수도")
    
    # City 스키마에 맞게 데이터 생성 - 위치 정보 필드 추가
    city = await prisma_client.city.create(
        data={
            "session_id": game_session_id,
            "name": city_name,
            "owner_player_id": player_id,
            "population": 1,
            "hp": 100,
            "defense": 10,
            "food": 5,
            "production": 3,
            "gold": 10,
            "science": 2,
            "culture": 1,
            "faith": 1,
            "happiness": 10,
            "food_to_next_pop": 10,
            "culture_to_next_border": 20,
            # 위치 정보 추가
            "loc_q": start_hex.q,
            "loc_r": start_hex.r,
            "loc_s": start_hex.s
        }
    )
    
    # 도시와 타일의 연결을 별도로 처리
    # 도시가 위치한 타일 업데이트 (hexagon 테이블의 city_id 필드 업데이트)
    await prisma_client.hexagon.update(
        where={
            "session_id_q_r_s": {
                "session_id": game_session_id,
                "q": start_hex.q,
                "r": start_hex.r,
                "s": start_hex.s
            }
        },
        data={
            "city_id": city.id
        }
    )
    
    return city


async def generate_map(game_session_id: str, map_type: MapType, width: int, height: int, seed: int):
    """고도화된 맵 생성 함수 - 실제 DB 데이터 기반"""
    random.seed(seed)
    
    # DB에서 지형 및 자원 정보 사전 로드
    terrains = await prisma_client.terrain.find_many()
    resources = await prisma_client.resource.find_many()
    
    # 지형별 자원 매핑 (지형 특성에 맞는 자원 타입)
    terrain_resource_mapping = {
        'Grassland': ['Wheat', 'Cattle', 'Sheep'],
        'Plains': ['Wheat', 'Horses', 'Cattle'],
        'Forest': ['Deer', 'Dyes', 'Ivory'],
        'Hill': ['Iron', 'Horses', 'Gold'],
        'Tundra': ['Deer'],
        'Desert': ['Salt'],
        'Jungle': ['Spices', 'Dyes', 'Incense'],
        'Coast': ['Fish', 'Whale'],
        'Mountain': ['Silver', 'Gems'],
        'Oasis': ['Gems']
    }
    
    # 맵 타입별 지형 분포 및 특징
    map_type_terrain_distribution = {
        MapType.CONTINENTS: {
            "primary_terrains": ["Grassland", "Plains", "Forest"],
            "secondary_terrains": ["Hill", "Tundra", "Coast"],
            "water_terrains": ["Ocean"],
            "continent_count": 2,
            "continent_size_variance": 0.3
        },
        MapType.PANGAEA: {
            "primary_terrains": ["Plains", "Grassland", "Jungle"],
            "secondary_terrains": ["Hill", "Forest", "Tundra"],
            "water_terrains": ["Ocean", "Coast"],
            "continent_count": 1,
            "continent_size_variance": 0.1
        },
        MapType.ARCHIPELAGO: {
            "primary_terrains": ["Coast"],
            "secondary_terrains": ["Plains", "Hill"],
            "water_terrains": ["Ocean"],
            "continent_count": 10,
            "continent_size_variance": 0.8
        },
        MapType.SMALL_CONTINENTS: {
            "primary_terrains": ["Grassland", "Plains"],
            "secondary_terrains": ["Forest", "Hill", "Coast"],
            "water_terrains": ["Ocean"],
            "continent_count": 4,
            "continent_size_variance": 0.5
        }
    }
    
    # 기본 설정으로 fallback
    current_distribution = map_type_terrain_distribution.get(
        map_type, 
        map_type_terrain_distribution[MapType.CONTINENTS]
    )
    
    # 대륙 생성 알고리즘
    def generate_continent_seed(width, height):
        """대륙의 중심점 생성"""
        return (
            random.randint(width // 4, width * 3 // 4),
            random.randint(height // 4, height * 3 // 4)
        )
    
    # 대륙 중심점들 생성
    continent_seeds = [
        generate_continent_seed(width, height) 
        for _ in range(current_distribution["continent_count"])
    ]
    
    hexagons = []
    
    for q in range(width):
        for r in range(height):
            s = -q - r
            
            # 대륙 중심으로부터의 거리 계산
            distances = [
                math.sqrt((q - seed_q)**2 + (r - seed_r)**2) 
                for seed_q, seed_r in continent_seeds
            ]
            
            # 가장 가까운 대륙 중심 선택
            nearest_continent_index = distances.index(min(distances))
            distance_to_continent = min(distances)
            
            # 대륙 크기와 변동성 고려
            max_continent_radius = min(width, height) * (0.5 + current_distribution["continent_size_variance"])
            normalized_distance = distance_to_continent / max_continent_radius
            
            # 지형 카테고리 결정
            terrain_category = (
                "primary" if normalized_distance < 0.3 else 
                "secondary" if normalized_distance < 0.6 else 
                "water"
            )
            
            # 해당 카테고리의 지형 후보 선택
            terrain_candidates = {
                "primary": current_distribution.get("primary_terrains", []),
                "secondary": current_distribution.get("secondary_terrains", []),
                "water": current_distribution.get("water_terrains", [])
            }.get(terrain_category, [])
            
            # 지형 선택
            terrain_id = random.choice(terrain_candidates) if terrain_candidates else "Plains"
            
            # 자원 선택 로직
            possible_resources = terrain_resource_mapping.get(terrain_id, [])
            
            # 자원 타입 선택 (보너스 > 사치 > 전략)
            resource_type_priorities = ['Bonus', 'Luxury', 'Strategic']
            suitable_resources = [
                r.id for r in resources 
                if r.id in possible_resources and 
                   r.type in resource_type_priorities
            ]
            
            # 랜덤 자원 선택 (일정 확률로 자원 없음)
            resource_id = random.choices(
                [None] + suitable_resources, 
                weights=[0.7] + [0.3 / len(suitable_resources)] * len(suitable_resources)
            )[0]
            
            # 헥사곤 생성
            hexagon = await prisma_client.hexagon.create(
                data={
                    "session_id": game_session_id,
                    "q": q,
                    "r": r,
                    "s": s,
                    "terrain_id": terrain_id,
                    "resource_id": resource_id
                }
            )
            
            hexagons.append(hexagon)
    
    return hexagons

async def ensure_basic_game_data():
    """게임에 필요한 기본 데이터(유닛 타입, 지형, 자원 등)가 존재하는지 확인하고 없으면 생성"""
    # 기본 유닛 타입 정의
    default_unit_types = [
        {
            "id": "settler",
            "name": "정착민",
            "category": "civilian",
            "move": 2,
            "combat_strength": 0,
            "range": 0
        },
        {
            "id": "warrior",
            "name": "전사",
            "category": "melee",
            "move": 2,
            "combat_strength": 10,
            "range": 0
        },
        {
            "id": "scout",
            "name": "정찰병",
            "category": "recon",
            "move": 3,
            "combat_strength": 5,
            "range": 0
        }
    ]
    
    # 각 유닛 타입 확인 및 생성
    for unit_type in default_unit_types:
        existing = await prisma_client.unittype.find_unique(
            where={"id": unit_type["id"]}
        )
        
        if not existing:
            await prisma_client.unittype.create(data=unit_type)
    
    # 기본 지형 정의
    default_terrains = [
        {
            "id": "plains",
            "name": "평원",
            "yield_json": json.dumps({"food": 1, "production": 1})
        },
        {
            "id": "grassland",
            "name": "초원",
            "yield_json": json.dumps({"food": 2, "production": 0})
        },
        {
            "id": "desert",
            "name": "사막",
            "yield_json": json.dumps({"food": 0, "production": 0})
        },
        {
            "id": "hills",
            "name": "언덕",
            "yield_json": json.dumps({"food": 0, "production": 2})
        },
        {
            "id": "mountain",
            "name": "산",
            "yield_json": json.dumps({"food": 0, "production": 0})
        },
        {
            "id": "forest",
            "name": "숲",
            "yield_json": json.dumps({"food": 1, "production": 1})
        },
        {
            "id": "tundra",
            "name": "툰드라",
            "yield_json": json.dumps({"food": 1, "production": 0})
        },
        {
            "id": "ocean",
            "name": "대양",
            "yield_json": json.dumps({"food": 1, "production": 0})
        },
        {
            "id": "coast",
            "name": "해안",
            "yield_json": json.dumps({"food": 1, "production": 0})
        },
        {
            "id": "lake",
            "name": "호수",
            "yield_json": json.dumps({"food": 2, "production": 0})
        }
    ]
    
    # 각 지형 확인 및 생성
    for terrain in default_terrains:
        existing = await prisma_client.terrain.find_unique(
            where={"id": terrain["id"]}
        )
        
        if not existing:
            await prisma_client.terrain.create(data=terrain)
    
    # 기본 자원 정의
    default_resources = [
        {
            "id": "wheat",
            "name": "밀",
            "type": "bonus"
        },
        {
            "id": "cattle",
            "name": "소",
            "type": "bonus"
        },
        {
            "id": "horses",
            "name": "말",
            "type": "strategic"
        },
        {
            "id": "iron",
            "name": "철",
            "type": "strategic"
        },
        {
            "id": "gold",
            "name": "금",
            "type": "luxury"
        },
        {
            "id": "silver",
            "name": "은",
            "type": "luxury"
        },
        {
            "id": "stone",
            "name": "돌",
            "type": "bonus"
        },
        {
            "id": "deer",
            "name": "사슴",
            "type": "bonus"
        },
        {
            "id": "fish",
            "name": "물고기",
            "type": "bonus"
        },
        {
            "id": "coal",
            "name": "석탄",
            "type": "strategic"
        },
        {
            "id": "oil",
            "name": "석유",
            "type": "strategic"
        }
    ]
    
    # 각 자원 확인 및 생성
    for resource in default_resources:
        existing = await prisma_client.resource.find_unique(
            where={"id": resource["id"]}
        )
        
        if not existing:
            await prisma_client.resource.create(data=resource)

async def create_initial_units(game_session_id: str, player_id: int, start_hex: Hexagon):
    """플레이어 초기 유닛 생성"""
    # 기본 유닛 타입은 ensure_basic_game_data에서 이미 생성됨
    
    # 정착민 유닛 생성
    settler = await prisma_client.unit.create(
        data={
            "session_id": game_session_id,
            "owner_player_id": player_id,
            "unit_type_id": "settler",
            "hp": 100,
            "movement": 2,
            "max_movement": 2,
            "status": "대기",
            "loc_q": start_hex.q,
            "loc_r": start_hex.r,
            "loc_s": start_hex.s
        }
    )
    
    # 초기 군사 유닛 생성
    warrior = await prisma_client.unit.create(
        data={
            "session_id": game_session_id,
            "owner_player_id": player_id,
            "unit_type_id": "warrior",
            "hp": 100,
            "movement": 2,
            "max_movement": 2,
            "status": "대기",
            "loc_q": start_hex.q,
            "loc_r": start_hex.r,
            "loc_s": start_hex.s
        }
    )
    
    return [settler, warrior]

async def create_initial_city(game_session_id: str, player_id: int, start_hex: Hexagon, civ: str):
    """플레이어 초기 도시 생성"""
    # 문명별 초기 도시 이름 결정
    civ_city_names = {
        "korea": "서울",
        "japan": "도쿄",
        "china": "베이징",
        "mongol": "카라코룸",
        "india": "델리",
        "england": "런던",
        "france": "파리",
        "germany": "베를린",
        "rome": "로마",
        "america": "워싱턴"
    }
    
    city_name = civ_city_names.get(civ, "수도")
    
    city = await prisma_client.city.create(
        data={
            "session_id": game_session_id,
            "name": city_name,
            "owner_player_id": player_id,
            "population": 1,
            "loc_q": start_hex.q,
            "loc_r": start_hex.r,
            "loc_s": start_hex.s,
            "hp": 100,
            "defense": 10,
            "food": 5,
            "production": 3,
            "gold": 10,
            "science": 2,
            "culture": 1,
            "faith": 1,
            "happiness": 10,
            "food_to_next_pop": 10,
            "culture_to_next_border": 20
        }
    )
    
    return city

def hex_distance(a: HexCoord, b: HexCoord) -> int:
    """두 헥스 좌표 사이의 거리 계산"""
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]), abs(a[2] - b[2]))

async def find_starting_position(
    game_session_id: str, 
    occupied_positions: Set[HexCoord],
    min_distance: int = 5
) -> Hexagon:
    """적합한 시작 위치 찾기 (이미 점유된 위치와 일정 거리 이상 떨어진 위치)"""
    # 시작 위치로 적합한 지형
    suitable_terrains = ["grassland", "plains"]
    
    # 모든 적합한 타일 조회
    suitable_hexes = await prisma_client.hexagon.find_many(
        where={
            "session_id": game_session_id,
            "terrain_id": {"in": suitable_terrains}
        }
    )
    
    if not suitable_hexes:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="적합한 시작 위치를 찾을 수 없습니다."
        )
    
    # 적합한 위치 중 이미 점유된 위치와 일정 거리 이상 떨어진 위치 찾기
    for hex in suitable_hexes:
        hex_coord = (hex.q, hex.r, hex.s)
        
        # 이미 점유된 위치와의 거리 확인
        is_valid = True
        for occupied in occupied_positions:
            if hex_distance(hex_coord, occupied) < min_distance:
                is_valid = False
                break
        
        if is_valid:
            # 근처에 좋은 자원이 있는지 확인 (보너스)
            nearby_resources = await prisma_client.hexagon.find_many(
                where={
                    "session_id": game_session_id,
                    "q": {"gte": hex.q - 2, "lte": hex.q + 2},
                    "r": {"gte": hex.r - 2, "lte": hex.r + 2},
                    "resource_id": {"not": None}
                }
            )
            
            # 자원이 있으면 가중치 더 높게
            if nearby_resources and len(nearby_resources) >= 2:
                return hex
    
    # 자원 주변 위치를 찾지 못했다면, 기본 조건만 만족하는 위치 반환
    for hex in suitable_hexes:
        hex_coord = (hex.q, hex.r, hex.s)
        
        is_valid = True
        for occupied in occupied_positions:
            if hex_distance(hex_coord, occupied) < min_distance:
                is_valid = False
                break
        
        if is_valid:
            return hex
    
    # 최소 거리 조건을 만족하는 위치가 없다면, 그냥 아무 적합한 위치 반환
    return random.choice(suitable_hexes)

@router.post("/start", response_model=GameSessionResponse)
async def create_game_session(request: GameSessionCreate):
    """게임 세션 생성"""
    try:
        # 0. 기본 유닛 타입, 지형, 자원 등 기본 데이터 확인 및 생성
        await ensure_basic_game_data()
        
        # 1. 유효성 검사
        if not (5 <= request.civCount <= 10):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="문명 수는 5-10 사이여야 합니다."
            )
        
        # 2. 게임 세션 생성
        current_time = datetime.now()
        game_session = await prisma_client.gamesession.create(
            data={
                "host_user_id": 1,
                "map_type_id": request.mapType.value,
                "game_mode_id": request.gameSpeed,
                "difficulty_id": request.difficulty.value,
                "civ_count": request.civCount,
                "seed": int(time.time() * 1000),
                "current_turn": 1,
                "current_player": 1,
                "status": "ongoing",
                "created_at": current_time,
                "updated_at": current_time
            }
        )
        
        # 3. 맵 생성
        hexagons = await generate_map(
            game_session.id, 
            request.mapType, 
            settings.DEFAULT_MAP_WIDTH, 
            settings.DEFAULT_MAP_HEIGHT, 
            game_session.seed
        )
        
        # 이미 점유된 시작 위치 추적
        occupied_positions: Set[HexCoord] = set()
        
        # 4. 플레이어 생성
        player = await prisma_client.player.create(
            data={
                "session_id": game_session.id,
                "user_id": 1,  # TODO: 실제 사용자 ID
                "civ_type": request.playerCiv,
                "is_ai": False,
                "player_index": 0
            }
        )
        
        # 5. 플레이어 시작 위치 찾기
        start_hex = await find_starting_position(game_session.id, occupied_positions)
        
        # 시작 위치 점유 표시
        occupied_positions.add((start_hex.q, start_hex.r, start_hex.s))
        
        # 6. 초기 유닛 및 도시 생성
        initial_units = await create_initial_units(game_session.id, player.id, start_hex)
        initial_city = await create_initial_city(game_session.id, player.id, start_hex, request.playerCiv)
        
        # 7. AI 문명 생성 (개선된 버전)
        ai_civs = [
            "china", "rome", "egypt", "japan", "france", 
            "germany", "england", "america", "india", "russia"
        ]
        if request.playerCiv in ai_civs:
            ai_civs.remove(request.playerCiv)
        
        # AI 문명 수가 충분한지 확인
        if len(ai_civs) < request.civCount - 1:
            ai_civs.extend(["aztec", "babylon", "persia", "greece", "spain"])
        
        # AI 무작위 섞기
        random.shuffle(ai_civs)
        
        for i in range(1, request.civCount):
            ai_civ = ai_civs[i-1]
            
            ai_player = await prisma_client.player.create(
                data={
                    "session_id": game_session.id,
                    "user_id": 1,  # 시스템 사용자
                    "civ_type": ai_civ,
                    "is_ai": True,
                    "player_index": i
                }
            )
            
            # AI 시작 위치 선택 (이미 점유된 위치와 일정 거리 이상 떨어진 위치)
            ai_start_hex = await find_starting_position(game_session.id, occupied_positions)
            
            if ai_start_hex:
                # 시작 위치 점유 표시
                occupied_positions.add((ai_start_hex.q, ai_start_hex.r, ai_start_hex.s))
                
                # AI 초기 유닛 및 도시 생성
                await create_initial_units(game_session.id, ai_player.id, ai_start_hex)
                await create_initial_city(game_session.id, ai_player.id, ai_start_hex, ai_civ)
        
        # 8. 초기 게임 상태 정의
        initial_state = {
            "gameId": game_session.id,
            "turn": 1,
            "year": -4000,
            "playerId": str(player.id),
            "playerCiv": request.playerCiv,
            "resources": {
                "food": 10,
                "production": 5,
                "gold": 20,
                "science": 3,
                "culture": 2,
                "faith": 1,
                "happiness": 10
            },
            "cities": [{
                "id": initial_city.id,
                "name": initial_city.name,
                "population": initial_city.population,
                "production": initial_city.production,
                "turnsLeft": 3,
                "food": initial_city.food,
                "gold": initial_city.gold,
                "science": initial_city.science,
                "culture": initial_city.culture,
                "faith": initial_city.faith,
                "happiness": initial_city.happiness,
                "hp": initial_city.hp,
                "defense": initial_city.defense,
                # 위치 정보 추가
                "location": {
                    "q": initial_city.loc_q,
                    "r": initial_city.loc_r,
                    "s": initial_city.loc_s
                }
            }],
            "units": [{
                "id": unit.id,
                "name": unit.unit_type_id,
                "type": unit.unit_type_id,
                "typeName": unit.unit_type_id,
                "hp": unit.hp,
                "maxHp": unit.hp,
                "movement": unit.movement,
                "maxMovement": unit.max_movement,
                "status": unit.status,
                "location": {
                    "q": unit.loc_q,
                    "r": unit.loc_r,
                    "s": unit.loc_s
                }
            } for unit in initial_units],
            "diplomacy": {
                "civs": [],
                "cityStates": []
            },
            "naturalWonders": [],
            "researchState": {
                "science": 3,
                "progress": 0,
                "currentTechId": None,
                "researchedTechIds": []
            },
            "policyState": {
                "culture": 2,
                "adopted": [],
                "ideology": None
            },
            "religionState": {
                "faith": 1,
                "foundedReligionId": None,
                "followerReligionId": None
            }
        }
        
        # 프론트엔드가 기대하는 응답 형식으로 변경
        game_session_response = GameSessionResponse(
            id=game_session.id,
            playerName=request.playerName,
            mapType=game_session.map_type,
            difficulty=request.difficulty,
            currentTurn=game_session.current_turn,
            gameSpeed=request.gameSpeed,
            createdAt=game_session.created_at,
            updatedAt=game_session.updated_at,
            initialState=initial_state  # 초기 게임 상태 추가
        )
        
        return game_session_response
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"게임 세션 생성 중 오류 발생: {str(e)}"
        )


@router.get("/options", response_model=Dict[str, List[Dict[str, str]]])
async def get_game_options():
    """게임 옵션 목록 반환"""
    try:
        # 맵 타입 조회
        map_types = await prisma_client.maptype.find_many()
        
        # 난이도 조회
        difficulties = await prisma_client.difficulty.find_many()
        
        # 문명 조회
        civilizations = await prisma_client.civilization.find_many()
        
        # 게임 모드 조회 
        game_modes = await prisma_client.gamemode.find_many()
        
        # 응답 데이터 구성
        map_types_response = [
            {
                "id": map_type.id,
                "name": map_type.name,
                "description": map_type.description or get_map_type_description(MapType(map_type.id))
            } for map_type in map_types
        ]
        
        difficulties_response = [
            {
                "id": difficulty.id,
                "name": difficulty.name,
                "description": difficulty.description or get_difficulty_description(Difficulty(difficulty.id))
            } for difficulty in difficulties
        ]
        
        civilizations_response = [
            {
                "id": civ.id,
                "name": civ.name,
                "leader": civ.leader,
                "specialAbility": civ.specialAbility
            } for civ in civilizations
        ]
        
        game_modes_response = [
        {
            "id": mode.id,
                "name": mode.name,
                "turns": str(mode.turns),  # 정수를 문자열로 변환
                "estimatedTime": mode.estimatedTime,
                "description": mode.description
            } for mode in game_modes
        ]
        
        return {
            "mapTypes": map_types_response,
            "difficulties": difficulties_response,
            "civilizations": civilizations_response,
            "gameModes": game_modes_response
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"게임 옵션 조회 중 오류 발생: {str(e)}"
        )
