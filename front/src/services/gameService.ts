// src/services/gameService.ts

/**
 * 문명 게임 백엔드 API와 통신하기 위한 서비스
 * 헥스 그리드 모델, 유닛 이동, 안개 제거, 자연경관, 외교 등의 기능 포함
 */

export interface HexTile {
  q: number;  // 축 좌표
  r: number;  // 축 좌표
  s: number;  // 축 좌표 (q+r+s=0)
  terrain: string;
  resource?: string | null;
  naturalWonder?: string | null;
  improvement?: string | null;
  owner?: string | null;
  visibility: 'visible' | 'fogOfWar' | 'unexplored';
  city?: City | null;
  unit?: Unit | null;
  movementCost: number; // 지형별 이동 비용
  yields: {
    food: number;
    production: number;
    gold: number;
    science: number;
    culture: number;
    faith: number;
  }
}

export interface City {
  id: number;
  name: string;
  population: number;
  production: string;
  turnsLeft: number;
  food: number;
  gold: number;
  science: number;
  culture: number;
  faith: number;
  happiness: number;
  hp: number;
  defense: number;
  garrisonedUnit?: string | null;
  productionQueue: { name: string; turnsLeft: number }[];
  foodToNextPop: number;
  cultureToNextBorder: number;
}

export interface Unit {
  id: string;
  name: string;
  type: string;
  typeName: string;
  hp: number;
  maxHp: number;
  movement: number;
  maxMovement: number;
  status: string;
  location: { q: number; r: number; s: number };
  hasActed: boolean;
  path?: { q: number; r: number; s: number }[];
}

export interface DiplomacyState {
  civs: {
    id: string;
    name: string;
    personality: string;
    relation: string;
    discovered: boolean; // 발견 여부
  }[];
  cityStates: {
    id: string;
    name: string;
    type: string;
    relation: number;
    ally: boolean;
    discovered: boolean; // 발견 여부
  }[];
}

export interface NaturalWonder {
  id: string;
  name: string;
  description: string;
  discovered: boolean;
  effects: {
    happiness: number;
    yields: {
      food: number;
      production: number;
      gold: number;
      science: number;
      culture: number;
      faith: number;
    }
  }
}

export interface GameState {
  gameId: string;
  turn: number;
  year: number;
  playerId: string;
  playerCiv: string;
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
  diplomacy: DiplomacyState;
  naturalWonders: NaturalWonder[];
  researchState: ResearchState;
  policyState: PolicyState;
  religionState: ReligionState;
}

export interface ResearchState {
  science: number;
  progress: number;
  currentTechId: string | null;
  researchedTechIds: string[];
}

export interface PolicyState {
  culture: number;
  adopted: string[];
  ideology: string | null;
}

export interface ReligionState {
  faith: number;
  foundedReligionId: string | null;
  followerReligionId: string | null;
}

// API 기본 URL
const API_BASE_URL = '/api';

/**
 * 게임 서비스 객체
 */
class GameService {
  private gameId: string | null = null;

  /**
   * 게임 상태 초기화
   */
  async startGame(
    options: {
      mapType: string;
      playerName: string;
      playerCiv: string;
      difficulty: string;
      civCount: number;
    }
  ): Promise<GameState> {
    const response = await fetch(`${API_BASE_URL}/game/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('게임 시작 실패');
    }

    const data = await response.json();
    this.gameId = data.gameId;
    return data.initialState;
  }

  /**
   * 현재 게임 상태 조회
   */
  async getGameState(): Promise<GameState> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/game/state?gameId=${this.gameId}`);
    
    if (!response.ok) {
      throw new Error('게임 상태 로드 실패');
    }

    return await response.json();
  }

