import uuid
import random
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any, Set, Tuple

from models.hexmap import (
    HexTile, HexCoord, TerrainType, ResourceType, 
    MapInitRequest, GameMapState, Civilization
)
from utils.map_utils import (
    cube_distance, get_ring, get_spiral, 
    get_terrain_distribution, get_resource_by_terrain,
    find_suitable_starting_positions, initialize_resources
)
from models.game import GameSessionCreate, GameSessionResponse
from core.config import prisma_client

router = APIRouter()

@router.post("/init/{game_id}", response_model=GameMapState)
async def initialize_map(game_id: str, request: MapInitRequest):
    """게임 맵 초기화 API"""
    try:
        # 1. 타일 그리드 생성
        tiles = []
        width, height = request.width, request.height
        
        # 헥사곤 타일 생성 (원점 중심 그리드)
        for q in range(-width//2, width//2 + 1):
            for r in range(-height//2, height//2 + 1):
                s = -q - r
                # 유효한 큐브 좌표만 추가 (q + r + s = 0)
                if abs(s) <= height//2:
                    tiles.append(
                        HexTile(
                            q=q,
                            r=r,
                            s=s,
                            terrain=TerrainType.PLAINS,  # 임시 기본값
                            resource=ResourceType.NONE,
                            visible=False,
                            explored=False
                        )
                    )
        
        # 2. 지형 타입 분포 설정
        terrain_distribution = get_terrain_distribution(request.map_type)
        terrain_types = list(terrain_distribution.keys())
        terrain_weights = [terrain_distribution[t] for t in terrain_types]
        
        # 3. 지형 분포 적용
        # 외곽은 물/바다 확률 높게, 중앙은 육지 확률 높게
        center = HexCoord(q=0, r=0, s=0)
        max_distance = max(width, height) // 2
        
        for i, tile in enumerate(tiles):
            tile_coord = HexCoord(q=tile.q, r=tile.r, s=tile.s)
            distance = cube_distance(center, tile_coord)
            
            # 외곽에 가까울수록 해양 확률 증가
            edge_factor = distance / max_distance
            
            if edge_factor > 0.8 and random.random() < 0.7:  # 외곽 70% 확률로 바다
                tiles[i].terrain = TerrainType.OCEAN
            elif edge_factor > 0.65 and random.random() < 0.4:  # 외곽 근처 40% 확률로 바다
                tiles[i].terrain = TerrainType.OCEAN
            else:
                # 나머지 지형은 분포에 따라 설정
                # 해양은 이미 처리했으므로 제외
                land_types = [t for t in terrain_types if t != TerrainType.OCEAN]
                land_weights = [terrain_distribution[t] for t in land_types]
                # 확률 정규화
                land_weights = [w/sum(land_weights) for w in land_weights]
                
                tiles[i].terrain = random.choices(land_types, weights=land_weights)[0]
        
        # 4. 자원 배치 (전체 육지 타일의 10% 정도)
        tiles = initialize_resources(tiles, resource_percentage=0.1)
        
        # 5. 시작 위치 설정 
        # 플레이어 위치 중앙(0,0,0)에 고정
        player_position = HexCoord(q=0, r=0, s=0)
        
        # 플레이어 위치 타일이 육지가 아니면 강제로 변경
        player_tile_idx = next(i for i, t in enumerate(tiles) 
                              if t.q == player_position.q and t.r == player_position.r)
        
        # 플레이어 위치 타일을 항상 평원이나 초원으로 설정
        tiles[player_tile_idx].terrain = random.choice(
            [TerrainType.PLAINS, TerrainType.GRASSLAND]
        )
        tiles[player_tile_idx].resource = ResourceType.NONE  # 자원 없음
        tiles[player_tile_idx].occupant = request.player_civ
        tiles[player_tile_idx].city_id = f"{request.player_civ}_capital"
        tiles[player_tile_idx].visible = True
        tiles[player_tile_idx].explored = True
        
        # 주변 타일 탐험 상태로 설정 (시야 2칸)
        for dist in range(1, 3):
            ring_tiles = get_ring(player_position, dist)
            for ring_tile in ring_tiles:
                matching_idx = next((i for i, t in enumerate(tiles) 
                                   if t.q == ring_tile.q and t.r == ring_tile.r), None)
                if matching_idx is not None:
                    tiles[matching_idx].explored = True
                    if dist == 1:  # 1칸 거리는 가시 범위
                        tiles[matching_idx].visible = True
        
        # 6. AI 문명 배치
        ai_positions = find_suitable_starting_positions(
            tiles, 
            player_position, 
            len(request.ai_civs),
            min_distance=5,  # 플레이어로부터 최소 거리
            width=width,
            height=height
        )
        
        # 각 AI 문명을 위치에 배치
        for i, ai_civ in enumerate(request.ai_civs):
            if i < len(ai_positions):
                pos = ai_positions[i]
                ai_tile_idx = next(idx for idx, t in enumerate(tiles) 
                                  if t.q == pos.q and t.r == pos.r)
                
                # AI 위치 타일을 항상 육지로 설정
                tiles[ai_tile_idx].terrain = random.choice(
                    [TerrainType.PLAINS, TerrainType.GRASSLAND]
                )
                tiles[ai_tile_idx].resource = ResourceType.NONE  # 자원 없음
                tiles[ai_tile_idx].occupant = ai_civ
                tiles[ai_tile_idx].city_id = f"{ai_civ}_capital"
        
        # 7. 문명 정보 구성
        civilizations = [
            Civilization(
                name=request.player_civ,
                capital_tile=player_position,
                units=[]  # 초기 유닛 ID 목록 (실제로는 DB에서 생성 후 참조)
            )
        ]
        
        for i, ai_civ in enumerate(request.ai_civs):
            if i < len(ai_positions):
                civilizations.append(
                    Civilization(
                        name=ai_civ,
                        capital_tile=ai_positions[i],
                        units=[]
                    )
                )
        
        # 8. 맵 상태 반환
        game_map_state = GameMapState(
            tiles=tiles,
            civs=civilizations,
            turn=0,
            game_id=game_id
        )
        
        # 9. DB 저장 (실제 구현 시)
        # await save_map_to_db(game_id, game_map_state)
        
        return game_map_state
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"맵 생성 중 오류 발생: {str(e)}"
        )

@router.get("{game_id}", response_model=GameMapState)
async def get_game_map(game_id: str):
    """게임 맵 정보 조회 API"""
    try:
        # DB에서 게임 맵 정보 조회 (실제 구현 시)
        # game_map = await load_map_from_db(game_id)
        
        # 임시 응답
        return {
            "tiles": [],
            "civs": [],
            "turn": 0,
            "game_id": game_id
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"맵 정보 조회 중 오류 발생: {str(e)}"
        )

# 도우미 함수들 (실제 DB 연동 시 구현)
async def save_map_to_db(game_id: str, map_state: GameMapState):
    """맵 상태를 DB에 저장"""
    # Prisma 또는 다른 ORM을 사용한 DB 저장 구현
    pass

async def load_map_from_db(game_id: str) -> GameMapState:
    """DB에서 맵 상태 로드"""
    # Prisma 또는 다른 ORM을 사용한 DB 조회 구현
    pass