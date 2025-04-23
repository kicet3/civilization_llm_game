from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ReligionState(BaseModel):
    """종교 상태 응답 모델"""
    faith: int = 0
    religions: List[Dict[str, Any]] = []
    selectedDoctrines: List[str] = []

class DoctrineResponse(BaseModel):
    """교리 정보 응답 모델"""
    id: str
    name: str
    tier: int
    effects: Dict[str, Any] = {}

class ReligionFoundRequest(BaseModel):
    """종교 창시 요청 모델"""
    gameId: str
    religionName: str

class DoctrineSelectRequest(BaseModel):
    """교리 선택 요청 모델"""
    gameId: str
    doctrineId: str