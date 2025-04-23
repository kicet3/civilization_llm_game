from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class PolicyTree(str, Enum):
    """정책 트리 enum"""
    TRADITION = "전통"
    LIBERTY = "자유"
    HONOR = "명예"
    PIETY = "신앙"
    PATRONAGE = "후원"
    AESTHETICS = "미학"
    COMMERCE = "상업"
    EXPLORATION = "탐험"
    RATIONALISM = "합리"

class PolicyState(BaseModel):
    """정책 상태 응답 모델"""
    adoptedPolicies: List[str] = []
    culture: int = 0

class PolicyResponse(BaseModel):
    """정책 정보 응답 모델"""
    id: str
    name: str
    tree: str
    cultureCost: int
    effects: Dict[str, Any] = {}

class PolicyAdoptRequest(BaseModel):
    """정책 채택 요청 모델"""
    gameId: str
    policyId: str