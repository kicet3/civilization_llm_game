
from enum import Enum
from pydantic import BaseModel
from typing import Optional,Dict,Any
from datetime import datetime
from typing import List

# models/map.py 파일
class MapType(str, Enum):
    """맵 타입 enum"""
    CONTINENTS = "continents"      
    PANGAEA = "pangaea"        
    ARCHIPELAGO = "archipelago"       
    FRACTAL = "fractal"        
    SMALL_CONTINENTS = "small_continents"  
    TERRA = "terra"            
    TILTED_AXIS = "tilted_axis"   
    INLAND_SEA = "inland_sea"     
    SHUFFLE = "shuffle"        
    DONUT = "donut"

class Difficulty(str, Enum):
    EASY   = "easy"
    NORMAL = "normal"
    HARD   = "hard"

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