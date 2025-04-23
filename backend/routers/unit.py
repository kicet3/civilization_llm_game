from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from prisma.models import Unit, UnitType
from ..models.unit import UnitResponse, UnitMoveRequest, UnitCommandRequest, UnitCommand
from ..core.config import prisma_client

router = APIRouter()

@router.get("", response_model=Dict[str, Any])
async def get_units(gameId: str):
    """특정 게임 세션의 모든 유닛 정보 반환"""
    try:
        # 유닛 정보 조회
        units = await prisma_client.unit.find_many(
            where={"session_id": gameId},
            include={"unit_type": True}
        )
        
        unit_responses = []
        for unit in units:
            unit_responses.append({
                "id": unit.id,
                "name": unit.unit_type.name if unit.unit_type else "Unknown",
                "type": unit.unit_type_id,
                "typeName": unit.unit_type.name if unit.unit_type else "Unknown",
                "hp": unit.hp or 100,
                "movement": unit.movement or 0,
                "maxMovement": unit.max_movement or 2,
                "status": unit.status or "대기",
                "location": {
                    "q": unit.loc_q or 0,
                    "r": unit.loc_r or 0,
                    "s": unit.loc_s or 0
                }
            })
        
        return {"units": unit_responses}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"유닛 정보 조회 중 오류 발생: {str(e)}"
        )

