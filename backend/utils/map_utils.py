import random
import math
from typing import List, Tuple, Dict, Set, Optional, Any
from models.hexmap import HexTile, TerrainType, ResourceType, HexCoord
from prisma.models import Hexagon
from core.config import prisma_client
from models.game import GameSpeed

def cube_distance(a: HexCoord, b: HexCoord) -> int:
    """큐브 좌표 간의 거리 계산"""
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]), abs(a[2] - b[2]))

def get_ring(center: HexCoord, radius: int) -> List[HexCoord]:
    """중심 헥스 좌표에서 특정 반경에 있는 모든 헥스 좌표 반환"""
    results = []
    
    # 링의 6개 방향 (시계 방향)
    directions = [
        (1, 0, -1),  # 동
        (0, 1, -1),  # 남동
        (-1, 1, 0),  # 남서
        (-1, 0, 1),  # 서
        (0, -1, 1),  # 북서
        (1, -1, 0)   # 북동
    ]
    
    # 특정 방향으로 radius만큼 이동한 시작점
    hex_coord = HexCoord(q=center[0] + directions[4][0] * radius,
                        r=center[1] + directions[4][1] * radius,
                        s=center[2] + directions[4][2] * radius)
    
    # 각 방향으로 radius만큼 이동하며 헥스 추가
    for direction in directions:
        for i in range(radius):
            results.append(hex_coord)
            hex_coord = HexCoord(q=hex_coord[0] + direction[0],
                                r=hex_coord[1] + direction[1],
                                s=hex_coord[2] + direction[2])
    
    return results

def get_spiral(center: HexCoord, radius: int) -> List[HexCoord]:
    """중심으로부터 나선형으로 헥스 좌표 반환 (중심부터 radius까지)"""
    results = [center]
    for r in range(1, radius + 1):
        results.extend(get_ring(center, r))
    return results

def get_terrain_distribution(map_type: str) -> Dict[str, float]:
    """맵 타입에 따른 지형 분포 확률 반환"""
    distributions = {
        "continental": {
            TerrainType.PLAINS: 0.3,
            TerrainType.GRASSLAND: 0.2,
            TerrainType.HILLS: 0.1,
            TerrainType.FOREST: 0.15,
            TerrainType.MOUNTAIN: 0.05,
            TerrainType.DESERT: 0.05,
            TerrainType.OCEAN: 0.15,
        },
        "pangaea": {
            TerrainType.PLAINS: 0.35,
            TerrainType.GRASSLAND: 0.25,
            TerrainType.HILLS: 0.1,
            TerrainType.FOREST: 0.15,
            TerrainType.MOUNTAIN: 0.05,
            TerrainType.DESERT: 0.05,
            TerrainType.OCEAN: 0.05,
        },
        "archipelago": {
            TerrainType.PLAINS: 0.2,
            TerrainType.GRASSLAND: 0.15,
            TerrainType.HILLS: 0.05,
            TerrainType.FOREST: 0.1,
            TerrainType.MOUNTAIN: 0.05,
            TerrainType.DESERT: 0.05,
            TerrainType.OCEAN: 0.4,
        }
    }
    
    # 기본값으로 대륙 형 반환
    return distributions.get(map_type, distributions["continental"])

def get_resource_by_terrain(terrain: TerrainType) -> List[ResourceType]:
    """지형에 따른 가능한 자원 타입 반환"""
    terrain_resources = {
        TerrainType.PLAINS: [ResourceType.HORSES, ResourceType.WHEAT, ResourceType.CATTLE],
        TerrainType.GRASSLAND: [ResourceType.CATTLE, ResourceType.SHEEP, ResourceType.WHEAT],
        TerrainType.HILLS: [ResourceType.IRON, ResourceType.GOLD, ResourceType.SILVER, ResourceType.GEMS],
        TerrainType.FOREST: [ResourceType.IRON, ResourceType.HORSES],
        TerrainType.MOUNTAIN: [ResourceType.IRON, ResourceType.GOLD, ResourceType.SILVER],
        TerrainType.DESERT: [ResourceType.OIL, ResourceType.IRON],
        TerrainType.OCEAN: [],  # 바다에는 자원 없음
        TerrainType.COAST: [ResourceType.COAL]
    }
    
    return terrain_resources.get(terrain, [])

