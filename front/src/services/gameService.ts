// src/services/gameService.ts

/**
 * 문명 게임 백엔드 API와 통신하기 위한 서비스
 * 헥스 그리드 모델, 유닛 이동, 안개 제거, 자연경관, 외교 등의 기능 포함
 */

import { BASE_URL } from './config';

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

/**
 * 게임 서비스 객체
 */
class GameService {
  private gameId: string | null = null;

  /**
   * 게임 상태 초기화
   */
  async startGame({
    mapType,
    playerName,
    playerCiv,
    difficulty,
    civCount
  }: {
    mapType: string;
    playerName: string;
    playerCiv: string;
    difficulty: string;
    civCount: number;
  }): Promise<GameState> {
    const response = await fetch(`${BASE_URL}/api/game/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mapType,
        playerName,
        playerCiv,
        difficulty,
        civCount
      }),
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

    const response = await fetch(`${BASE_URL}/api/game/state?gameId=${this.gameId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`게임 상태 로드 실패: ${errorText}`);
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

    const response = await fetch(`${BASE_URL}/api/game/endturn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameId: this.gameId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`턴 종료 처리 실패: ${errorText}`);
    }

    return await response.json();
  }

  /**
   * 게임 옵션 조회
   */
  async getGameOptions(): Promise<{
    mapTypes: { id: string; name: string; description: string }[];
    difficulties: { id: string; name: string; description: string }[];
  }> {
    const response = await fetch(`${BASE_URL}/api/map/options`);
    
    if (!response.ok) {
      throw new Error('게임 옵션 로드 실패');
    }

    return await response.json();
  }
  // 다른 모든 메서드도 비슷한 방식으로 BASE_URL 사용
  async getMap(): Promise<{ hexagons: HexTile[] }> {
    if (!this.gameId) {
      throw new Error('게임이 시작되지 않았습니다');
    }

    const response = await fetch(`${BASE_URL}/api/map?gameId=${this.gameId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`맵 정보 로드 실패: ${errorText}`);
    }

    return await response.json();
  }

  // 다른 메서드들도 유사하게 수정 필요
  // selectTile, getAdjacentTiles, calculatePath, moveUnit 등
}

// 싱글톤 인스턴스 생성 및 내보내기
const gameService = new GameService();
export default gameService;