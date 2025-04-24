// front/src/types/game.ts
// 게임 관련 타입 정의

// 지도 타입
export interface MapType {
  id: string;
  name: string;
  description: string;
}

// 난이도 타입
export interface Difficulty {
  id: string;
  name: string;
  description: string;
}

// 문명 타입
export interface Civilization {
  id: string;
  name: string;
  leader: string;
  specialAbility: string;
  // 추가 속성들은 백엔드 응답에 따라 선택적으로 추가
  type?: string;
  color?: string;
  unit?: string;
  building?: string;
}

// 게임 모드 타입
export interface GameMode {
  id: string;
  name: string;
  turns: string;
  estimatedTime: string;
  description: string;
}

// 승리 조건 타입
export interface VictoryType {
  id: string;
  name: string;
}

// 저장된 게임 타입
export interface SavedGame {
  id: string;
  name: string;
  date: string;
  civName: string;
  turn: number;
}

// 게임 옵션 타입
export interface GameOptions {
  mapTypes: MapType[];
  difficulties: Difficulty[];
  civilizations: Civilization[];
  gameModes: GameMode[];
  victoryTypes: VictoryType[];
}

// 게임 상태 타입
export interface GameState {
  id: string;
  turn: number;
  year: number;
  resources: {
    food: number;
    production: number;
    gold: number;
    science: number;
    culture: number;
    faith: number;
    happiness: number;
  };
  cities: City[];
  units: Unit[];
}

// 도시 타입
export interface City {
  id: number;
  name: string;
  owner: string;
  population: number;
  hp?: number;
  defense?: number;
  happiness?: number;
  food?: number;
  production?: number;
  gold?: number;
  science?: number;
  culture?: number;
  faith?: number;
  productionQueue?: { name: string; turnsLeft: number }[];
  garrisonedUnit?: string;
  foodToNextPop?: number;
  turnsLeft?: number;
  cultureToNextBorder?: number;
}

// 유닛 타입
export interface Unit {
  id: string;
  name: string;
  type: string;
  typeName: string;
  owner: string;
  hp: number;
  maxHp: number;
  movement: number;
  maxMovement: number;
  status: string;
  hasActed: boolean;
  location: {
    q: number;
    r: number;
    s: number;
  };
}

// 헥스 타일 타입
export interface HexTile {
  q: number;
  r: number;
  s: number;
  terrain: string;
  resource?: string;
  improvement?: string;
  naturalWonder?: string;
  visibility: 'unexplored' | 'fogOfWar' | 'visible';
  movementCost: number;
  yields: {
    food: number;
    production: number;
    gold: number;
    science: number;
    culture: number;
    faith: number;
  };
  city?: {
    name: string;
    owner: string;
    population: number;
  };
  unit?: Unit | null;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}