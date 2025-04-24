from fastapi import APIRouter, HTTPException, status
from typing import List, Dict,Any
# 상대 경로 대신 절대 경로 사용
from models.map import MapType, Difficulty
from prisma.models import Hexagon, Terrain, Resource
from models.map import MapResponse, TileResponse, TileSelectRequest
from core.config import prisma_client
router = APIRouter()

@router.get("/options", response_model=Dict[str, List[Dict[str, str]]])
async def get_game_options():
    """게임 옵션 목록 반환"""
    try:
        map_types = [
            {
                "id": map_type.value,
                "name": map_type.name,
                "description": get_map_type_description(map_type)
            } for map_type in MapType
        ]
        
        difficulties = [
            {
                "id": difficulty.value,
                "name": difficulty.name,
                "description": get_difficulty_description(difficulty)
            } for difficulty in Difficulty
        ]
        
        return {
            "mapTypes": map_types,
            "difficulties": difficulties
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"게임 옵션 조회 중 오류 발생: {str(e)}"
        )

def get_map_type_description(map_type: MapType) -> str:
    """맵 타입별 설명 반환"""
    descriptions = {
        MapType.CONTINENTS: "2개 이상의 큰 대륙으로 나뉜 지도. 중후반에 해상 탐사와 해군력이 중요한 전략 유형",
        MapType.PANGAEA: "하나의 거대한 대륙으로 구성. 육지 전쟁과 빠른 접촉이 핵심인 전략 유형",
        MapType.ARCHIPELAGO: "섬이 많은 지도. 해군 중심으로 해양 탐험과 도시 확장 전략에 유리",
        MapType.FRACTAL: "랜덤한 대륙/지형 생성. 예측 불가능하고 리플레이성이 높은 전략 유형",
        MapType.SMALL_CONTINENTS: "여러 개의 중간 규모 대륙. 해군과 육군을 균형 있게 사용 가능",
        MapType.TERRA: "모두 같은 대륙에서 시작하며 신대륙 존재. 신대륙 탐험이 중요한 변수",
        MapType.TILTED_AXIS: "지도가 남북이 아닌 동서로 길게 배치. 이상한 기후와 전략 요구",
        MapType.INLAND_SEA: "가운데 바다, 주변 육지. 해상 전투는 제한적이나 중심 바다를 두고 경쟁 가능",
        MapType.SHUFFLE: "무작위로 지도 유형 섞임. 전략 예측이 어렵고 도전적인 플레이",
        MapType.DONUT: "가운데가 비어 있고 주변에 땅. 가운데 지역 장악이 핵심 전략"
    }
    return descriptions.get(map_type, "")

def get_difficulty_description(difficulty: Difficulty) -> str:
    """난이도별 설명 반환"""
    descriptions = {
        Difficulty.SETTLER: "입문: 전략 게임이 처음이거나 쉬운 난이도를 원하는 분께 추천",
        Difficulty.CHIEFTAIN: "초급: 기본적인 게임 메커니즘을 익히기 좋은 난이도",
        Difficulty.WARLORD: "중급: 기본 전략을 습득한 플레이어에게 적합",
        Difficulty.PRINCE: "표준: 균형 잡힌 도전을 원하는 분께 추천",
        Difficulty.KING: "고급: 전략적 사고와 세부 관리 능력이 요구되는 난이도",
        Difficulty.EMPEROR: "최상급: 고도의 전략과 빠른 의사결정이 필요한 난이도",
        Difficulty.IMMORTAL: "최고난도: 매우 공격적이고 빠르게 성장하는 AI와 대결",
        Difficulty.DEITY: "신급: 거의 불가능한 수준의 도전을 원하는 고수를 위한 난이도"
    }
    return descriptions.get(difficulty, "")

