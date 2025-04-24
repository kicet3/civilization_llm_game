// src/services/gameService.ts

import { BASE_URL } from './config';
import { 
  GameState, 
  GameOptions, 
  HexTile, 
  Unit, 
  City, 
  SavedGame, 
  ApiResponse 
} from '@/types/game';

class GameService {
  private gameId: string | null = null;
  private LOCAL_STORAGE_GAME_KEY = 'text_civ_game_id';
  private LOCAL_STORAGE_GAME_STATE_KEY = 'textCivGameState';

  /**
   * 게임 옵션 가져오기
   */
  async getGameOptions(): Promise<GameOptions> {
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
          { id: 'inland_sea', name: '내해', description: '중앙에 바다가 있는 지도' },
        ],
        difficulties: [
          { id: 'settler', name: '초보자', description: '가장 쉬운 난이도' },
          { id: 'chieftain', name: '초급', description: '초보자를 위한 도전적인 난이도' },
          { id: 'warlord', name: '중급', description: '보통의 도전 수준' },
          { id: 'prince', name: '고급', description: '균형 잡힌 난이도' },
          { id: 'king', name: '최상급', description: '높은 수준의 도전' },
          { id: 'immortal', name: '영웅', description: '매우 어려운 난이도' },
          { id: 'deity', name: '신', description: '최고 난이도' },
        ],
        civilizations: [
          { id: 'korea', name: '한국', leader: '세종대왕', ability: '과학 관련 위대한 인물 생성 보너스', unit: '거북선', building: '학문소', color: 'from-blue-800 to-blue-900', type: 'science' },
          { id: 'japan', name: '일본', leader: '오다 노부나가', ability: '유닛 체력 1까지 피해 감소 없음', unit: '사무라이', building: '도조', color: 'from-rose-700 to-rose-900', type: 'military' },
          { id: 'china', name: '중국', leader: '무측천', ability: '위대한 장군 생성 보너스', unit: '중기병', building: '장성', color: 'from-yellow-700 to-yellow-900', type: 'science' },
          { id: 'mongol', name: '몽골', leader: '칭기즈 칸', ability: '도시국가 공격에 보너스', unit: '카사르', building: '없음', color: 'from-green-700 to-green-900', type: 'military' },
          { id: 'india', name: '인도', leader: '간디', ability: '인구가 많을수록 행복도에 패널티 감소', unit: '전사 코끼리', building: '없음', color: 'from-lime-700 to-lime-900', type: 'economic' },
          { id: 'aztec', name: '아즈텍', leader: '몬테수마', ability: '적 유닛 처치 시 문화 획득', unit: '재규어 전사', building: '없음', color: 'from-emerald-700 to-emerald-900', type: 'military' },
        ],
        gameModes: [
          { id: 'short', name: '짧은 게임', turns: 50, time: '약 30분~1시간' },
          { id: 'medium', name: '표준 게임', turns: 100, time: '약 1-2시간' },
          { id: 'long', name: '긴 게임', turns: 250, time: '약 3-5시간' }
        ],
        victoryTypes: [
          { id: 'all', name: '모든 승리 조건' },
          { id: 'domination', name: '정복 승리' },
          { id: 'cultural', name: '문화 승리' },
          { id: 'scientific', name: '과학 승리' },
          { id: 'diplomatic', name: '외교 승리' }
        ]
      };
    }
  }

  /**
   * 게임 상태 초기화
   */
  async startGame({
    mapType,
    playerName,
    playerCiv,
    difficulty,
    civCount,
    userId
  }: {
    mapType: string;
    playerName: string;
    playerCiv: string;
    difficulty: string;
    civCount: number;
    userId: string;
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
          civCount,
          userId // 추가된 userId
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

  /**
   * 지도 정보 가져오기
   */
  async getMap(): Promise<{ hexagons: HexTile[] }> {
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

  /**
   * 자연경관 정보 가져오기
   */
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
   * 인접 타일 정보 가져오기
   */
  async getAdjacentTiles(q: number, r: number): Promise<{ hexagons: HexTile[] }> {
    const storedGameId = localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
    
    if (!storedGameId) {
      throw new Error('진행 중인 게임이 없습니다');
    }

    try {
      const response = await fetch(`${BASE_URL}/api/map/adjacent?gameId=${storedGameId}&q=${q}&r=${r}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`인접 타일 정보 로드 실패: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('인접 타일 정보 로드 중 오류:', error);
      throw error;
    }
  }

  /**
   * 유닛 이동 경로 계산
   */
  async calculatePath(unitId: string, targetQ: number, targetR: number): Promise<{
    path: { q: number, r: number, s: number }[];
    totalCost: number;
    possibleInTurn: boolean;
  }> {
    const storedGameId = localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
    
    if (!storedGameId) {
      throw new Error('진행 중인 게임이 없습니다');
    }

    try {
      const response = await fetch(`${BASE_URL}/api/unit/path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: storedGameId,
          unitId,
          targetQ,
          targetR
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`경로 계산 실패: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('경로 계산 중 오류:', error);
      throw error;
    }
  }

  /**
   * 유닛 이동
   */
  async moveUnit(unitId: string, targetQ: number, targetR: number): Promise<{
    unit: Unit;
  }> {
    const storedGameId = localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
    
    if (!storedGameId) {
      throw new Error('진행 중인 게임이 없습니다');
    }

    try {
      const response = await fetch(`${BASE_URL}/api/unit/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: storedGameId,
          unitId,
          targetQ,
          targetR
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`유닛 이동 실패: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('유닛 이동 중 오류:', error);
      throw error;
    }
  }

  /**
   * 유닛 명령
   */
  async commandUnit(unitId: string, command: string): Promise<{
    unit: Unit;
  }> {
    const storedGameId = localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
    
    if (!storedGameId) {
      throw new Error('진행 중인 게임이 없습니다');
    }

    try {
      const response = await fetch(`${BASE_URL}/api/unit/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: storedGameId,
          unitId,
          command
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`유닛 명령 실패: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('유닛 명령 중 오류:', error);
      throw error;
    }
  }

  /**
   * 도시 생산 설정
   */
  async setCityProduction(cityId: number, item: string): Promise<{
    city: City;
  }> {
    const storedGameId = localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
    
    if (!storedGameId) {
      throw new Error('진행 중인 게임이 없습니다');
    }

    try {
      const response = await fetch(`${BASE_URL}/api/city/production`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: storedGameId,
          cityId,
          item
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`도시 생산 설정 실패: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('도시 생산 설정 중 오류:', error);
      throw error;
    }
  }

  /**
   * 도시 특화 설정
   */
  async specializeCityFocus(cityId: number, specialization: string): Promise<{
    city: City;
  }> {
    const storedGameId = localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
    
    if (!storedGameId) {
      throw new Error('진행 중인 게임이 없습니다');
    }

    try {
      const response = await fetch(`${BASE_URL}/api/city/specialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: storedGameId,
          cityId,
          specialization
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`도시 특화 설정 실패: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('도시 특화 설정 중 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자 인증
   */
  async authenticateUser(username: string, password: string): Promise<{
    success: boolean;
    message?: string;
  }> {
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
   * 저장된 게임 목록 조회
   */
  async getSavedGames(username: string): Promise<SavedGame[]> {
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
   * 특정 게임 불러오기
   */
  async loadGame(gameId: string): Promise<{
    success: boolean;
    gameState?: GameState;
  }> {
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
          turn: gameId === 'save-001' ? 152 : gameId === 'save-002' ? 87 : 210,
          year: -3000,
          resources: {
            food: 100,
            production: 50,
            gold: 200,
            science: 30,
            culture: 20,
            faith: 10,
            happiness: 15
          },
          cities: [],
          units: []
        }
      };
    } catch (error) {
      console.error('게임 불러오기 오류:', error);
      return { success: false };
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const gameService = new GameService();
export default gameService;