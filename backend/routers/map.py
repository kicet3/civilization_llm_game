from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from prisma.models import Hexagon, Terrain, Resource
from ..models.map import MapResponse, TileResponse, TileSelectRequest
from ..core.config import prisma_client

router = APIRouter()

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