  /**
   * 턴 종료 처리
   */
  async endTurn(): Promise<{ newState: GameState; events: string[] }> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/game/endturn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameId: this.gameId }),
    });

    if (!response.ok) {
      throw new Error('턴 종료 처리 실패');
    }

    return await response.json();
  }

  /**
   * 맵 전체 정보 가져오기
   */
  async getMap(): Promise<{ hexagons: HexTile[] }> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/map?gameId=${this.gameId}`);
    
    if (!response.ok) {
      throw new Error('맵 정보 로드 실패');
    }

    return await response.json();
  }

  /**
   * 특정 타일 선택 및 정보 조회
   */
  async selectTile(q: number, r: number): Promise<{ hexagon: HexTile }> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/map/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameId: this.gameId, q, r }),
    });

    if (!response.ok) {
      throw new Error('타일 선택 실패');
    }

    return await response.json();
  }

  /**
   * 인접 타일 조회
   * 헥스 좌표계 기준 특정 타일의 6방향 인접 타일 정보를 반환
   */
  async getAdjacentTiles(q: number, r: number): Promise<{ hexagons: HexTile[] }> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/map/adjacent?gameId=${this.gameId}&q=${q}&r=${r}`);
    
    if (!response.ok) {
      throw new Error('인접 타일 정보 로드 실패');
    }

    return await response.json();
  }

  /**
   * 유닛 이동 경로 계산
   * 시작 지점에서 도착 지점까지의 최적 경로와 이동 비용 계산
   */
  async calculatePath(unitId: string, toQ: number, toR: number): Promise<{ 
    path: { q: number; r: number; s: number }[];
    totalCost: number;
    possibleInTurn: boolean;
  }> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/unit/path`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        gameId: this.gameId, 
        unitId, 
        to: { q: toQ, r: toR } 
      }),
    });

    if (!response.ok) {
      throw new Error('경로 계산 실패');
    }

    return await response.json();
  }

  /**
   * 유닛 이동 명령
   */
  async moveUnit(unitId: string, toQ: number, toR: number): Promise<{ unit: Unit }> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/unit/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        gameId: this.gameId, 
        unitId, 
        to: { q: toQ, r: toR } 
      }),
    });

    if (!response.ok) {
      throw new Error('유닛 이동 실패');
    }

    return await response.json();
  }

  /**
   * 유닛 명령 (경계, 정착, 요새화 등)
   */
  async commandUnit(unitId: string, command: string): Promise<{ unit: Unit }> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/unit/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        gameId: this.gameId, 
        unitId, 
        command 
      }),
    });

    if (!response.ok) {
      throw new Error('유닛 명령 실패');
    }

    return await response.json();
  }

  /**
   * 도시 생산 명령
   */
  async setCityProduction(cityId: number, item: string): Promise<{ city: City }> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/city/produce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        gameId: this.gameId, 
        cityId, 
        item 
      }),
    });

    if (!response.ok) {
      throw new Error('도시 생산 설정 실패');
    }

    return await response.json();
  }

  /**
   * 도시 특화 설정
   */
  async specializeCityFocus(cityId: number, specialization: string): Promise<{ city: City }> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/city/specialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        gameId: this.gameId, 
        cityId, 
        specialization 
      }),
    });

    if (!response.ok) {
      throw new Error('도시 특화 설정 실패');
    }

    return await response.json();
  }

  /**
   * 자연경관 정보 조회
   */
  async getNaturalWonders(): Promise<{ wonders: NaturalWonder[] }> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/map/wonders?gameId=${this.gameId}`);
    
    if (!response.ok) {
      throw new Error('자연경관 정보 로드 실패');
    }

    return await response.json();
  }

  /**
   * 외교 관계 조회
   */
  async getDiplomacyState(): Promise<DiplomacyState> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/diplomacy/state?gameId=${this.gameId}`);
    
    if (!response.ok) {
      throw new Error('외교 상태 로드 실패');
    }

    return await response.json();
  }

  /**
   * 외교 명령 (무역, 동맹, 전쟁 등)
   */
  async diplomacyCommand(targetId: string, command: string, options?: any): Promise<{ result: string }> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/diplomacy/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        gameId: this.gameId, 
        targetId, 
        command,
        options
      }),
    });

    if (!response.ok) {
      throw new Error('외교 명령 실패');
    }

    return await response.json();
  }

  /**
   * 연구 상태 조회
   */
  async getResearchState(): Promise<ResearchState> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/research/state?gameId=${this.gameId}`);
    
    if (!response.ok) {
      throw new Error('연구 상태 로드 실패');
    }

    return await response.json();
  }

  /**
   * 새로운 연구 시작
   */
  async startResearch(techId: string): Promise<ResearchState> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/research/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        gameId: this.gameId, 
        techId 
      }),
    });

    if (!response.ok) {
      throw new Error('연구 시작 실패');
    }

    return await response.json();
  }

  /**
   * 정책 상태 조회
   */
  async getPolicyState(): Promise<PolicyState> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/policy/state?gameId=${this.gameId}`);
    
    if (!response.ok) {
      throw new Error('정책 상태 로드 실패');
    }

    return await response.json();
  }

  /**
   * 정책 채택
   */
  async adoptPolicy(policyId: string): Promise<PolicyState> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/policy/adopt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        gameId: this.gameId, 
        policyId
      }),
    });

    if (!response.ok) {
      throw new Error('정책 채택 실패');
    }

    return await response.json();
  }

  /**
   * 종교 상태 조회
   */
  async getReligionState(): Promise<ReligionState> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/religion/state?gameId=${this.gameId}`);
    
    if (!response.ok) {
      throw new Error('종교 상태 로드 실패');
    }

    return await response.json();
  }

  /**
   * 종교 창시
   */
  async foundReligion(religionName: string): Promise<ReligionState> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/religion/found`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        gameId: this.gameId, 
        religionName
      }),
    });

    if (!response.ok) {
      throw new Error('종교 창시 실패');
    }

    return await response.json();
  }

  /**
   * 교리 선택
   */
  async selectDoctrine(doctrineId: string): Promise<ReligionState> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${API_BASE_URL}/religion/doctrine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        gameId: this.gameId, 
        doctrineId
      }),
    });

    if (!response.ok) {
      throw new Error('교리 선택 실패');
    }

    return await response.json();
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const gameService = new GameService();
export default gameService;