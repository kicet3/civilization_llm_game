from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from models.hexmap import HexTile, TerrainType, ResourceType, GameMapState, HexCoord, Civilization
import random
import math

router = APIRouter()

@router.get("/data")
async def get_map_data():
    """내륙 바다(Inland Sea) 형태의 맵 데이터 반환"""
    # 맵 크기 설정
    width = 21
    height = 19
    
    # 내륙 바다 맵 생성
    hexagons = generate_inland_sea_map(width, height)
    
    # 문명 정보 - 한국(플레이어) + 5개 AI 문명
    civilizations = [
        Civilization(
            name="Korea",
            capital_tile=HexCoord(q=4, r=3),
            units=["warrior-1", "settler-1"]
        ),
        Civilization(
            name="Japan",
            capital_tile=HexCoord(q=16, r=3),
            units=["warrior-2"]
        ),
        Civilization(
            name="China",
            capital_tile=HexCoord(q=4, r=15),
            units=["warrior-3"]
        ),
        Civilization(
            name="Mongolia",
            capital_tile=HexCoord(q=16, r=15),
            units=["warrior-4"]
        ),
        Civilization(
            name="Russia",
            capital_tile=HexCoord(q=10, r=2),
            units=["warrior-5"]
        ),
        Civilization(
            name="Rome",
            capital_tile=HexCoord(q=10, r=16),
            units=["warrior-6"]
        ),
    ]
    
    # 게임 맵 상태 생성
    game_map_state = GameMapState(
        tiles=hexagons,
        civs=civilizations,
        turn=1,
        game_id="inland_sea_map"
    )
    
    return {"hexagons": hexagons}


