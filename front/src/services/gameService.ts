// src/services/gameService.ts

import { BASE_URL } from './config';

export interface GameState {
  // 기존 인터페이스 그대로 유지
}

class GameService {
  private gameId: string | null = null;
  private LOCAL_STORAGE_GAME_KEY = 'text_civ_game_id';
  private LOCAL_STORAGE_GAME_STATE_KEY = 'textCivGameState';

  constructor() {
    // 로컬 스토리지 gameId 초기화 제거
  }

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
    try {
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
      
      // gameId와 초기 게임 상태를 로컬 스토리지에 저장
      localStorage.setItem(this.LOCAL_STORAGE_GAME_KEY, data.id);
      localStorage.setItem(this.LOCAL_STORAGE_GAME_STATE_KEY, JSON.stringify(data.initialState));
      
      this.gameId = data.id;
      return data.initialState;
    } catch (error) {
      console.error('게임 초기화 중 오류:', error);
      throw error;
    }
  }

  /**
   * 현재 게임 상태 조회
   */
  async getGameState(): Promise<GameState> {
    // 로컬 스토리지의 gameId 확인
    const storedGameId = localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
    
    if (!storedGameId) {
      throw new Error('진행 중인 게임이 없습니다');
    }

    try {
      const response = await fetch(`${BASE_URL}/api/game/state?gameId=${storedGameId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`게임 상태 로드 실패: ${errorText}`);
      }

      const gameState = await response.json();
      
      // 조회한 게임 상태를 로컬 스토리지에 저장
      localStorage.setItem(this.LOCAL_STORAGE_GAME_STATE_KEY, JSON.stringify(gameState));
      
      return gameState;
    } catch (error) {
      console.error('게임 상태 조회 중 오류:', error);
      throw error;
    }
  }
  async getNaturalWonders(): Promise<{ wonders: any[] }> {
    // 임시 모의 데이터
    return {
      wonders: [
        { 
          id: 'wonder1', 
          name: '그랜드 캐니언', 
          description: '거대한 협곡', 
          discovered: false,
          effects: {
            happiness: 1,
            yields: {
              food: 0,
              production: 1,
              gold: 0,
              science: 1,
              culture: 1,
              faith: 0
            }
          }
        },
        { 
          id: 'wonder2', 
          name: '마추픽추', 
          description: '잉카 문명의 유적', 
          discovered: false,
          effects: {
            happiness: 2,
            yields: {
              food: 0,
              production: 0,
              gold: 1,
              science: 0,
              culture: 2,
              faith: 0
            }
          }
        }
      ]
    };
  }
  /**
   * 턴 종료 처리
   */
  async endTurn(): Promise<{ newState: GameState; events: string[] }> {
    const storedGameId = localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
    
    if (!storedGameId) {
      throw new Error('진행 중인 게임이 없습니다');
    }

    try {
      const response = await fetch(`${BASE_URL}/api/game/endturn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId: storedGameId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`턴 종료 처리 실패: ${errorText}`);
      }

      const result = await response.json();
      
      // 턴 종료 후 게임 상태 로컬 스토리지에 저장
      localStorage.setItem(this.LOCAL_STORAGE_GAME_STATE_KEY, JSON.stringify(result.newState));
      
      return result;
    } catch (error) {
      console.error('턴 종료 중 오류:', error);
      throw error;
    }
  }

  /**
   * 현재 게임 세션 종료 및 초기화
   */
  endGameSession() {
    localStorage.removeItem(this.LOCAL_STORAGE_GAME_KEY);
    localStorage.removeItem(this.LOCAL_STORAGE_GAME_STATE_KEY);
  }

  // 기존의 다른 메서드들도 유사하게 수정
  async getMap(): Promise<{ hexagons: any[] }> {
    const storedGameId = localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
    
    if (!storedGameId) {
      throw new Error('진행 중인 게임이 없습니다');
    }

    const response = await fetch(`${BASE_URL}/api/map?gameId=${storedGameId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`맵 정보 로드 실패: ${errorText}`);
    }

    return await response.json();
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const gameService = new GameService();
export default gameService;