def get_starting_position_score(tile: HexTile, tiles: List[HexTile], width: int, height: int) -> float:
    """시작 위치의 적합성 점수 계산 (높을수록 좋음)"""
    if tile.terrain in [TerrainType.OCEAN, TerrainType.MOUNTAIN]:
        return 0.0
    
    score = 1.0
    
    # 초원과 평원은 시작 위치로 좋음
    if tile.terrain in [TerrainType.GRASSLAND, TerrainType.PLAINS]:
        score += 0.5
    
    # 자원이 있으면 보너스
    if tile.resource != ResourceType.NONE:
        score += 0.3
    
    # 가장자리에서 멀수록 좋음 (중앙 쪽이 전략적으로 유리)
    center_q = 0
    center_r = 0
    distance_to_center = cube_distance(
        HexCoord(q=tile.q, r=tile.r, s=tile.s),
        HexCoord(q=center_q, r=center_r, s=-center_q-center_r)
    )
    max_distance = max(width, height) / 2
    center_factor = 1.0 - (distance_to_center / max_distance)
    score += center_factor * 0.3
    
    return score

def find_suitable_starting_positions(
    tiles: List[HexTile],
    player_position: HexCoord,
    ai_count: int,
    min_distance: int,
    width: int,
    height: int
) -> List[HexCoord]:
    """AI 문명의 적합한 시작 위치 찾기"""
    # 물과 산을 제외한 타일만 필터링
    land_tiles = [t for t in tiles 
                 if t.terrain not in [TerrainType.OCEAN, TerrainType.MOUNTAIN]
                 and (t.q != player_position[0] or t.r != player_position[1])]
    
    # 플레이어 위치로부터 최소 거리 이상 떨어진 타일만 필터링
    candidates = [t for t in land_tiles 
                 if cube_distance(
                     HexCoord(q=t.q, r=t.r, s=t.s),
                     player_position
                 ) >= min_distance]
    
    # 적합성 점수 계산 및 정렬
    scored_positions = [(t, get_starting_position_score(t, tiles, width, height)) 
                        for t in candidates]
    scored_positions.sort(key=lambda x: x[1], reverse=True)
    
    # 점수가 가장 높은 위치 선택 (필요한 AI 수만큼)
    best_positions = []
    for tile, _ in scored_positions[:ai_count]:
        best_positions.append(HexCoord(q=tile.q, r=tile.r, s=tile.s))
    
    # 만약 충분한 위치를 찾지 못한 경우, 최소 거리 조건 완화
    while len(best_positions) < ai_count and min_distance > 1:
        min_distance -= 1
        remaining_count = ai_count - len(best_positions)
        
        # 이미 선택된 위치 리스트
        selected_coords = set((pos[0], pos[1]) for pos in best_positions)
        selected_coords.add((player_position[0], player_position[1]))
        
        # 최소 거리 조건 완화하여 재검색
        new_candidates = [t for t in land_tiles 
                         if cube_distance(
                             HexCoord(q=t.q, r=t.r, s=t.s),
                             player_position
                         ) >= min_distance
                         and (t.q, t.r) not in selected_coords]
        
        new_scored = [(t, get_starting_position_score(t, tiles, width, height)) 
                      for t in new_candidates]
        new_scored.sort(key=lambda x: x[1], reverse=True)
        
        for tile, _ in new_scored[:remaining_count]:
            best_positions.append(HexCoord(q=tile.q, r=tile.r, s=tile.s))
            selected_coords.add((tile.q, tile.r))
    
    return best_positions

