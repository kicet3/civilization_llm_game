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
async getGameOptions(): Promise<{
  mapTypes: { id: string; name: string; description: string }[];
  difficulties: { id: string; name: string; description: string }[];
}> {
  try {
    const response = await fetch(`${BASE_URL}/api/game/options`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`게임 옵션 로드 실패: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('게임 옵션 로드 중 오류:', error);
    
    // 임시 기본값 반환 (백엔드 API가 없는 경우)
    return {
      mapTypes: [
        { id: 'continents', name: '대륙', description: '2개 이상의 큰 대륙으로 나뉜 지도' },
        { id: 'pangaea', name: '팡게아', description: '하나의 거대한 대륙으로 구성' },
        { id: 'archipelago', name: '군도', description: '섬이 많은 지도' },
      ],
      difficulties: [
        { id: 'settler', name: '초보자', description: '가장 쉬운 난이도' },
        { id: 'chieftain', name: '초급', description: '초보자를 위한 도전적인 난이도' },
        { id: 'warlord', name: '중급', description: '보통의 도전 수준' },
        { id: 'prince', name: '고급', description: '균형 잡힌 난이도' },
        { id: 'king', name: '최상급', description: '높은 수준의 도전' },
        { id: 'immortal', name: '영웅', description: '매우 어려운 난이도' },
        { id: 'deity', name: '신', description: '최고 난이도' },
      ]
    };
  }
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

/**
 * 사용자 인증 함수
 * @param username 사용자 이름
 * @param password 비밀번호
 * @returns 인증 성공 여부 및 관련 정보
 */
async function authenticateUser(username: string, password: string): Promise<{success: boolean; message?: string}> {
  try {
    // 실제 API 호출로 교체 필요
    // const response = await fetch('/api/auth', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ username, password })
    // });
    // return await response.json();
    
    // 예시 응답 (실제 구현 시 제거)
    await new Promise(resolve => setTimeout(resolve, 800)); // 인증 지연 시뮬레이션
    
    // 테스트용 계정
    if (username === 'test' && password === 'test123') {
      return { success: true };
    }
    
    return { 
      success: false, 
      message: '사용자 이름 또는 비밀번호가 일치하지 않습니다.' 
    };
  } catch (error) {
    console.error('인증 오류:', error);
    return { 
      success: false, 
      message: '인증 과정에서 오류가 발생했습니다. 다시 시도해주세요.' 
    };
  }
}

/**
 * 저장된 게임 목록 조회 함수
 * @param username 사용자 이름
 * @returns 저장된 게임 목록
 */
async function getSavedGames(username: string): Promise<{
  id: string;
  name: string;
  date: string;
  civName: string;
  turn: number;
}[]> {
  try {
    // 실제 API 호출로 교체 필요
    // const response = await fetch(`/api/savedGames?username=${encodeURIComponent(username)}`);
    // return await response.json();
    
    // 예시 데이터 (실제 구현 시 제거)
    await new Promise(resolve => setTimeout(resolve, 600)); // 로딩 지연 시뮬레이션
    
    return [
      { 
        id: 'save-001', 
        name: '한국의 과학 승리 진행중', 
        date: '2025-04-22', 
        civName: '한국', 
        turn: 152 
      },
      { 
        id: 'save-002', 
        name: '몽골 정복 플레이', 
        date: '2025-04-20', 
        civName: '몽골', 
        turn: 87 
      },
      { 
        id: 'save-003', 
        name: '일본 문화 승리 도전', 
        date: '2025-04-15', 
        civName: '일본', 
        turn: 210 
      }
    ];
  } catch (error) {
    console.error('저장된 게임 불러오기 오류:', error);
    return [];
  }
}

/**
 * 특정 게임 불러오기 함수
 * @param gameId 게임 ID
 * @returns 게임 불러오기 성공 여부
 */
async function loadGame(gameId: string): Promise<{success: boolean; gameState?: any}> {
  try {
    // 실제 API 호출로 교체 필요
    // const response = await fetch(`/api/loadGame/${gameId}`);
    // return await response.json();
    
    // 예시 응답 (실제 구현 시 제거)
    await new Promise(resolve => setTimeout(resolve, 1000)); // 로딩 지연 시뮬레이션
    
    return { 
      success: true,
      gameState: {
        // 여기에 실제 게임 상태 데이터가 들어갈 것
        id: gameId,
        turn: gameId === 'save-001' ? 152 : gameId === 'save-002' ? 87 : 210
      }
    };
  } catch (error) {
    console.error('게임 불러오기 오류:', error);
    return { success: false };
  }
}


// 싱글톤 인스턴스 생성 및 내보내기
const gameService = new GameService();
export default gameService;
export { authenticateUser, getSavedGames, loadGame };

