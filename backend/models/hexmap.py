from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
from enum import Enum

class TerrainType(str, Enum):
    """지형 타입 enum"""
    PLAINS = "plains"
    GRASSLAND = "grassland"
    HILLS = "hills"
    MOUNTAIN = "mountain"
    DESERT = "desert"
    TUNDRA = "tundra"
    SNOW = "snow"
    OCEAN = "ocean"
    COAST = "coast"
    FOREST = "forest"
    JUNGLE = "jungle"
    MARSH = "marsh"

class ResourceType(str, Enum):
    """자원 타입 enum"""
    IRON = "iron"
    HORSES = "horses"
    COAL = "coal"
    OIL = "oil"
    WHEAT = "wheat"
    CATTLE = "cattle"
    SHEEP = "sheep"
    GOLD = "gold"
    SILVER = "silver"
    GEMS = "gems"
    MARBLE = "marble"
    NONE = "none"
    FISH = "fish"

class HexCoord(BaseModel):
    """육각형 타일 좌표"""
    q: int
    r: int
    s: int = 0
    
    def __init__(self, **data):
        super().__init__(**data)
        # 내부적으로 s = -q-r 관계를 유지
        self.s = -self.q - self.r

class HexTile(BaseModel):
    """헥사곤 타일 모델"""
    q: int
    r: int
    s: int
    terrain: TerrainType
    resource: Optional[ResourceType] = ResourceType.NONE
    occupant: Optional[str] = None
    city_id: Optional[str] = None
    unit_id: Optional[str] = None
    visible: bool = False
    explored: bool = False

class Civilization(BaseModel):
    """문명 정보 모델"""
    name: str
    capital_tile: HexCoord
    units: List[str] = []

class MapInitRequest(BaseModel):
    """맵 초기화 요청 모델"""
    width: int = Field(default=11, ge=5, le=20)
    height: int = Field(default=9, ge=5, le=20)
    ai_civs: List[str] = ["Japan", "China", "Mongolia", "Russia", "Rome"]
    player_civ: str = "Korea"
    map_type: str = "continental"  # continental, pangaea, archipelago 등

class GameMapState(BaseModel):
    """게임 맵 상태 모델"""
    tiles: List[HexTile]
    civs: List[Civilization]
    turn: int = 0
    game_id: str