def initialize_resources(tiles: List[HexTile], resource_percentage: float = 0.1) -> List[HexTile]:
    """타일에 자원 배치"""
    # 육지 타일만 필터링
    land_tiles = [i for i, t in enumerate(tiles) 
                 if t.terrain not in [TerrainType.OCEAN, TerrainType.MOUNTAIN]]
    
    # 리소스를 배치할 타일 수 계산
    resource_count = int(len(land_tiles) * resource_percentage)
    
    # 자원 타입별 최대 개수 (밸런스 조정용)
    resource_limits = {
        ResourceType.IRON: 5,
        ResourceType.HORSES: 4,
        ResourceType.WHEAT: 6,
        ResourceType.CATTLE: 5,
        ResourceType.SHEEP: 4,
        ResourceType.GOLD: 3,
        ResourceType.SILVER: 3,
        ResourceType.GEMS: 2,
        ResourceType.MARBLE: 2,
        ResourceType.OIL: 3,
        ResourceType.COAL: 3
    }
    
    # 자원 타입별 현재 개수 추적
    resource_counts = {res: 0 for res in resource_limits.keys()}
    
    # 랜덤하게 타일 선택하여 자원 배치
    random.shuffle(land_tiles)
    resource_tiles = land_tiles[:resource_count]
    
    for idx in resource_tiles:
        tile = tiles[idx]
        possible_resources = get_resource_by_terrain(tile.terrain)
        
        if not possible_resources:
            continue
        
        # 한도에 도달하지 않은 자원만 필터링
        available_resources = [res for res in possible_resources 
                              if resource_counts.get(res, 0) < resource_limits.get(res, 999)]
        
        if not available_resources:
            continue
        
        # 랜덤 자원 선택 및 배치
        selected_resource = random.choice(available_resources)
        tiles[idx].resource = selected_resource
        resource_counts[selected_resource] += 1
    
    return tiles

def hex_distance(a: HexCoord, b: HexCoord) -> int:
    """두 헥스 좌표 사이의 거리 계산"""
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]), abs(a[2] - b[2]))

def get_neighbors(q: int, r: int, s: int) -> List[HexCoord]:
    """주어진 헥스 좌표의 인접한 6개 타일 좌표 반환"""
    directions = [
        (1, 0, -1), (1, -1, 0), (0, -1, 1),
        (-1, 0, 1), (-1, 1, 0), (0, 1, -1)
    ]
    return [(q + dq, r + dr, s + ds) for dq, dr, ds in directions]

def get_tiles_in_radius(center: HexCoord, radius: int) -> List[HexCoord]:
    """중심점으로부터 특정 반경 내의 모든 타일 좌표 반환"""
    results = []
    q, r, s = center
    
    for dq in range(-radius, radius + 1):
        for dr in range(max(-radius, -dq - radius), min(radius, -dq + radius) + 1):
            ds = -dq - dr
            if abs(ds) <= radius:
                results.append((q + dq, r + dr, s + ds))
    
    return results

