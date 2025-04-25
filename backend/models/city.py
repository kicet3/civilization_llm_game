from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class ProductionType(str, Enum):
    """생산 아이템 타입 enum"""
    BUILDING = "building"
    UNIT = "unit"
    WONDER = "wonder"
    PROJECT = "project"

class BuildingType(str, Enum):
    """건물 타입 enum"""
    CULTURE = "culture"
    SCIENCE = "science"
    PRODUCTION = "production"
    GOLD = "gold"
    FOOD = "food"
    MILITARY = "military"
    RELIGIOUS = "religious"
    WONDER = "wonder"

class CitySpecialization(str, Enum):
    """도시 특화 타입 enum"""
    FOOD = "food"
    PRODUCTION = "production"
    GOLD = "gold"
    SCIENCE = "science"
    CULTURE = "culture"
    FAITH = "faith"
    BALANCED = "balanced"

class Building(BaseModel):
    """건물 정보 모델"""
    id: str
    name: str
    effects: Optional[Dict[str, Any]] = None

class ProductionQueueItem(BaseModel):
    """생산 대기열 아이템 모델"""
    id: Optional[int] = None
    itemType: ProductionType
    itemId: str
    name: str
    turnsLeft: int
    queueOrder: int

class CityResponse(BaseModel):
    """도시 정보 응답 모델"""
    id: str
    name: str
    population: int
    hp: int
    defense: int
    food: int
    production: int
    gold: int
    science: int
    culture: int
    faith: int
    happiness: int
    
    currentProduction: Optional[str] = None
    turnsLeft: Optional[int] = None
    productionQueue: List[ProductionQueueItem] = []
    foodToNextPop: int
    cultureToNextBorder: int
    
    # 도시 위치 좌표 (추가됨)
    location: Dict[str, int]
    
    # 건물 목록
    buildings: List[Building] = []

class CityProduceRequest(BaseModel):
    """도시 생산 요청 모델"""
    gameId: str
    cityId: str
    itemType: ProductionType
    itemId: str

class CitySpecializeRequest(BaseModel):
    """도시 특화 요청 모델"""
    gameId: str
    cityId: str
    specialization: CitySpecialization