def generate_inland_sea_map(width: int, height: int) -> List[HexTile]:
    """내륙 바다 맵 생성 함수"""
    hexagons = []
    
    # 중심점 계산
    center_q = width // 2
    center_r = height // 2
    
    # 내륙 바다 반경
    sea_radius = min(width, height) // 3
    
    # 문명 시작 위치 정의
    civ_positions = {
        "Korea": {"q": 4, "r": 3, "city_id": "city_korea", "unit_id": "warrior-1", "unit_q": 5, "unit_r": 3},
        "Japan": {"q": 16, "r": 3, "city_id": "city_japan", "unit_id": "warrior-2", "unit_q": 17, "unit_r": 3},
        "China": {"q": 4, "r": 15, "city_id": "city_china", "unit_id": "warrior-3", "unit_q": 5, "unit_r": 15},
        "Mongolia": {"q": 16, "r": 15, "city_id": "city_mongolia", "unit_id": "warrior-4", "unit_q": 17, "unit_r": 15},
        "Russia": {"q": 10, "r": 2, "city_id": "city_russia", "unit_id": "warrior-5", "unit_q": 11, "unit_r": 2},
        "Rome": {"q": 10, "r": 16, "city_id": "city_rome", "unit_id": "warrior-6", "unit_q": 11, "unit_r": 16}
    }
    
    # 각 타일 생성
    for q in range(width):
        for r in range(height):
            s = -q - r  # 큐브 좌표 제약: q + r + s = 0
            
            # 중심점으로부터의 거리 계산
            distance = max(
                abs(q - center_q),
                abs(r - center_r),
                abs(s - (-center_q - center_r))
            )
            
            # 내륙 바다 영역 판단 (중심에 바다)
            is_sea = distance < sea_radius
            
            # 맵 가장자리 설정 (대양)
            is_edge = q == 0 or r == 0 or q == width - 1 or r == height - 1
            
            # 지형 결정 (내륙 바다, 해안, 육지)
            if is_edge:
                # 가장자리는 산
                terrain = TerrainType.MOUNTAIN
                resource = None
                explored = False
                visible = False
            elif is_sea:
                # 중앙 내륙 바다
                terrain = TerrainType.OCEAN if distance < sea_radius - 1 else TerrainType.COAST
                resource = ResourceType.FISH if random.random() < 0.2 and terrain == TerrainType.COAST else None
                explored = random.random() < 0.3
                visible = random.random() < 0.2 and explored
            else:
                # 육지 지형 랜덤 선택
                land_terrains = [
                    TerrainType.PLAINS, TerrainType.GRASSLAND, 
                    TerrainType.HILLS, TerrainType.FOREST,
                    TerrainType.DESERT
                ]
                terrain_weights = [0.3, 0.3, 0.15, 0.15, 0.1]  # 지형별 확률
                terrain = random.choices(land_terrains, weights=terrain_weights)[0]
                
                # 자원 배치 (20% 확률)
                if random.random() < 0.2:
                    if terrain == TerrainType.PLAINS:
                        resource = random.choice([ResourceType.WHEAT, ResourceType.HORSES, None, None])
                    elif terrain == TerrainType.GRASSLAND:
                        resource = random.choice([ResourceType.CATTLE, ResourceType.SHEEP, None, None])
                    elif terrain == TerrainType.HILLS:
                        resource = random.choice([ResourceType.IRON, ResourceType.COAL, None, None])
                    elif terrain == TerrainType.FOREST:
                        resource = None
                    elif terrain == TerrainType.DESERT:
                        resource = random.choice([ResourceType.GOLD, None, None])
                    else:
                        resource = None
                else:
                    resource = None
                
                # 가시성/탐험 상태
                distance_from_center = distance - sea_radius
                explored = random.random() < (0.8 - distance_from_center * 0.1)
                visible = random.random() < (0.6 - distance_from_center * 0.1) and explored
            
            # 헥스 타일 생성
            hexagon = HexTile(
                q=q,
                r=r,
                s=s,
                terrain=terrain,
                resource=resource,
                visible=False,  # 기본값: 보이지 않음
                explored=False   # 기본값: 탐험되지 않음
            )
            
            # 문명 시작 위치에 도시와 유닛 배치
            for civ_name, pos in civ_positions.items():
                # 도시 위치
                if q == pos["q"] and r == pos["r"]:
                    hexagon.city_id = pos["city_id"]
                    hexagon.occupant = civ_name
                    hexagon.terrain = TerrainType.PLAINS  # 도시는 평원에 위치
                    # 플레이어(한국)만 초기에 볼 수 있음
                    if civ_name == "Korea":
                        hexagon.visible = True
                        hexagon.explored = True
                    else:
                        hexagon.visible = False
                        hexagon.explored = False
                
                # 유닛 위치
                if q == pos["unit_q"] and r == pos["unit_r"]:
                    hexagon.unit_id = pos["unit_id"]
                    hexagon.occupant = civ_name
                    # 플레이어(한국)만 초기에 볼 수 있음
                    if civ_name == "Korea":
                        hexagon.visible = True
                        hexagon.explored = True
                    else:
                        hexagon.visible = False
                        hexagon.explored = False
            
            # 문명 시작 주변 지형 조정 (평원, 초원, 숲 등으로 적절히 배치)
            for civ_name, pos in civ_positions.items():
                # 도시 근처 타일(2칸 이내)은 적절한 지형으로 설정
                dist_to_city = max(
                    abs(q - pos["q"]), 
                    abs(r - pos["r"]), 
                    abs(s - (-pos["q"] - pos["r"]))
                )
                
                if dist_to_city <= 2 and dist_to_city > 0 and not is_sea and not is_edge:
                    # 랜덤하게 좋은 지형 선택 (평원/초원/숲 등)
                    good_terrains = [
                        TerrainType.PLAINS, TerrainType.GRASSLAND, 
                        TerrainType.FOREST, TerrainType.HILLS
                    ]
                    hexagon.terrain = random.choice(good_terrains)
                    
                    # 좋은 자원도 배치 (20% 확률)
                    if random.random() < 0.2:
                        good_resources = [
                            ResourceType.WHEAT, ResourceType.HORSES, 
                            ResourceType.CATTLE, ResourceType.IRON
                        ]
                        hexagon.resource = random.choice(good_resources)
            
            # 플레이어 위치는 시야 범위가 넓게 탐험됨
            dist_to_player = max(
                abs(q - civ_positions["Korea"]["q"]), 
                abs(r - civ_positions["Korea"]["r"]), 
                abs(s - (-civ_positions["Korea"]["q"] - civ_positions["Korea"]["r"]))
            )
            
            if dist_to_player <= 3:  # 3칸 이내는 완전히 보임
                hexagon.visible = True
                hexagon.explored = True
            elif dist_to_player <= 5:  # 5칸 이내는 탐험됨
                hexagon.explored = True
                hexagon.visible = random.random() < 0.3  # 30% 확률로 보임
            
            hexagons.append(hexagon)
    
    return hexagons

@router.get("/adjacent")
async def get_adjacent_tiles(q: int, r: int):
    """지정된 타일 주변의 인접 타일 정보 반환"""
    # 인접 방향 (육각형 그리드)
    directions = [
        (1, 0, -1),  # 동쪽
        (1, -1, 0),  # 북동쪽
        (0, -1, 1),  # 북서쪽
        (-1, 0, 1),  # 서쪽
        (-1, 1, 0),  # 남서쪽
        (0, 1, -1)   # 남동쪽
    ]
    
    hexagons = []
    
    for dir_q, dir_r, dir_s in directions:
        adj_q = q + dir_q
        adj_r = r + dir_r
        adj_s = -adj_q - adj_r
        
        # 랜덤한 지형 생성 (실제로는 데이터베이스에서 조회)
        terrain = random.choice([t for t in TerrainType])
        
        # 바다/산은 제외 (이동 가능한 타일만)
        while terrain in [TerrainType.OCEAN, TerrainType.MOUNTAIN]:
            terrain = random.choice([t for t in TerrainType])
        
        hexagon = HexTile(
            q=adj_q,
            r=adj_r,
            s=adj_s,
            terrain=terrain,
            resource=random.choice([r for r in ResourceType]) if random.random() < 0.2 else None,
            visible=True,
            explored=True
        )
        
        hexagons.append(hexagon)
    
    return {"hexagons": hexagons}