async def assign_guaranteed_resources(game_id: str, capital_coords: List[HexCoord]):
    """각 수도 반경 2칸 내에 보장된 자원 배치"""
    for capital in capital_coords:
        # 수도 좌표
        q, r, s = capital
        
        # 반경 2칸 내 모든 타일 가져오기
        tiles_in_radius = get_tiles_in_radius(capital, 2)
        
        # 수도 타일 자체는 제외
        tiles_in_radius.remove(capital)
        
        # 물 타일이 아닌 타일만 선택
        land_tiles = []
        for tile_coord in tiles_in_radius:
            tq, tr, ts = tile_coord
            tile = await prisma_client.hexagon.find_unique(
                where={
                    "session_id_q_r_s": {
                        "session_id": game_id,
                        "q": tq,
                        "r": tr,
                        "s": ts
                    }
                }
            )
            if tile and tile.terrain_id not in ["ocean", "coast", "lake"]:
                land_tiles.append(tile)
        
        # 충분한 타일이 없으면 가능한 만큼만 처리
        if not land_tiles:
            continue
        
        # 보장 자원 목록
        guaranteed_resources = [
            {"id": "wheat", "category": "food"},
            {"id": "iron", "category": "production"},
            {"id": "gold", "category": "gold"}
        ]
        
        # 자원 없는 타일 섞기
        empty_tiles = [t for t in land_tiles if not t.resource_id]
        random.shuffle(empty_tiles)
        
        # 보장 자원 배치
        for i, resource in enumerate(guaranteed_resources):
            if i < len(empty_tiles):
                # 자원 배치
                await prisma_client.hexagon.update(
                    where={
                        "session_id_q_r_s": {
                            "session_id": game_id,
                            "q": empty_tiles[i].q,
                            "r": empty_tiles[i].r,
                            "s": empty_tiles[i].s
                        }
                    },
                    data={"resource_id": resource["id"]}
                )

async def distribute_map_resources(game_id: str):
    """전체 맵에 자원 분포 로직"""
    # 모든 땅 타일 조회
    land_tiles = await prisma_client.hexagon.find_many(
        where={
            "session_id": game_id,
            "terrain_id": {"not_in": ["ocean", "coast", "lake"]}
        }
    )
    
    # 이미 자원이 있는 타일은 제외
    empty_land_tiles = [t for t in land_tiles if not t.resource_id]
    
    # 자원 배치할 타일 수 계산 (땅 타일의 10%)
    resource_count = int(len(land_tiles) * 0.10)
    
    # 이미 배치된 자원 개수를 빼서 추가 배치할 수 조정
    already_assigned = len(land_tiles) - len(empty_land_tiles)
    resource_count = max(0, resource_count - already_assigned)
    
    # 자원 유형별 배치 수량
    resource_distribution = {
        "food": int(resource_count * 0.4),      # Wheat, Cattle 등
        "production": int(resource_count * 0.3), # Stone, Copper 등
        "gold": int(resource_count * 0.2),      # Gold, Gems 등
        "strategic": int(resource_count * 0.1)   # Horses 등
    }
    
    # 자원 매핑
    resource_mapping = {
        "food": ["wheat", "cattle", "sheep", "rice"],
        "production": ["stone", "iron", "copper"],
        "gold": ["gold", "silver", "gems"],
        "strategic": ["horses"]
    }
    
    # 지형에 맞는 자원 매핑
    terrain_resource_mapping = {
        "grassland": ["wheat", "cattle", "sheep"],
        "plains": ["wheat", "horses", "cattle"],
        "forest": ["deer", "iron"],
        "hill": ["stone", "iron", "gold"],
        "tundra": ["deer"],
        "desert": ["gold", "silver"],
        "jungle": ["gems", "rice"],
        "mountain": ["stone", "silver", "gems"]
    }
    
    # 비어있는 땅 타일 섞기
    random.shuffle(empty_land_tiles)
    
    # 각 자원 유형별로 처리
    for category, count in resource_distribution.items():
        # 해당 카테고리의 자원 목록
        resources = resource_mapping[category]
        
        # 배치할 수 만큼 반복
        for _ in range(count):
            if not empty_land_tiles:
                break
                
            # 다음 타일 선택
            tile = empty_land_tiles.pop()
            
            # 지형에 맞는 자원 선택
            suitable_resources = terrain_resource_mapping.get(tile.terrain_id, [])
            
            # 지형에 맞는 자원이 없으면 카테고리 내 아무 자원이나 선택
            if not suitable_resources:
                suitable_resources = resources
            
            # 두 목록의 교집합 찾기 (지형에 맞으면서 해당 카테고리인 자원)
            compatible_resources = [r for r in suitable_resources if r in resources]
            
            # 호환 가능한 자원이 없으면 카테고리 내에서 선택
            selected_resource = random.choice(compatible_resources if compatible_resources else resources)
            
            # 자원 배치
            await prisma_client.hexagon.update(
                where={
                    "session_id_q_r_s": {
                        "session_id": game_id,
                        "q": tile.q,
                        "r": tile.r,
                        "s": tile.s
                    }
                },
                data={"resource_id": selected_resource}
            )

