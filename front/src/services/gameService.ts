// src/services/gameService.ts

import { BASE_URL } from './config';
import { 
  GameState, 
  GameOptions, 
  HexTile, 
  Unit, 
  City, 
  SavedGame, 
  ApiResponse,
  GameEvent 
} from '@/types/game';

class GameService {
  private gameId: string | null = null;
  private playerId: string | null = null; // 플레이어 ID 저장용 변수 추가
  private LOCAL_STORAGE_GAME_KEY = 'text_civ_game_id';
  private LOCAL_STORAGE_GAME_STATE_KEY = 'textCivGameState';
  private LOCAL_STORAGE_PLAYER_ID_KEY = 'text_civ_player_id'; // 플레이어 ID 저장 키 추가
  
  // WebSocket 관련 변수
  private ws: WebSocket | null = null;
  private wsReconnectTimer: NodeJS.Timeout | null = null;
  private wsBaseUrl: string;
  private wsFailCount: number = 0; // 웹소켓 연결 실패 횟수 추적
  private wsEventListeners: {
    [key: string]: ((data: any) => void)[];
  } = {
    gameUpdate: [],
    turnChange: [],
    notification: [],
    error: []
  };

  constructor() {
    // WebSocket URL 설정 (HTTP URL에서 WS URL로 변환)
    this.wsBaseUrl = BASE_URL.replace('http', 'ws');
  }

