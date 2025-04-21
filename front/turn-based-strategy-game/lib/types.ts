// 게임 상태 타입
export interface GameState {
    version: string;
    turn: number;
    year: string;
    playerInfo: PlayerInfo;
    diplomacy: DiplomacyRelation[];
  }
  
  // 플레이어 정보 타입
  export interface PlayerInfo {
    name: string;
    nation: string;
    gold: number;
    science: number;
    culture: number;
    resources: {
      food: number;
      wood: number;
      iron: number;
    };
  }
  
  // 외교 관계 타입
  export interface DiplomacyRelation {
    nationId: number;
    name: string;
    relationship: number;
    status: '동맹' | '중립' | '적대';
  }
  
  // 맵 타일 타입
  export interface HexTile {
    q: number;
    r: number;
    s: number;
    terrain: 'plain' | 'mountain' | 'forest' | 'water' | 'desert';
    hasUnit: boolean;
    hasCity: boolean;
    owner: 'player' | 'ai' | null;
  }
  
  // 위치 타입
  export interface Position {
    q: number;
    r: number;
  }
  
  // 유닛 타입
  export interface Unit {
    id: number;
    name: string;
    type: 'military' | 'civilian';
    strength?: number;
    movement: number;
    position: Position;
  }
  
  // 도시 타입
  export interface City {
    id: number;
    name: string;
    owner: 'player' | 'ai';
    population: number;
    buildings: string[];
    position: Position;
  }
  
  // NPC 대화 타입
  export interface NpcDialog {
    id: number;
    npcName: string;
    message: string;
    relationship: '동맹' | '중립' | '적대';
  }
  
  // 게임 이벤트 타입
  export interface GameEvent {
    id: number;
    title: string;
    description: string;
    type: 'science' | 'disaster' | 'diplomatic' | 'cultural';
  }

  // 게임 상태 타입
export interface GameState {
  version: string;
  turn: number;
  year: string;
  playerInfo: PlayerInfo;
  diplomacy: DiplomacyRelation[];
}

// 플레이어 정보 타입
export interface PlayerInfo {
  name: string;
  nation: string;
  gold: number;
  science: number;
  culture: number;
  resources: {
    food: number;
    wood: number;
    iron: number;
  };
}

// 외교 관계 타입
export interface DiplomacyRelation {
  nationId: number;
  name: string;
  relationship: number;
  status: '동맹' | '중립' | '적대';
}

// 맵 타일 타입
export interface HexTile {
  q: number;
  r: number;
  s: number;
  terrain: 'plain' | 'mountain' | 'forest' | 'water' | 'desert';
  hasUnit: boolean;
  hasCity: boolean;
  owner: 'player' | 'ai' | null;
  resource?: 'iron' | 'horses' | 'oil' | 'uranium' | 'gems';
}

// 위치 타입
export interface Position {
  q: number;
  r: number;
}

// 유닛 타입
export interface Unit {
  id: number;
  name: string;
  type: 'military' | 'civilian' | 'special';
  strength?: number;
  movement: number;
  movementLeft: number;
  position: Position;
  level?: number;
  experience?: number;
  abilities?: string[];
}

// 유닛 유형 타입
export interface UnitType {
  id: string;
  name: string;
  category: 'military' | 'civilian' | 'special';
  strength?: number;
  movement: number;
  goldCost: number;
  ironCost: number;
  requiredTech?: string;
  abilities?: string[];
}

// 도시 타입
export interface City {
  id: number;
  name: string;
  owner: 'player' | 'ai';
  population: number;
  buildings: string[]; // Building IDs
  position: Position;
  foodProduction?: number;
  productionPoints?: number;
  currentProduction?: string | null; // ID of unit or building being produced
}

// 건물 타입
export interface Building {
  id: string;
  name: string;
  description: string;
  goldCost: number;
  woodCost: number;
  ironCost: number;
  productionCost?: number;
  requiredTech?: string;
  foodBonus?: number;
  productionBonus?: number;
  scienceBonus?: number;
  goldBonus?: number;
  cultureBonus?: number;
  woodBonus?: number;
  ironBonus?: number;
}

// 자원 생산 타입
export interface ResourceProduction {
  food: number;
  production: number;
  science: number;
  gold: number;
  culture: number;
}

// 기술 타입
export interface Technology {
  id: string;
  name: string;
  description: string;
  era: 'ancient' | 'classical' | 'medieval' | 'renaissance' | 'industrial' | 'modern';
  cost: number;
  prerequisites: string[];
  researched: boolean;
  unlocksUnits?: string[];
  unlocksBuildings?: string[];
}

// NPC 대화 타입
export interface NpcDialog {
  id: number;
  npcName: string;
  message: string;
  relationship: '동맹' | '중립' | '적대';
}

// 게임 이벤트 타입
export interface GameEvent {
  id: number;
  title: string;
  description: string;
  type: 'science' | 'disaster' | 'diplomatic' | 'cultural';
}