async def setup_capital_yield(game_id: str, capital_coords: List[HexCoord]):
    """수도 타일에 기본 수확량 설정"""
    for capital in capital_coords:
        q, r, s = capital
        
        # 기본 수확량: 식량 2, 생산 1, 골드 1
        yield_data = {
            "food": 2,
            "production": 1,
            "gold": 1
        }
        
        # 수도 타일 업데이트
        await prisma_client.hexagon.update(
            where={
                "session_id_q_r_s": {
                    "session_id": game_id,
                    "q": q,
                    "r": r,
                    "s": s
                }
            },
            data={
                "yield_food": yield_data["food"],
                "yield_production": yield_data["production"],
                "yield_gold": yield_data["gold"]
            }
        )

async def create_starting_units(game_id: str, player_id: int, capital_hex: Hexagon):
    """플레이어 초기 유닛 생성 - 정찰병과 개척자"""
    # 정찰병 유닛 생성
    scout = await prisma_client.unit.create(
        data={
            "session_id": game_id,
            "owner_player_id": player_id,
            "unit_type_id": "scout",
            "hp": 100,
            "movement": 3,
            "max_movement": 3,
            "status": "대기",
            "loc_q": capital_hex.q,
            "loc_r": capital_hex.r,
            "loc_s": capital_hex.s
        }
    )
    
    # 개척자 유닛 생성
    builder = await prisma_client.unit.create(
        data={
            "session_id": game_id,
            "owner_player_id": player_id,
            "unit_type_id": "builder",
            "hp": 100,
            "movement": 2,
            "max_movement": 2,
            "status": "대기",
            "loc_q": capital_hex.q,
            "loc_r": capital_hex.r,
            "loc_s": capital_hex.s,
            "charges": 3  # 기본 3회 사용 가능
        }
    )
    
    return [scout, builder]

def get_resource_improvements(resource_id: str) -> str:
    """자원 유형에 따른 개선 시설 반환"""
    food_resources = ["wheat", "cattle", "sheep", "rice"]
    production_resources = ["stone", "iron", "copper"]
    luxury_resources = ["gold", "silver", "gems"]
    
    if resource_id in food_resources:
        return "farm"
    elif resource_id in production_resources:
        return "mine"
    elif resource_id in luxury_resources:
        return "mine"
    elif resource_id == "horses":
        return "pasture"
    else:
        return "farm"  # 기본값

async def get_suggested_improvements(game_id: str, capital_coord: HexCoord) -> List[Dict[str, Any]]:
    """수도 반경 2칸 내 자원 타일에 대한 개선 추천 목록 반환"""
    q, r, s = capital_coord
    
    # 반경 2칸 내 모든 타일 가져오기
    tiles_in_radius = get_tiles_in_radius((q, r, s), 2)
    
    suggested_improvements = []
    
    for tile_coord in tiles_in_radius:
        tq, tr, ts = tile_coord
        
        # 타일 정보 조회
        tile = await prisma_client.hexagon.find_unique(
            where={
                "session_id_q_r_s": {
                    "session_id": game_id,
                    "q": tq,
                    "r": tr,
                    "s": ts
                }
            }
        )
        
        # 자원이 있는 타일만 처리
        if tile and tile.resource_id:
            improvement = get_resource_improvements(tile.resource_id)
            
            suggested_improvements.append({
                "tile": {
                    "q": tile.q,
                    "r": tile.r,
                    "s": tile.s
                },
                "resource": tile.resource_id,
                "improvement": improvement
            })
    
    return suggested_improvements