@router.post("/move", response_model=Dict[str, Any])
async def unit_move(request: UnitMoveRequest):
    """유닛 이동"""
    try:
        # 유닛 존재 여부 확인
        unit = await prisma_client.unit.find_unique(
            where={"id": int(request.unitId)},
            include={"unit_type": True}
        )
        
        if not unit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="해당 유닛을 찾을 수 없습니다"
            )
        
        # 이동 가능한 이동력 확인
        if unit.movement <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이동력이 부족합니다"
            )
        
        # 목적지 타일 확인
        destination = await prisma_client.hexagon.find_unique(
            where={
                "session_id_q_r_s": {
                    "session_id": request.gameId,
                    "q": request.to.q,
                    "r": request.to.r,
                    "s": request.to.s
                }
            }
        )
        
        if not destination:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="목적지 타일을 찾을 수 없습니다"
            )
        
        # 이동력 소모 계산 (실제 게임 로직에서는 지형, 도로 등에 따라 복잡한 계산 필요)
        # 여기서는 간단히 1로 고정
        movement_cost = 1
        
        # 이동력 업데이트
        new_movement = max(0, unit.movement - movement_cost)
        
        # 유닛 위치 및 이동력 업데이트
        updated_unit = await prisma_client.unit.update(
            where={"id": int(request.unitId)},
            data={
                "loc_q": request.to.q,
                "loc_r": request.to.r,
                "loc_s": request.to.s,
                "movement": new_movement,
                "status": "이동 중" if new_movement > 0 else "대기"
            }
        )
        
        # 이동 이벤트 기록
        await prisma_client.gameevent.create(
            data={
                "session_id": request.gameId,
                "event_type": "unit_moved",
                "event_data": {
                    "unit_id": unit.id,
                    "from": {"q": unit.loc_q, "r": unit.loc_r, "s": unit.loc_s},
                    "to": {"q": request.to.q, "r": request.to.r, "s": request.to.s}
                }
            }
        )
        
        return {
            "unit": {
                "id": updated_unit.id,
                "name": unit.unit_type.name if unit.unit_type else "Unknown",
                "type": updated_unit.unit_type_id,
                "typeName": unit.unit_type.name if unit.unit_type else "Unknown",
                "hp": updated_unit.hp or 100,
                "movement": updated_unit.movement or 0,
                "maxMovement": updated_unit.max_movement or 2,
                "status": updated_unit.status or "대기",
                "location": {
                    "q": updated_unit.loc_q or 0,
                    "r": updated_unit.loc_r or 0,
                    "s": updated_unit.loc_s or 0
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"유닛 이동 중 오류 발생: {str(e)}"
        )

@router.post("/command", response_model=Dict[str, Any])
async def unit_command(request: UnitCommandRequest):
    """유닛 명령 수행"""
    try:
        # 유닛 존재 여부 확인
        unit = await prisma_client.unit.find_unique(
            where={"id": int(request.unitId)},
            include={"unit_type": True}
        )
        
        if not unit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="해당 유닛을 찾을 수 없습니다"
            )
        
        # 유닛 유형 확인 및 커맨드 유효성 검사
        # 예: 정착민만 도시 건설 가능, 노동자만 타일 개선 가능 등
        if request.command == UnitCommand.FOUND_CITY and unit.unit_type_id != "settler":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="정착민만 도시를 건설할 수 있습니다"
            )
        
        if request.command == UnitCommand.IMPROVE_TILE and unit.unit_type_id != "worker":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="노동자만 타일을 개선할 수 있습니다"
            )
        
        # 명령 실행 로직
        status_update = "대기"  # 기본 상태
        
        if request.command == UnitCommand.FORTIFY:
            status_update = "요새화"
        elif request.command == UnitCommand.ALERT:
            status_update = "경계"
        elif request.command == UnitCommand.SLEEP:
            status_update = "수면"
        elif request.command == UnitCommand.EXPLORE:
            status_update = "탐험 중"
        elif request.command == UnitCommand.AUTO_WORK:
            status_update = "작업 중"
        elif request.command == UnitCommand.AUTO_TRADE:
            status_update = "무역 중"
        elif request.command == UnitCommand.FOUND_CITY:
            # 도시 건설 로직 (정착민 소모)
            if not request.targetId:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="도시 이름이 필요합니다"
                )
            
            # 도시 생성
            await prisma_client.city.create(
                data={
                    "session_id": request.gameId,
                    "name": request.targetId,  # 도시 이름으로 targetId 사용
                    "owner_player_id": unit.owner_player_id,
                    "population": 1,
                    "loc_q": unit.loc_q,
                    "loc_r": unit.loc_r,
                    "loc_s": unit.loc_s,
                    "hp": 100,
                    "defense": 0,
                    "food": 0,
                    "production": 0,
                    "gold": 0,
                    "science": 0,
                    "culture": 0,
                    "faith": 0,
                    "happiness": 0,
                    "food_to_next_pop": 10,
                    "culture_to_next_border": 10
                }
            )
            
            # 정착민 제거
            await prisma_client.unit.delete(
                where={"id": int(request.unitId)}
            )
            
            # 이벤트 기록
            await prisma_client.gameevent.create(
                data={
                    "session_id": request.gameId,
                    "event_type": "city_founded",
                    "event_data": {
                        "city_name": request.targetId,
                        "player_id": unit.owner_player_id,
                        "location": {"q": unit.loc_q, "r": unit.loc_r, "s": unit.loc_s}
                    }
                }
            )
            
            return {
                "unit": None,
                "message": f"{request.targetId} 도시가 건설되었습니다."
            }
        
        elif request.command == UnitCommand.IMPROVE_TILE:
            # 타일 개선 로직
            status_update = "작업 중"
            # 실제 게임에서는 여기에 타일 개선 로직 추가
        
        elif request.command == UnitCommand.DELETE:
            # 유닛 삭제
            await prisma_client.unit.delete(
                where={"id": int(request.unitId)}
            )
            
            return {
                "unit": None,
                "message": "유닛이 해산되었습니다."
            }
        
        # 유닛 상태 업데이트
        updated_unit = await prisma_client.unit.update(
            where={"id": int(request.unitId)},
            data={
                "status": status_update
            }
        )
        
        # 명령 이벤트 기록
        await prisma_client.gameevent.create(
            data={
                "session_id": request.gameId,
                "event_type": "unit_command",
                "event_data": {
                    "unit_id": unit.id,
                    "command": request.command,
                    "status": status_update
                }
            }
        )
        
        return {
            "unit": {
                "id": updated_unit.id,
                "name": unit.unit_type.name if unit.unit_type else "Unknown",
                "type": updated_unit.unit_type_id,
                "typeName": unit.unit_type.name if unit.unit_type else "Unknown",
                "hp": updated_unit.hp or 100,
                "movement": updated_unit.movement or 0,
                "maxMovement": updated_unit.max_movement or 2,
                "status": updated_unit.status,
                "location": {
                    "q": updated_unit.loc_q or 0,
                    "r": updated_unit.loc_r or 0,
                    "s": updated_unit.loc_s or 0
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"유닛 명령 수행 중 오류 발생: {str(e)}"
        )