from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class DiplomaticStatus(str, Enum):
    """외교 상태 enum"""
    WAR = "전쟁"
    PEACE = "평화"
    ALLIANCE = "동맹"
    DEFENSIVE_PACT = "방어 협약"
    OPEN_BORDERS = "국경 개방"
    DENOUNCED = "비난"
    DECLARED_FRIEND = "우호 선언"

class DiplomaticCommand(str, Enum):
    """외교 명령 enum"""
    DECLARE_WAR = "declare_war"
    MAKE_PEACE = "make_peace"
    PROPOSE_ALLIANCE = "propose_alliance"
    PROPOSE_DEFENSIVE_PACT = "propose_defensive_pact"
    PROPOSE_OPEN_BORDERS = "propose_open_borders"
    DENOUNCE = "denounce"
    DECLARE_FRIENDSHIP = "declare_friendship"
    TRADE = "trade"

class DiplomacyState(BaseModel):
    """외교 상태 응답 모델"""
    civs: List[Dict[str, Any]] = []
    cityStates: List[Dict[str, Any]] = []
    relations: Dict[str, Dict[str, Any]] = {}

class CivResponse(BaseModel):
    """문명 정보 응답 모델"""
    id: str
    name: str
    leader: str
    status: str
    relationValue: int = 0
    treats: List[Dict[str, Any]] = []

class CityStateResponse(BaseModel):
    """도시국가 정보 응답 모델"""
    id: str
    name: str
    type: str
    influence: int = 0
    isAllied: bool = False

class DiplomacyCommandRequest(BaseModel):
    """외교 명령 요청 모델"""
    gameId: str
    targetId: str
    command: DiplomaticCommand
    details: Optional[Dict[str, Any]] = None