@router.get("", response_model=Dict[str, Any])
async def get_map(gameId: str):
    """현재 맵 전체 정보 반환"""
    try:
        # 맵 정보 조회
        # 해당 게임 세션의 모든 타일 조회
        hexagons = await prisma_client.hexagon.find_many(
            where={"session_id": gameId},
            include={
                "terrain": True,
                "resource": True
            }
        )
        
        if not hexagons:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="해당 게임 세션의 맵을 찾을 수 없습니다"
            )
        
        # 맵 메타데이터 (크기, 타입)
        game = await prisma_client.gamesession.find_unique(
            where={"id": gameId}
        )
        
        if not game:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="해당 게임 세션을 찾을 수 없습니다"
            )
        
        # 맵 크기 계산 (최대 q, r 값으로 추정)
        max_q = max([h.q for h in hexagons]) if hexagons else 0
        max_r = max([h.r for h in hexagons]) if hexagons else 0
        
        # 도시 및 유닛 정보 조회
        cities = await prisma_client.city.find_many(
            where={"session_id": gameId}
        )
        
        units = await prisma_client.unit.find_many(
            where={"session_id": gameId}
        )
        
        # 도시와 유닛 위치 매핑
        city_map = {(city.loc_q, city.loc_r): city for city in cities if city.loc_q is not None and city.loc_r is not None}
        unit_map = {(unit.loc_q, unit.loc_r): unit for unit in units if unit.loc_q is not None and unit.loc_r is not None}
        
        # 타일 응답 형식으로 변환
        tile_responses = []
        for hex in hexagons:
            city = city_map.get((hex.q, hex.r))
            unit = unit_map.get((hex.q, hex.r))
            
            tile_responses.append({
                "q": hex.q,
                "r": hex.r,
                "s": hex.s,
                "terrain": hex.terrain.id if hex.terrain else "unknown",
                "resource": hex.resource.id if hex.resource else None,
                "visible": True,  # 실제 게임 로직에서는 시야 여부 계산 필요
                "explored": True, # 실제 게임 로직에서는 탐험 여부 계산 필요
                "city": {"id": city.id, "name": city.name} if city else None,
                "unit": {"id": unit.id, "type": unit.unit_type_id} if unit else None
            })
        
        return {
            "hexagons": tile_responses,
            "width": max_q + 1,
            "height": max_r + 1,
            "mapType": game.map_type
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"맵 정보 조회 중 오류 발생: {str(e)}"
        )

@router.post("/select", response_model=Dict[str, Any])
async def select_tile(request: TileSelectRequest):
    """특정 타일 선택 및 상세 정보 조회"""
    try:
        # 타일 정보 조회
        hexagon = await prisma_client.hexagon.find_unique(
            where={
                "session_id_q_r_s": {
                    "session_id": request.gameId,
                    "q": request.q,
                    "r": request.r,
                    "s": -request.q - request.r  # s 좌표 계산
                }
            },
            include={
                "terrain": True,
                "resource": True
            }
        )
        
        if not hexagon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="해당 타일을 찾을 수 없습니다"
            )
        
        # 해당 타일에 있는 도시 및 유닛 조회
        city = await prisma_client.city.find_first(
            where={
                "session_id": request.gameId,
                "loc_q": request.q,
                "loc_r": request.r
            }
        )
        
        unit = await prisma_client.unit.find_first(
            where={
                "session_id": request.gameId,
                "loc_q": request.q,
                "loc_r": request.r
            },
            include={"unit_type": True}
        )
        
        # 타일 상세 정보 반환
        return {
            "hexagon": {
                "q": hexagon.q,
                "r": hexagon.r,
                "s": hexagon.s,
                "terrain": hexagon.terrain.id if hexagon.terrain else "unknown",
                "resource": hexagon.resource.id if hexagon.resource else None,
                "visible": True,  # 실제 게임 로직에서는 시야 여부 계산 필요
                "explored": True, # 실제 게임 로직에서는 탐험 여부 계산 필요
                "yields": {
                    "food": 0,    # 실제 게임 로직에서는 산출량 계산 필요
                    "production": 0,
                    "gold": 0,
                    "science": 0,
                    "culture": 0
                },
                "city": {
                    "id": city.id,
                    "name": city.name,
                    "owner": city.owner_player_id
                } if city else None,
                "unit": {
                    "id": unit.id,
                    "type": unit.unit_type_id,
                    "typeName": unit.unit_type.name if unit.unit_type else "Unknown",
                    "owner": unit.owner_player_id,
                    "movement": unit.movement,
                    "status": unit.status
                } if unit else None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"타일 선택 중 오류 발생: {str(e)}"
        )