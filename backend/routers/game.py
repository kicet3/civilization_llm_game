import uuid
import random
import time
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from prisma.models import GameSession, Player, Hexagon, City, Unit
from models.game import GameSessionCreate, GameSessionResponse, GameState
from models.map import MapType, Difficulty
from core.config import prisma_client, settings

router = APIRouter()

async def generate_map(game_session_id: str, map_type: MapType, width: int, height: int, seed: int):
    """맵 생성 함수"""
    random.seed(seed)
    
    # 지형 타입 목록 (실제 게임에서는 더 복잡한 로직 필요)
    terrain_types = [
        "plains", "grassland", "desert", "hills", "forest", "tundra", 
        "mountain", "ocean", "coast", "lake"
    ]
    
    # 자원 타입 목록
    resource_types = [
        "wheat", "cattle", "horses", "iron", "gold", "silver", 
        "stone", "deer", "fish", "coal", "oil"
    ]
    
    hexagons = []
    
    # 맵 타입에 따른 기본 지형 생성 로직 
    if map_type == MapType.CONTINENTS:
        # 대륙 맵 생성 로직 (간단한 예시)
        for q in range(width):
            for r in range(height):
                s = -q - r
                
                # 간단한 대륙 생성 알고리즘
                terrain = random.choices(
                    terrain_types, 
                    weights=[0.3, 0.2, 0.1, 0.1, 0.1, 0.05, 0.05, 0.05, 0.025, 0.025]
                )[0]
                
                # 랜덤 자원 배치 (확률 기반)
                resource = random.choices(
                    [None] + resource_types, 
                    weights=[0.7] + [0.03] * len(resource_types)
                )[0]
                
                hexagon = await prisma_client.hexagon.create(
                    data={
                        "session_id": game_session_id,
                        "q": q,
                        "r": r,
                        "s": s,
                        "terrain_id": terrain,
                        "resource_id": resource
                    }
                )
                hexagons.append(hexagon)
    
    # 다른 맵 타입들도 유사한 방식으로 구현 가능
    
    return hexagons

async def create_initial_units(game_session_id: str, player_id: int, start_hex: Hexagon):
    """플레이어 초기 유닛 생성"""
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

@router.post("/start", response_model=GameSessionResponse)
async def create_game_session(request: GameSessionCreate):
    """게임 세션 생성"""
    try:
        # 1. 유효성 검사
        if not (5 <= request.civCount <= 10):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="문명 수는 5-10 사이여야 합니다."
            )
        
        # 2. 게임 세션 생성
        game_session = await prisma_client.gamesession.create(
            data={
                "host_user_id": 1,  # TODO: 실제 사용자 인증 시스템 구현 필요
                "map_type": request.mapType,
                "seed": int(time.time() * 1000),
                "current_turn": 1,
                "current_player": 1,
                "status": "ongoing",
                "created_at": datetime.now(),
                "updated_at": datetime.now()
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
        
        # 5. 플레이어 시작 위치 선택 (간단한 버전)
        start_hex = await prisma_client.hexagon.find_first(
            where={
                "session_id": game_session.id,
                "terrain_id": "grassland"  # 초원에서 시작
            }
        )
        
        if not start_hex:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="유효한 시작 위치를 찾을 수 없습니다."
            )
        
        # 6. 초기 유닛 및 도시 생성
        initial_units = await create_initial_units(game_session.id, player.id, start_hex)
        initial_city = await create_initial_city(game_session.id, player.id, start_hex, request.playerCiv)
        
        # 7. AI 문명 생성 (간단한 버전)
        ai_civs = [
            "china", "rome", "egypt", "japan", "france", 
            "germany", "england", "america", "india", "russia"
        ]
        ai_civs.remove(request.playerCiv)  # 플레이어가 선택한 문명 제외
        
        for i in range(1, request.civCount):
            ai_civ = random.choice(ai_civs)
            ai_civs.remove(ai_civ)
            
            ai_player = await prisma_client.player.create(
                data={
                    "session_id": game_session.id,
                    "user_id": 1,  # 시스템 사용자
                    "civ_type": ai_civ,
                    "is_ai": True,
                    "player_index": i
                }
            )
            
            # AI 시작 위치 선택
            ai_start_hex = await prisma_client.hexagon.find_first(
                where={
                    "session_id": game_session.id,
                    "terrain_id": "grassland"
                }
            )
            
            if ai_start_hex:
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
                "defense": initial_city.defense
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
        
        return GameSessionResponse(
            id=game_session.id,
            playerName=request.playerName,
            mapType=game_session.map_type,
            difficulty=request.difficulty,
            currentTurn=game_session.current_turn,
            gameSpeed=request.gameSpeed,
            createdAt=game_session.created_at,
            updatedAt=game_session.updated_at
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"게임 세션 생성 중 오류 발생: {str(e)}"
        )


