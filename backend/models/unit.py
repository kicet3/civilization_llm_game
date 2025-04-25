from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from models.map import HexCoord

class UnitType(str, Enum):
    """유닛 타입 enum"""
    WARRIOR = "warrior"
    SWORDSMAN = "swordsman"
    KNIGHT = "knight"
    PIKEMAN = "pikeman"
    SCOUT = "scout"
    ARCHER = "archer"
    CATAPULT = "catapult"
    SETTLER = "settler"
    BUILDER = "builder"
    
    # 생산 비용 필드 추가 (턴 단위)
    productionCost: int = 1

class UnitStatus(str, Enum):
    """유닛 상태 enum"""
    IDLE = "대기"
    FORTIFIED = "요새화"
    ALERT = "경계"
    SLEEPING = "수면"
    MOVING = "이동 중"
    EXPLORING = "탐험 중"
    WORKING = "작업 중"
    TRADING = "무역 중"
    DEFENDING = "방어 중"

class UnitCommand(str, Enum):
    """유닛 명령 enum"""
    FORTIFY = "fortify"            # 요새화
    ALERT = "alert"                # 경계
    SLEEP = "sleep"                # 수면
    EXPLORE = "explore"            # 자동 탐험
    AUTO_WORK = "auto_work"        # 자동 작업
    AUTO_TRADE = "auto_trade"      # 자동 무역
    FOUND_CITY = "found_city"      # 도시 건설
    IMPROVE_TILE = "improve_tile"  # 타일 개선
    PILLAGE = "pillage"            # 약탈
    DELETE = "delete"              # 삭제

class UnitResponse(BaseModel):
    """유닛 정보 응답 모델"""
    id: str
    name: str
    type: str
    typeName: str
    hp: int
    movement: int
    maxMovement: int
    status: str
    location: Dict[str, int]  # q, r, s 좌표

class UnitMoveRequest(BaseModel):
    """유닛 이동 요청 모델"""
    gameId: str
    unitId: str
    to: HexCoord

class UnitCommandRequest(BaseModel):
    """유닛 명령 요청 모델"""
    gameId: str
    unitId: str
    command: UnitCommand
    targetId: Optional[str] = None  # 대상 ID (타일, 도시 등)