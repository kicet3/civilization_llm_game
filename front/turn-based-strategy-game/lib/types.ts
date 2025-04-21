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