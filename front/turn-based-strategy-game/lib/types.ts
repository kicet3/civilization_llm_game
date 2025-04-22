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
  // 안개 시스템을 위한 확장
  visible?: boolean;
  explored?: boolean;
  // 지형 효과를 위한 확장
  movementCost?: number;
  defenseBonus?: number;
  foodBonus?: number;
  productionBonus?: number;
  goldBonus?: number;
}

// 위치 타입
export interface Position {
  q: number;
  r: number;
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

// 유닛 타입
export interface Unit {
  id: number;
  name: string;
  type: 'military' | 'civilian' | 'naval' | 'flying';
  strength?: number;
  movement: number;
  movementLeft?: number;
  position: Position;
  owner: 'player' | 'ai';
  level?: number;
  experience?: number;
  abilities?: string[];
  // 유닛 시야 관련 추가
  visionRange?: number;
  // 유닛 상태 관련 추가
  isAwake?: boolean;
  isFortified?: boolean;
  fortificationTurns?: number;
}

// 도시 타입
export interface City {
  id: number;
  name: string;
  owner: 'player' | 'ai';
  population: number;
  buildings: string[];
  position: Position;
  // 도시 생산량 관련 확장
  foodProduction?: number;
  productionPoints?: number;
  currentProduction?: string | null;
  // 도시 성장 관련 확장
  food?: number;
  foodToGrow?: number;
  growth?: number;
  // 도시 영역 관련 확장
  workingTiles?: Position[];
  cityRadius?: number;
}

// NPC 대화 타입
export interface NpcDialog {
  id: number;
  npcName: string;
  message: string;
  relationship: '동맹' | '중립' | '적대';
  // 대화 옵션 관련 확장
  options?: DialogOption[];
}

// 대화 옵션 타입
export interface DialogOption {
  id: number;
  text: string;
  effect?: {
    gold?: number;
    relationship?: number;
    resource?: {
      type: 'food' | 'wood' | 'iron';
      amount: number;
    }
  }
}

// 게임 이벤트 타입
export interface GameEvent {
  id: number;
  title: string;
  description: string;
  type: 'science' | 'disaster' | 'diplomatic' | 'cultural';
  // 이벤트 효과 관련 확장
  effects?: EventEffect[];
  // 이벤트 선택지 관련 확장
  choices?: EventChoice[];
}

// 이벤트 효과 타입
export interface EventEffect {
  target: 'gold' | 'science' | 'culture' | 'food' | 'wood' | 'iron' | 'population' | 'relationship';
  amount: number;
  cityId?: number; // 특정 도시에 적용되는 효과인 경우
  nationId?: number; // 특정 국가와의 관계 변화인 경우
}

// 이벤트 선택지 타입
export interface EventChoice {
  id: number;
  text: string;
  effects: EventEffect[];
}

// 시야 상태 타입
export type TileVisibility = 'visible' | 'explored' | 'hidden';

// 퀘스트 타입
export interface Quest {
  id: number;
  title: string;
  description: string;
  reward: QuestReward;
  completed: boolean;
  requirements: QuestRequirement[];
}

// 퀘스트 보상 타입
export interface QuestReward {
  gold?: number;
  science?: number;
  culture?: number;
  resources?: {
    food?: number;
    wood?: number;
    iron?: number;
  };
  unit?: string; // 유닛 ID
  technology?: string; // 기술 ID
}

// 퀘스트 요구사항 타입
export interface QuestRequirement {
  type: 'kill' | 'explore' | 'build' | 'research' | 'population';
  target: string;
  count: number;
  progress: number;
}

// 맵 뷰포트 타입
export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

// 안개 설정 타입
export interface FogSettings {
  enabled: boolean;
  revealExplored: boolean;
  fadeSpeed: number;
}