  /**
   * WebSocket 연결 설정
   * @param userId 사용자 ID
   * @param gameId 게임 ID
   */
  async connectWebSocket(userId: string, gameId: string): Promise<void> {
    // playerId가 있으면 그것을 사용, 없으면 userId 사용
    const playerId = this.playerId || userId;
    
    // 기존 연결이 있으면 종료
    this.disconnectWebSocket();

    // 3회 이상 실패한 경우 연결 시도를 하지 않음
    if (this.wsFailCount >= 3) {
      console.log('웹소켓 연결 3회 이상 실패하여 연결 시도를 중단합니다.');
      this.wsEventListeners.error.forEach(listener => {
        listener({ 
          message: '실시간 연결에 반복적으로 실패하여 연결 시도를 중단합니다. 폴백 모드로 계속합니다.',
        });
      });
      return;
    }

    try {
      // 개발 환경인 경우 WebSocket 연결을 건너뛸 수 있음
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_WS === 'true') {
        console.log('개발 환경에서 WebSocket 연결 비활성화됨');
        return;
      }

      // WebSocket 연결 URL 생성 
      // 백엔드의 웹소켓 경로는 /ws/{game_id}/{player_id} 형태로 되어 있습니다
      const wsUrl = `${this.wsBaseUrl}/ws/${encodeURIComponent(gameId)}/${encodeURIComponent(playerId)}`;
      
      console.log(`WebSocket 연결 시도: ${wsUrl} (playerId: ${playerId})`);
      
      // WebSocket 인스턴스 생성 오류 처리
      try {
        this.ws = new WebSocket(wsUrl);
      } catch (wsError) {
        console.error('WebSocket 인스턴스 생성 실패:', wsError);
        this.wsFailCount++; // 실패 횟수 증가
        console.log(`WebSocket 연결 실패 횟수: ${this.wsFailCount}`);
        // 에러 이벤트 발생
        this.wsEventListeners.error.forEach(listener => {
          listener({ message: 'WebSocket 연결 실패: 서버에 연결할 수 없습니다.' });
        });
        return;
      }

      // 연결 이벤트 핸들러
      this.ws.onopen = () => {
        console.log('WebSocket 연결 성공');
        this.wsFailCount = 0; // 연결 성공 시 실패 횟수 초기화
        // 재연결 타이머가 있다면 제거
        if (this.wsReconnectTimer) {
          clearTimeout(this.wsReconnectTimer);
          this.wsReconnectTimer = null;
        }
      };

      // 메시지 수신 핸들러
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          console.log('WebSocket 메시지 수신:', data);
          
          // 이벤트 타입에 따라 리스너 호출
          if (data.type && this.wsEventListeners[data.type]) {
            this.wsEventListeners[data.type].forEach(listener => {
              listener(data.payload || data.data);
            });
          }
          
          // 게임 상태 업데이트가 포함된 경우
          if (data.type === 'gameUpdate' && data.payload?.state) {
            const gameState = this.convertApiResponseToGameState(data.payload.state);
            if (typeof window !== 'undefined') {
              localStorage.setItem(this.LOCAL_STORAGE_GAME_STATE_KEY, JSON.stringify(gameState));
            }
          }
        } catch (error) {
          console.error('WebSocket 메시지 처리 오류:', error);
        }
      };

      // 연결 종료 핸들러
      this.ws.onclose = (event) => {
        console.log(`WebSocket 연결 종료 (코드: ${event.code}): ${event.reason}`);
        this.ws = null;
        
        // 비정상 종료인 경우 재연결 시도 (최대 3번)
        if (event.code !== 1000) {
          this.scheduleReconnect(playerId, gameId);
        }
      };

      // 에러 핸들러 - 상세 정보 제공
      this.ws.onerror = (error) => {
        console.error('WebSocket 오류:', error);
        this.wsFailCount++; // 실패 횟수 증가
        console.log(`WebSocket 연결 실패 횟수: ${this.wsFailCount}`);
        
        // 에러 이벤트 발생 - 더 자세한 정보 제공
        this.wsEventListeners.error.forEach(listener => {
          listener({ 
            message: '서버 연결 오류가 발생했습니다. 폴백 모드로 계속합니다.',
            details: error
          });
        });
      };
      
      // 60초 후에도 연결이 안 되면 타임아웃 처리
      const timeoutId = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          console.error('WebSocket 연결 타임아웃');
          this.ws.close();
          this.ws = null;
          
          // 에러 이벤트 발생
          this.wsEventListeners.error.forEach(listener => {
            listener({ message: '실시간 서버 연결 타임아웃. 폴백 모드로 계속합니다.' });
          });
        }
      }, 60000);
      
      // 연결 되거나 종료되면 타임아웃 취소
      this.ws.onopen = () => {
        clearTimeout(timeoutId);
        console.log('WebSocket 연결 성공');
        // 재연결 타이머가 있다면 제거
        if (this.wsReconnectTimer) {
          clearTimeout(this.wsReconnectTimer);
          this.wsReconnectTimer = null;
        }
      };
      
    } catch (error) {
      console.error('WebSocket 연결 설정 오류:', error);
      this.wsFailCount++; // 실패 횟수 증가
      console.log(`WebSocket 연결 실패 횟수: ${this.wsFailCount}`);
      // 에러를 발생시키지 않고 로그만 남김
      console.log('실시간 게임 기능이 제한되어 작동합니다.');
      // 에러 이벤트 발생
      this.wsEventListeners.error.forEach(listener => {
        listener({ message: '실시간 게임 연결에 실패했습니다. 제한된 기능으로 작동합니다.' });
      });
    }
  }

  /**
   * WebSocket 연결 종료
   */
  disconnectWebSocket(): void {
    if (this.ws) {
      console.log('WebSocket 연결 종료 중...');
      // 정상 종료 시도
      this.ws.close(1000, '사용자 요청으로 연결 종료');
      this.ws = null;
    }
    
    // 재연결 타이머가 있으면 제거
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = null;
    }
  }

  /**
   * WebSocket 재연결 스케줄링
   */
  private scheduleReconnect(userId: string, gameId: string, delay: number = 60000): void {
    // playerId가 있으면 그것을 사용, 없으면 userId 사용
    const playerId = this.playerId || userId;
    
    // 3회 이상 실패한 경우 재연결을 시도하지 않음
    if (this.wsFailCount >= 3) {
      console.log('웹소켓 연결 3회 이상 실패하여 재연결 시도를 중단합니다.');
      this.wsEventListeners.error.forEach(listener => {
        listener({ 
          message: '실시간 연결에 반복적으로 실패하여 재연결 시도를 중단합니다. 폴백 모드로 게임을 계속합니다.',
        });
      });
      return;
    }

    console.log(`${delay / 1000}초 후 WebSocket 재연결 시도... (playerId: ${playerId})`);
    
    // 기존 타이머가 있으면 제거
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
    }
    
    // 재연결 타이머 설정
    this.wsReconnectTimer = setTimeout(() => {
      this.connectWebSocket(playerId, gameId).catch(error => {
        console.error('WebSocket 재연결 실패:', error);
        this.wsFailCount++; // 실패 횟수 증가
        console.log(`WebSocket 연결 실패 횟수: ${this.wsFailCount}`);
        
        // 3회 미만 실패한 경우에만 재연결 시도
        if (this.wsFailCount < 3) {
          // 다시 재연결 스케줄링 (지수 백오프로 시간 증가)
          this.scheduleReconnect(playerId, gameId, Math.min(delay * 1.5, 300000));
        } else {
          console.log('웹소켓 연결 3회 이상 실패하여 재연결 시도를 중단합니다.');
          this.wsEventListeners.error.forEach(listener => {
            listener({ 
              message: '실시간 연결에 반복적으로 실패하여 재연결 시도를 중단합니다. 폴백 모드로 게임을 계속합니다.',
            });
          });
        }
      });
    }, delay);
  }

  /**
   * WebSocket 이벤트 리스너 등록
   * @param eventType 이벤트 타입
   * @param callback 콜백 함수
   */
  onWebSocketEvent(eventType: 'gameUpdate' | 'turnChange' | 'notification' | 'error', callback: (data: any) => void): void {
    if (!this.wsEventListeners[eventType]) {
      this.wsEventListeners[eventType] = [];
    }
    this.wsEventListeners[eventType].push(callback);
  }

  /**
   * WebSocket 이벤트 리스너 제거
   * @param eventType 이벤트 타입
   * @param callback 콜백 함수
   */
  offWebSocketEvent(eventType: 'gameUpdate' | 'turnChange' | 'notification' | 'error', callback: (data: any) => void): void {
    if (this.wsEventListeners[eventType]) {
      this.wsEventListeners[eventType] = this.wsEventListeners[eventType].filter(
        listener => listener !== callback
      );
    }
  }

  /**
   * WebSocket을 통해 메시지 전송
   * @param action 액션 타입
   * @param data 전송할 데이터
   */
  sendWebSocketMessage(action: string, data: any = {}): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action,
        data
      }));
    } else {
      console.error('WebSocket이 연결되어 있지 않습니다.');
    }
  }

  /**
   * 게임 옵션 가져오기
   */
  async getGameOptions(): Promise<GameOptions> {
    try {
      const response = await fetch(`${BASE_URL}/game/options`);
      
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
      const response = await fetch(`${BASE_URL}/game/start`, {
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
      
      // playerId가 응답에 포함되어 있으면 저장
      if (data.playerId) {
        this.playerId = data.playerId;
        localStorage.setItem(this.LOCAL_STORAGE_PLAYER_ID_KEY, data.playerId);
        console.log(`플레이어 ID 저장: ${data.playerId}`);
      } else {
        // playerId가 없으면 userId를 저장
        this.playerId = userId;
        localStorage.setItem(this.LOCAL_STORAGE_PLAYER_ID_KEY, userId);
      }
      
      this.gameId = data.id;
      
      // 게임 ID와 플레이어 ID로 WebSocket 연결 설정
      if (data.id) {
        await this.connectWebSocket(this.playerId || userId, data.id);
      }
      
      return data.initialState;
    } catch (error) {
      console.error('게임 초기화 중 오류:', error);
      throw error;
    }
  }

  /**
   * 현재 게임 상태 조회
   */
  async getGameState(userId: string, gameId?: string): Promise<GameState> {
    // 로컬 스토리지의 gameId 확인
    const storedGameId = gameId || localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
    
    // 저장된 playerId 사용, 없으면 userId 사용
    const playerId = this.playerId || localStorage.getItem(this.LOCAL_STORAGE_PLAYER_ID_KEY) || userId;
    
    if (!storedGameId) {
      throw new Error('진행 중인 게임이 없습니다');
    }

    try {
      // 새로운 API 명세에 맞게 게임 상태 요청
      const response = await fetch(`${BASE_URL}/map/game/${storedGameId}?user_id=${playerId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`게임 상태 로드 실패: ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`게임 상태 로드 실패: ${result.message}`);
      }
      
      // playerId가 응답에 포함되어 있으면 저장/업데이트
      if (result.playerId) {
        this.playerId = result.playerId;
        localStorage.setItem(this.LOCAL_STORAGE_PLAYER_ID_KEY, result.playerId);
        console.log(`플레이어 ID 업데이트: ${result.playerId}`);
      }
      
      // API 응답을 GameState 형식으로 변환
      const gameState = this.convertApiResponseToGameState(result.data);
      
      // 조회한 게임 상태를 로컬 스토리지에 저장
      localStorage.setItem(this.LOCAL_STORAGE_GAME_STATE_KEY, JSON.stringify(gameState));
      
      return gameState;
    } catch (error) {
      console.error('게임 상태 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 특정 턴의 게임 상태 조회
   */
  async getGameStateByTurn(userId: string, gameId: string, turn: number): Promise<GameState> {
    // 저장된 playerId 사용, 없으면 userId 사용
    const playerId = this.playerId || localStorage.getItem(this.LOCAL_STORAGE_PLAYER_ID_KEY) || userId;
    
    try {
      // 특정 턴의 게임 상태 요청
      const response = await fetch(`${BASE_URL}/map/game/${gameId}?user_id=${playerId}&turn=${turn}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`게임 상태 로드 실패: ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`게임 상태 로드 실패: ${result.message}`);
      }
      
      // API 응답을 GameState 형식으로 변환
      return this.convertApiResponseToGameState(result.data);
    } catch (error) {
      console.error(`턴 ${turn}의 게임 상태 조회 중 오류:`, error);
      throw error;
    }
  }

  /**
   * 턴 종료 처리
   */
  async endTurn(userId: string, gameId?: string): Promise<{ newState: GameState; events: string[] }> {
    // 게임 ID가 제공되지 않은 경우 로컬 스토리지에서 확인
    const storedGameId = gameId || localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
    
    // 저장된 playerId 사용, 없으면 userId 사용
    const playerId = this.playerId || localStorage.getItem(this.LOCAL_STORAGE_PLAYER_ID_KEY) || userId;
    
    if (!storedGameId) {
      throw new Error('진행 중인 게임이 없습니다');
    }

    try {
      // 새로운 API 명세에 맞게 엔드포인트 호출
      const response = await fetch(`${BASE_URL}/map/turn/next?game_id=${storedGameId}&user_id=${playerId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`턴 종료 처리 실패: ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`턴 종료 처리 실패: ${result.message}`);
      }
      
      // API 응답 구조에 맞게 데이터 변환
      const newState = this.convertApiResponseToGameState(result.data);
      
      // 턴 종료 후 게임 상태 로컬 스토리지에 저장
      localStorage.setItem(this.LOCAL_STORAGE_GAME_STATE_KEY, JSON.stringify(newState));
      
      return {
        newState,
        events: [result.message] // 턴 진행 메시지를 이벤트로 반환
      };
    } catch (error) {
      console.error('턴 종료 중 오류:', error);
      throw error;
    }
  }

  /**
   * API 응답을 GameState 형식으로 변환
   */
  private convertApiResponseToGameState(apiResponse: any): GameState {
    // API 응답 구조를 GameState 형식으로 변환하는 로직
    return {
      id: apiResponse.game_id || '',
      turn: apiResponse.current_turn || 1,
      year: apiResponse.year || 4000 * (apiResponse.current_turn || 1) - 4000, // BC 4000부터 시작
      resources: apiResponse.resources || {
        food: 0,
        production: 0,
        gold: 0,
        science: 0,
        culture: 0,
        faith: 0,
        happiness: 0
      },
      map: apiResponse.state ? {
        tiles: apiResponse.state.tiles || [],
        civs: apiResponse.state.civs || [],
        turn: apiResponse.current_turn || 1,
        game_id: apiResponse.game_id || ''
      } : undefined,
      cities: apiResponse.state?.cities || [],
      units: apiResponse.state?.units || [],
      researchState: apiResponse.state?.research || undefined,
      policyState: apiResponse.state?.policy || undefined,
      religionState: apiResponse.state?.religion || undefined,
      diplomacyState: apiResponse.state?.diplomacy || undefined
    };
  }

  /**
   * 현재 게임 세션 종료 및 초기화
   */
  endGameSession() {
    // WebSocket 연결 종료
    this.disconnectWebSocket();
    
    // 로컬 스토리지 데이터 삭제
    localStorage.removeItem(this.LOCAL_STORAGE_GAME_KEY);
    localStorage.removeItem(this.LOCAL_STORAGE_GAME_STATE_KEY);
  }

  /**
   * 맵 데이터 가져오기
   */
  async getMap(userId?: string): Promise<{ hexagons: HexTile[] }> {
    try {
      // 저장된 playerId 사용, 없으면 userId 사용
      const playerId = this.playerId || localStorage.getItem(this.LOCAL_STORAGE_PLAYER_ID_KEY) || userId;
      
      console.log("맵 데이터 요청 시작", playerId ? `(playerId: ${playerId})` : '');
      
      // playerId가 있으면 쿼리 파라미터로 추가
      const url = playerId 
        ? `${BASE_URL}/map/data?user_id=${encodeURIComponent(playerId)}` 
        : `${BASE_URL}/map/data`;
      
      console.log("맵 데이터 요청 URL:", url);
      
      // 백엔드 API 호출
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`맵 정보 로드 실패 (상태 코드: ${response.status})`, errorText);
        throw new Error(`맵 정보 로드 실패: ${errorText}`);
      }
      
      // 응답을 JSON으로 변환
      const rawData = await response.json();
      console.log("맵 데이터 원본 응답:", rawData);
      
      // playerId가 응답에 포함되어 있으면 저장/업데이트
      if (rawData.playerId) {
        this.playerId = rawData.playerId;
        localStorage.setItem(this.LOCAL_STORAGE_PLAYER_ID_KEY, rawData.playerId);
        console.log(`플레이어 ID 저장/업데이트: ${rawData.playerId}`);
      }
      
      // API 응답 구조에 맞게 데이터 추출
      // 응답이 { success, status_code, message, data: { tiles, civs, turn, game_id }, meta } 구조
      if (rawData && rawData.success && rawData.data && Array.isArray(rawData.data.tiles)) {
        // tiles 배열을 HexTile 형식에 맞게 변환
        const hexagons = rawData.data.tiles.map((tile: any) => ({
          q: tile.q,
          r: tile.r,
          s: tile.s || -tile.q - tile.r, // s가 없는 경우 계산
          terrain: tile.terrain,
          resource: tile.resource,
          visible: tile.visible,
          explored: tile.explored,
          movementCost: this.getMovementCost(tile.terrain),
          unit: tile.unit_id ? { 
            id: tile.unit_id,
            owner: tile.occupant || 'neutral',
            // 기타 필요한 유닛 정보
          } : null,
          city: tile.city_id ? {
            id: tile.city_id,
            name: `${tile.occupant || 'Unknown'} City`,
            owner: tile.occupant || 'neutral',
            // 기타 필요한 도시 정보
          } : null,
          yields: {
            food: this.calculateYield(tile.terrain, 'food'),
            production: this.calculateYield(tile.terrain, 'production'),
            gold: this.calculateYield(tile.terrain, 'gold'),
            science: 0,
            culture: 0,
            faith: 0
          }
        }));
        
        console.log(`맵 데이터 변환 완료: ${hexagons.length}개 타일 로드됨`);
        return { hexagons };
      } else {
        console.error("맵 데이터 구조 오류:", rawData);
        
        // 백엔드 연결에 성공했지만 데이터 구조가 다른 경우 폴백 맵 반환
        console.log("구조 오류로 폴백 맵 생성 중...");
        const fallbackMap = this.generateFallbackMap();
        return { hexagons: fallbackMap };
      }
    } catch (error) {
      console.error('맵 데이터 로드 중 오류:', error);
      
      // 백엔드 연결 실패 시 간단한 테스트 맵 데이터 반환
      console.log("오류로 인한 폴백 맵 생성 중...");
      const fallbackMap = this.generateFallbackMap();
      return { hexagons: fallbackMap };
    }
  }

  /**
   * 지형에 따른 이동 비용 계산
   */
  private getMovementCost(terrain: string): number {
    switch (terrain) {
      case 'mountain': return Infinity;
      case 'hills': case 'forest': return 2;
      case 'desert': return 1.5;
      case 'ocean': return Infinity; // 육상 유닛은 바다를 건널 수 없음
      case 'coast': return Infinity; // 육상 유닛은 해안도 건널 수 없음
      default: return 1; // plains, grassland 등
    }
  }

  /**
   * 지형에 따른 기본 수확량 계산
   */
  private calculateYield(terrain: string, yieldType: 'food' | 'production' | 'gold'): number {
    if (yieldType === 'food') {
      switch (terrain) {
        case 'grassland': return 2;
        case 'plains': return 1;
        case 'coast': return 1; // 해안에서 식량 획득 가능
        default: return 0;
      }
    } else if (yieldType === 'production') {
      switch (terrain) {
        case 'hills': return 2;
        case 'forest': return 1;
        case 'plains': return 1;
        default: return 0;
      }
    } else if (yieldType === 'gold') {
      switch (terrain) {
        case 'coast': return 1; // 해안에서 금 획득 가능
        default: return 0;
      }
    }
    return 0;
  }

  /**
   * 백엔드 연결 실패 시 사용할 간단한 폴백 맵 생성
   */
  private generateFallbackMap(): HexTile[] {
    // 6x6 크기의 매우 간단한 내륙 바다 스타일 맵 생성
    const hexagons: HexTile[] = [];
    const width = 6;
    const height = 6;
    
    // 중심점
    const centerQ = 2;
    const centerR = 2;
    
    for (let q = 0; q < width; q++) {
      for (let r = 0; r < height; r++) {
        const s = -q - r;
        
        // 중심에서의 거리
        const distance = Math.max(
          Math.abs(q - centerQ),
          Math.abs(r - centerR),
          Math.abs(s - (-centerQ - centerR))
        );
        
        // 중앙에 바다, 바깥쪽에 육지
        const isSea = distance < 2;
        const terrain = isSea ? 'ocean' : ['plains', 'grassland', 'forest'][Math.floor(Math.random() * 3)];
        
        // 간단한 폴백 타일 생성
        hexagons.push({
          q,
          r,
          s,
          terrain,
          resource: Math.random() > 0.8 ? ['iron', 'wheat', 'horses'][Math.floor(Math.random() * 3)] : undefined,
          visible: true,
          explored: true,
          movementCost: terrain === 'forest' ? 2 : 1,
          unit: null,
          city: null,
          yields: {
            food: terrain === 'grassland' ? 2 : terrain === 'plains' ? 1 : 0,
            production: terrain === 'hills' ? 2 : terrain === 'forest' ? 1 : 0,
            gold: 0,
            science: 0,
            culture: 0,
            faith: 0
          }
        });
      }
    }
    
    // 플레이어 도시 추가
    const playerHex = hexagons.find(hex => hex.q === 1 && hex.r === 3);
    if (playerHex) {
      playerHex.city = {
        name: '서울',
        owner: 'player',
        population: 3
      };
      playerHex.terrain = 'plains';
    }
    
    // 플레이어 유닛 추가
    const unitHex = hexagons.find(hex => hex.q === 1 && hex.r === 4);
    if (unitHex) {
      unitHex.unit = {
        id: 'warrior-1',
        name: '전사',
        type: 'military',
        typeName: '전사',
        owner: 'player',
        hp: 100,
        maxHp: 100,
        movement: 2,
        maxMovement: 2,
        status: '대기 중',
        location: { q: unitHex.q, r: unitHex.r, s: unitHex.s }
      };
      unitHex.terrain = 'plains';
    }
    
    return hexagons;
  }

  /**
   * 자연경관 정보 가져오기
   */
  async getNaturalWonders(): Promise<{ wonders: any[] }> {
    try {
      // 세션 ID 없이 자연경관 데이터만 요청
      const response = await fetch(`${BASE_URL}/wonders`);
      
      if (!response.ok) {
        throw new Error('자연경관 정보 로드 실패');
      }

      return await response.json();
    } catch (error) {
      console.error('자연경관 데이터 로드 중 오류:', error);
      
      // 백엔드 연결 실패 시 테스트용 데이터 반환
      return {
        wonders: [
          { 
            id: 'wonder1', 
            name: '그랜드 캐니언', 
            description: '거대한 협곡', 
            discovered: true,
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
  }

  /**
   * 인접 타일 정보 가져오기
   */
  async getAdjacentTiles(q: number, r: number): Promise<{ hexagons: HexTile[] }> {
    try {
      // 세션 ID 없이 인접 타일 정보만 요청
      const response = await fetch(`${BASE_URL}/map/adjacent?q=${q}&r=${r}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`인접 타일 정보 로드 실패: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('인접 타일 정보 로드 중 오류:', error);
      
      // 백엔드 연결 실패 시 테스트용 인접 타일 생성
      return {
        hexagons: this.generateAdjacentTiles(q, r)
      };
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
    try {
      // 실제 백엔드 API 호출
      const response = await fetch(`${BASE_URL}/unit/path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
      
      // 테스트용 경로 생성 (직선 경로 생성)
      const unit = await this.findUnitById(unitId);
      if (!unit) {
        throw new Error('유닛을 찾을 수 없습니다');
      }
      
      const path = this.generateTestPath(
        unit.location.q, 
        unit.location.r, 
        targetQ, 
        targetR
      );
      
      const totalCost = path.length - 1; // 단순히 타일 수를 비용으로 간주
      const possibleInTurn = totalCost <= unit.movement;
      
      return {
        path,
        totalCost,
        possibleInTurn
      };
    }
  }

  /**
   * 유닛 이동
   */
  async moveUnit(unitId: string, targetQ: number, targetR: number): Promise<{
    unit: Unit;
  }> {
    try {
      // 백엔드 API 호출
      const response = await fetch(`${BASE_URL}/unit/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
      
      // 테스트용 응답 생성
      const unit = await this.findUnitById(unitId);
      if (!unit) {
        throw new Error('유닛을 찾을 수 없습니다');
      }
      
      // 업데이트된 유닛 반환
      const updatedUnit = {
        ...unit,
        location: { q: targetQ, r: targetR, s: -targetQ - targetR },
        movement: Math.max(0, unit.movement - 1), // 이동력 감소
      };
      
      return { unit: updatedUnit };
    }
  }

  /**
   * 유닛 명령 실행
   */
  async commandUnit(unitId: string, command: string): Promise<{
    unit: Unit;
  }> {
    try {
      // 백엔드 API 호출
      const response = await fetch(`${BASE_URL}/unit/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
      
      // 테스트용 응답 생성
      const unit = await this.findUnitById(unitId);
      if (!unit) {
        throw new Error('유닛을 찾을 수 없습니다');
      }
      
      // 업데이트된 유닛 반환 (명령에 따라 상태 변경)
      const updatedUnit = {
        ...unit,
        status: command === 'fortify' ? '요새화' : 
                command === 'found_city' ? '도시 건설 중' : 
                '대기 중'
      };
      
      return { unit: updatedUnit };
    }
  }

  /**
   * ID로 유닛 찾기 (테스트용)
   */
  private async findUnitById(unitId: string): Promise<Unit | null> {
    // 실제로는 상태나 서버에서 유닛을 찾아야 함
    // 여기서는 테스트용 유닛 반환
    return {
      id: unitId,
      name: '전사',
      type: 'military',
      typeName: '전사',
      hp: 100,
      maxHp: 100,
      movement: 2,
      maxMovement: 2,
      status: '대기 중',
      location: { q: 10, r: 7, s: -17 }
    };
  }

  /**
   * 테스트용 맵 데이터 생성 함수
   */
  private generateTestMapData(width: number, height: number): HexTile[] {
    const terrains = ['plains', 'grassland', 'desert', 'mountain', 'hills', 'forest', 'ocean'];
    const resources = ['iron', 'horses', 'wheat', 'gold', 'oil', null, null, null]; // null은 자원 없음
    
    const hexagons: HexTile[] = [];
    
    for (let q = 0; q < width; q++) {
      for (let r = 0; r < height; r++) {
        const s = -q - r; // 큐브 좌표 제약 조건: q + r + s = 0
        
        // 랜덤 지형 및 자원 선택
        const terrain = terrains[Math.floor(Math.random() * terrains.length)];
        const resource = resources[Math.floor(Math.random() * resources.length)];
        
        // 지형에 맞는 기본 이동 비용 설정
        let movementCost = 1;
        if (terrain === 'mountain') movementCost = Infinity;
        else if (terrain === 'hills' || terrain === 'forest') movementCost = 2;
        else if (terrain === 'desert') movementCost = 1.5;
        
        // 기본 생산량 설정
        const yields = {
          food: terrain === 'grassland' ? 2 : terrain === 'plains' ? 1 : 0,
          production: terrain === 'hills' ? 2 : terrain === 'plains' ? 1 : 0,
          gold: resource === 'gold' ? 2 : 0,
          science: 0,
          culture: 0,
          faith: 0
        };
        
        // 특별한 경우 맵 가장자리는 해양으로 설정
        const isEdge = q === 0 || r === 0 || q === width - 1 || r === height - 1;
        const finalTerrain = isEdge ? 'ocean' : terrain;
        
        hexagons.push({
          q,
          r,
          s,
          terrain: finalTerrain,
          resource: isEdge ? null : resource,
          visibility: 'visible', // 테스트용이므로 모두 가시 상태
          explored: true,
          movementCost,
          yields,
          unit: null,
          city: null
        });
      }
    }
    
    // 중앙 부근에 플레이어 도시와 유닛 추가 (테스트용)
    const centerQ = Math.floor(width / 2);
    const centerR = Math.floor(height / 2);
    
    const centerHex = hexagons.find(hex => hex.q === centerQ && hex.r === centerR);
    if (centerHex) {
      centerHex.city = {
        name: '서울',
        owner: 'player',
        population: 3
      };
      
      // 도시 주변 타일은 탐험됨 상태로 변경
      hexagons.forEach(hex => {
        const distance = Math.max(
          Math.abs(hex.q - centerQ),
          Math.abs(hex.r - centerR),
          Math.abs(hex.s - centerHex.s)
        );
        
        if (distance <= 3) {
          hex.visibility = 'visible';
          hex.explored = true;
        } else if (distance <= 5) {
          hex.visibility = 'fogOfWar';
          hex.explored = true;
        } else {
          hex.visibility = 'unexplored';
          hex.explored = false;
        }
      });
      
      // 도시 옆에 유닛 배치
      const nearbyHex = hexagons.find(hex => 
        hex.q === centerQ + 1 && hex.r === centerR && hex.terrain !== 'mountain' && hex.terrain !== 'ocean'
      );
      
      if (nearbyHex) {
        nearbyHex.unit = {
          id: 'warrior-1',
          name: '전사',
          type: 'military',
          typeName: '전사',
          owner: 'player',
          hp: 100,
          maxHp: 100,
          movement: 2,
          maxMovement: 2,
          status: '대기 중',
          location: { q: nearbyHex.q, r: nearbyHex.r, s: nearbyHex.s }
        };
      }
    }
    
    return hexagons;
  }

  /**
   * 테스트용 인접 타일 생성
   */
  private generateAdjacentTiles(centerQ: number, centerR: number): HexTile[] {
    const directions = [
      { q: 1, r: 0, s: -1 },  // 동쪽
      { q: 1, r: -1, s: 0 },  // 북동쪽
      { q: 0, r: -1, s: 1 },  // 북서쪽
      { q: -1, r: 0, s: 1 },  // 서쪽
      { q: -1, r: 1, s: 0 },  // 남서쪽
      { q: 0, r: 1, s: -1 }   // 남동쪽
    ];
    
    // 중심 타일 주변의 인접 타일들 생성
    return directions.map(dir => {
      const q = centerQ + dir.q;
      const r = centerR + dir.r; 
      const s = -q - r; // 큐브 좌표 제약 조건: q + r + s = 0
      return {
        q,
        r,
        s,
        terrain: ['plains', 'grassland', 'forest'][Math.floor(Math.random() * 3)],
        resource: Math.random() > 0.8 ? ['iron', 'wheat', 'horses'][Math.floor(Math.random() * 3)] : null,
        visibility: 'visible',
        explored: true,
        movementCost: 1,
        yields: {
          food: 1,
          production: 1,
          gold: 0,
          science: 0,
          culture: 0,
          faith: 0
        },
        unit: null,
        city: null
      };
    });
  }

  /**
   * 테스트용 경로 생성 (직선 경로)
   */
  private generateTestPath(startQ: number, startR: number, endQ: number, endR: number): { q: number, r: number, s: number }[] {
    const path: { q: number, r: number, s: number }[] = [];
    
    // 시작점 추가
    path.push({ q: startQ, r: startR, s: -startQ - startR });
    
    // 직선 경로 생성 (브레젠햄 알고리즘 간소화)
    const deltaQ = endQ - startQ;
    const deltaR = endR - startR;
    const steps = Math.max(Math.abs(deltaQ), Math.abs(deltaR));
    
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const q = Math.round(startQ + deltaQ * t);
      const r = Math.round(startR + deltaR * t);
      const s = -q - r;
      
      path.push({ q, r, s });
    }
    
    return path;
  }

  /**
   * 연구 기술 트리 데이터 가져오기
   */
  async getResearchTree(userId: string, gameId?: string): Promise<{
    techs: { [id: string]: { 
      id: string;
      name: string;
      description: string;
      cost: number;
      era: string;
      prerequisites: string[];
      unlocks: string[];
    }};
    researchState: {
      science: number;
      progress: number;
      currentTechId: string | null;
      researchedTechIds: string[];
    };
  }> {
    try {
      // 게임 ID가 제공되지 않은 경우 로컬 스토리지에서 확인
      const storedGameId = gameId || localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
      
      // 저장된 playerId 사용, 없으면 userId 사용
      const playerId = this.playerId || localStorage.getItem(this.LOCAL_STORAGE_PLAYER_ID_KEY) || userId;
      
      if (!storedGameId) {
        throw new Error('진행 중인 게임이 없습니다');
      }

      // 연구 기술 트리 데이터 요청
      const url = `${BASE_URL}/research/tree?game_id=${storedGameId}&user_id=${encodeURIComponent(playerId)}`;
      console.log('연구 트리 데이터 요청:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`연구 트리 로드 실패 (상태 코드: ${response.status})`, errorText);
        throw new Error(`연구 트리 로드 실패: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`연구 트리 로드 실패: ${result.message}`);
      }
      
      // API 응답 데이터 변환
      const techs: { [id: string]: any } = {};
      
      // 백엔드 응답에서 기술 트리 데이터 추출 및 변환
      if (result.data && result.data.techs) {
        result.data.techs.forEach((tech: any) => {
          techs[tech.id] = {
            id: tech.id,
            name: tech.name,
            description: tech.description || '설명 없음',
            cost: tech.cost || 0,
            era: tech.era || '고대',
            prerequisites: tech.prerequisites || [],
            unlocks: tech.unlocks || []
          };
        });
      }
      
      // 연구 상태 정보 추출
      const researchState = {
        science: result.data?.research?.science || 0,
        progress: result.data?.research?.progress || 0,
        currentTechId: result.data?.research?.current_tech_id || null,
        researchedTechIds: result.data?.research?.researched_tech_ids || []
      };
      
      return { techs, researchState };
    } catch (error) {
      console.error('연구 트리 데이터 로드 중 오류:', error);
      
      // 백엔드 연결 실패 시 간단한 기본 데이터 반환
      return this.generateFallbackResearchData();
    }
  }
  
  /**
   * 연구 시작 요청
   */
  async startResearch(userId: string, techId: string, gameId?: string): Promise<{
    success: boolean;
    researchState: {
      science: number;
      progress: number;
      currentTechId: string | null;
      researchedTechIds: string[];
    };
  }> {
    try {
      // 게임 ID가 제공되지 않은 경우 로컬 스토리지에서 확인
      const storedGameId = gameId || localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
      
      // 저장된 playerId 사용, 없으면 userId 사용
      const playerId = this.playerId || localStorage.getItem(this.LOCAL_STORAGE_PLAYER_ID_KEY) || userId;
      
      if (!storedGameId) {
        throw new Error('진행 중인 게임이 없습니다');
      }
      
      // 연구 시작 요청
      const response = await fetch(`${BASE_URL}/research/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game_id: storedGameId,
          user_id: playerId,
          tech_id: techId
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`연구 시작 실패: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`연구 시작 실패: ${result.message}`);
      }
      
      // 연구 상태 정보 추출 및 변환
      const researchState = {
        science: result.data?.science || 0,
        progress: result.data?.progress || 0,
        currentTechId: result.data?.current_tech_id || techId,
        researchedTechIds: result.data?.researched_tech_ids || []
      };
      
      return { success: true, researchState };
    } catch (error) {
      console.error('연구 시작 중 오류:', error);
      throw error;
    }
  }

  /**
   * 기본 연구 트리 데이터 생성 (백엔드 연결 실패 시)
   */
  private generateFallbackResearchData(): {
    techs: { [id: string]: any };
    researchState: {
      science: number;
      progress: number;
      currentTechId: string | null;
      researchedTechIds: string[];
    };
  } {
    // 기본 기술 트리 데이터
    const techs: { [id: string]: any } = {
      pottery: {
        id: "pottery",
        name: "도자기",
        description: "곡물 저장고와 신앙 건물 건설 가능.",
        cost: 25,
        era: "고대",
        prerequisites: [],
        unlocks: ["곡물 저장고", "신전"]
      },
      animal: {
        id: "animal",
        name: "동물 사육",
        description: "목장 건설, 말 자원 채취 가능.",
        cost: 30,
        era: "고대",
        prerequisites: [],
        unlocks: ["목장", "말 채취"]
      },
      mining: {
        id: "mining",
        name: "채광",
        description: "광산 건설, 광물 자원 채취 가능.",
        cost: 35,
        era: "고대",
        prerequisites: [],
        unlocks: ["광산", "광물 채취"]
      },
      sailing: {
        id: "sailing",
        name: "범선",
        description: "항구 건설, 해상 이동 가능.",
        cost: 40,
        era: "고대",
        prerequisites: [],
        unlocks: ["항구", "해상 이동"]
      },
      writing: {
        id: "writing",
        name: "문자",
        description: "도서관 건설 가능.",
        cost: 50,
        era: "고대",
        prerequisites: ["pottery"],
        unlocks: ["도서관"]
      },
      bronzeWorking: {
        id: "bronzeWorking",
        name: "청동 가공",
        description: "창병 유닛 생산 가능.",
        cost: 55,
        era: "고대",
        prerequisites: ["mining"],
        unlocks: ["창병"]
      }
    };
    
    // 기본 연구 상태
    const researchState = {
      science: 6,
      progress: 12,
      currentTechId: "pottery",
      researchedTechIds: ["pottery"]
    };
    
    return { techs, researchState };
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const gameService = new GameService();
export default gameService;