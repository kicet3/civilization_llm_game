from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from models.map import MapType, Difficulty

class GameSpeed(str, Enum):
    """게임 속도 구분"""
    QUICK = "quick"         # 25턴 (속전속결)
    STANDARD = "standard"   # 50턴 (중간 템포)
    EPIC = "epic"           # 100턴 (완전 트리 & 전술)

class GamePhase(str, Enum):
    """게임 진행 단계"""
    EARLY = "early"         # 개막기
    MID = "mid"             # 중반기
    LATE = "late"           # 종반기
    FINAL = "final"         # 후반 중기 (100턴 시나리오만)

class VictoryType(str, Enum):
    """승리 유형"""
    DOMINATION = "domination"   # 정복
    CULTURAL = "cultural"       # 문화
    SCIENTIFIC = "scientific"   # 과학
    DIPLOMATIC = "diplomatic"   # 외교
    
class GameState(str, Enum):
    WAITING = "waiting"
    ONGOING = "ongoing"
    FINISHED = "finished"

class GameSessionResponse(BaseModel):
    """게임 세션 응답 모델"""
    id: str
    playerName: str
    mapType: str
    difficulty: Difficulty
    currentTurn: int
    gameSpeed: str
    createdAt: datetime
    updatedAt: datetime
    initialState: Dict[str, Any] = {}
    
class GameOptions(BaseModel):
    """게임 옵션 모델"""
    mapTypes: List[Dict[str, str]]
    difficulties: List[Dict[str, str]]
    civilizations: List[Dict[str, str]]
    gameSpeeds: List[Dict[str, str]]

class GameOptionsResponse(BaseModel):
    """게임 옵션 응답 모델"""
    options: GameOptions

class ScenarioObjective(BaseModel):
    """시나리오 목표 모델"""
    id: str
    description: str
    completed: bool = False
    category: str  # exploration, expansion, economy, military, research
    reward: Dict[str, Any] = {}

class TurnPhaseInfo(BaseModel):
    """턴 단계별 정보 모델"""
    phase: GamePhase
    turn_range: List[int]
    main_goal: str
    keywords: List[str]
    objectives: List[ScenarioObjective]

class GameScenario(BaseModel):
    """게임 시나리오 모델"""
    game_id: str
    speed: GameSpeed
    phases: List[TurnPhaseInfo]
    current_phase: GamePhase = GamePhase.EARLY
    victory_path: Optional[VictoryType] = None

class GameTurnInfo(BaseModel):
    """턴 정보 모델"""
    turn: int
    phase: GamePhase
    year: int
    objectives: List[Dict[str, Any]]
    recommended_actions: List[str]

class TurnEndRequest(BaseModel):
    """턴 종료 요청 모델"""
    game_id: str
    player_id: str
    
class TurnEndResponse(BaseModel):
    """턴 종료 응답 모델"""
    game_id: str
    next_turn: int
    turn_info: GameTurnInfo
    events: List[Dict[str, Any]] = []
    ai_actions: List[Dict[str, Any]] = []

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
    difficulty: Difficulty = Difficulty.NORMAL
    gameSpeed: GameSpeed = GameSpeed.STANDARD
    playerCiv: str  # 선택한 문명 
    civCount: int = Field(default=8, ge=5, le=10)  # 문명 수 제한



    