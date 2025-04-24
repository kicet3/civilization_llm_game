import random
import math
from typing import List, Tuple, Dict, Set, Optional
from models.hexmap import HexTile, TerrainType, ResourceType, HexCoord

def cube_distance(a: HexCoord, b: HexCoord) -> int:
    """큐브 좌표 간의 거리 계산"""
    return max(abs(a.q - b.q), abs(a.r - b.r), abs(a.s - b.s))

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
    hex_coord = HexCoord(q=center.q + directions[4][0] * radius,
                        r=center.r + directions[4][1] * radius,
                        s=center.s + directions[4][2] * radius)
    
    # 각 방향으로 radius만큼 이동하며 헥스 추가
    for direction in directions:
        for i in range(radius):
            results.append(hex_coord)
            hex_coord = HexCoord(q=hex_coord.q + direction[0],
                                r=hex_coord.r + direction[1],
                                s=hex_coord.s + direction[2])
    
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
                 and (t.q != player_position.q or t.r != player_position.r)]
    
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
        selected_coords = set((pos.q, pos.r) for pos in best_positions)
        selected_coords.add((player_position.q, player_position.r))
        
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