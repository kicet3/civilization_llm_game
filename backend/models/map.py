
from enum import Enum
from pydantic import BaseModel
from typing import Optional,Dict,Any
from datetime import datetime
from typing import List

class MapType(str, Enum):
    """맵 타입 enum"""
    CONTINENTS = "대륙"      # Continents
    PANGAEA = "판게아"        # Pangaea
    ARCHIPELAGO = "섬"       # Archipelago
    FRACTAL = "무작위"        # Fractal
    SMALL_CONTINENTS = "작은대륙"  # Small Continents
    TERRA = "테라"            # Terra
    TILTED_AXIS = "기울어진축"   # Tilted Axis
    INLAND_SEA = "내륙해"     # Inland Sea
    SHUFFLE = "무작위"        # Shuffle
    DONUT = "도넛"            # Donut

class Difficulty(str, Enum):
    """난이도 enum"""
    SETTLER = "정착자"     # Settler
    CHIEFTAIN = "족장"    # Chieftain
    WARLORD = "군주"      # Warlord
    PRINCE = "왕자"       # Prince
    KING = "왕"          # King
    EMPEROR = "황제"      # Emperor
    IMMORTAL = "불멸"     # Immortal
    DEITY = "신"         # Deity


class TerrainType(str, Enum):
    """지형 타입 enum"""
    GRASSLAND = "grassland"
    PLAINS = "plains"
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
    # 전략 자원
    IRON = "iron"
    HORSES = "horses"
    COAL = "coal"
    OIL = "oil"
    ALUMINUM = "aluminum"
    URANIUM = "uranium"
    
    # 사치 자원
    GOLD = "gold"
    SILVER = "silver"
    GEMS = "gems"
    MARBLE = "marble"
    IVORY = "ivory"
    SILK = "silk"
    SPICES = "spices"
    WINE = "wine"
    
    # 기본 자원
    WHEAT = "wheat"
    CATTLE = "cattle"
    SHEEP = "sheep"
    BANANAS = "bananas"
    FISH = "fish"
    STONE = "stone"

class HexCoord(BaseModel):
    """육각형 타일 좌표"""
    q: int
    r: int
    s: int = 0
    
    def __init__(self, **data):
        super().__init__(**data)
        # 내부적으로 s = -q-r 관계를 유지
        self.s = -self.q - self.r

class TileResponse(BaseModel):
    """타일 정보 응답 모델"""
    q: int
    r: int
    s: int
    terrain: str
    resource: Optional[str] = None
    visible: bool
    explored: bool
    city: Optional[Dict[str, Any]] = None
    unit: Optional[Dict[str, Any]] = None

class TileSelectRequest(BaseModel):
    """타일 선택 요청 모델"""
    gameId: str
    q: int
    r: int

class MapResponse(BaseModel):
    """맵 정보 응답 모델"""
    id: str
    width: int
    height: int
    mapType: str
    hexagons: List[TileResponse]