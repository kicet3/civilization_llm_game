from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from models.map import MapType, Difficulty

class GameSpeed(str, Enum):
    """게임 속도 enum"""
    FAST = "빠름"     # 100턴
    NORMAL = "보통"   # 250턴
    LONG = "장기"     # 500턴

class Difficulty(str, Enum):
    """난이도 enum"""
    SETTLER = "정착자"
    CHIEFTAIN = "족장"
    WARLORD = "군주"
    PRINCE = "왕자"
    KING = "왕"
    EMPEROR = "황제"
    IMMORTAL = "불멸"
    DEITY = "신"


class GameSessionResponse(BaseModel):
    """게임 세션 응답 모델"""
    id: str
    playerName: str
    mapType: str
    difficulty: str
    currentTurn: int
    gameSpeed: str
    createdAt: datetime
    updatedAt: datetime
    initialState: Optional[Dict[str, Any]] = None  # 초기 게임 상태 추가

class Event(BaseModel):
    """게임 이벤트 모델"""
    id: str
    type: str
    message: str
    importance: str
    metadata: Optional[Dict[str, Any]] = None

class GameState(BaseModel):
    """전체 게임 상태 모델"""
    gameId: str
    currentTurn: int
    playerName: str
    difficulty: str
    gameSpeed: str
    events: List[Event] = []
    
    # 이하는 필요에 따라 해당 상태의 요약 정보를 포함할 수 있음
    # 전체 세부 정보는 각 하위 엔드포인트에서 조회
    cities: Optional[List[Dict[str, Any]]] = None
    units: Optional[List[Dict[str, Any]]] = None
    research: Optional[Dict[str, Any]] = None
    policy: Optional[Dict[str, Any]] = None
    religion: Optional[Dict[str, Any]] = None
    diplomacy: Optional[Dict[str, Any]] = None


class GameSessionCreate(BaseModel):
    """게임 세션 생성을 위한 모델"""
    playerName: str
    mapType: MapType = MapType.CONTINENTS
    difficulty: Difficulty = Difficulty.PRINCE
    gameSpeed: str = "normal"  # 추후 enum으로 변경 가능
    playerCiv: str  # 선택한 문명 
    civCount: int = Field(default=8, ge=5, le=10)  # 문명 수 제한