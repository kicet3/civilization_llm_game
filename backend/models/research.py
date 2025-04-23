from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class Era(str, Enum):
    """기술 시대 enum"""
    ANCIENT = "고대"
    CLASSICAL = "고전"
    MEDIEVAL = "중세"
    RENAISSANCE = "르네상스"
    INDUSTRIAL = "산업"
    MODERN = "현대"
    INFORMATION = "정보"

class ResearchState(BaseModel):
    """연구 상태 응답 모델"""
    currentTechId: Optional[str] = None  # 현재 연구 중인 기술 ID
    researchedTechIds: List[str] = []    # 연구 완료된 기술 ID 목록
    progress: Dict[str, int] = {}        # 기술별 연구 진행도

class TechResponse(BaseModel):
    """기술 정보 응답 모델"""
    id: str
    name: str
    description: Optional[str] = None
    era: Optional[str] = None
    cost: int = 0
    prerequisites: List[str] = []  # 선행 기술 ID 목록
    unlocks: List[str] = []        # 해금되는 건물, 유닛, 기술 등의 ID 목록

class ResearchStartRequest(BaseModel):
    """기술 연구 시작 요청 모델"""
    gameId: str
    techId: str