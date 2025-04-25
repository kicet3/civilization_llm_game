// src/services/gameService.ts

import { 
  GameState, 
  GameOptions, 
  HexTile, 
  Unit, 
  City, 
  SavedGame, 
  ApiResponse,
  GameMapState,
  GameInitRequest
} from '@/types/game';

// BASE_URL 설정
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class GameService {
  private gameId: string | null = null;
  private LOCAL_STORAGE_GAME_KEY = 'text_civ_game_id';
  private LOCAL_STORAGE_GAME_STATE_KEY = 'textCivGameState';
  private LOCAL_STORAGE_MAP_DATA_KEY = 'textCivMapData';
  
  // 캐시 관리
  private cachedMapData: {
    data: HexTile[];
    timestamp: number;
  } | null = null;
  private cachedGameOptions: { data: GameOptions; timestamp: number } | null = null;
  private cachedGameState: { data: GameState; timestamp: number } | null = null;
  
  // 캐시 유효 시간 (밀리초)
  private CACHE_DURATION = {
    MAP: 3600000, // 1시간
    GAME_OPTIONS: 86400000, // 24시간
    GAME_STATE: 60000 // 1분
  };

  private apiUrl: string;
  private localStorageKey: string;
  // API 요청 관리를 위한 변수
  private pendingRequests: { [key: string]: boolean } = {};

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    this.localStorageKey = 'gameServiceCache';
    this.loadCacheFromStorage();
  }

  // 로컬 스토리지에서 캐시 불러오기
  private loadCacheFromStorage() {
    if (typeof window !== 'undefined') {
      const storedCache = localStorage.getItem(this.localStorageKey);
      if (storedCache) {
        try {
          const parsed = JSON.parse(storedCache);
          if (parsed && typeof parsed === 'object') {
            this.cachedMapData = parsed;
          }
        } catch (e) {
          console.error('캐시 데이터를 불러오는 중 오류 발생:', e);
        }
      }
    }
  }

  // 로컬 스토리지에 캐시 저장
  private saveCacheToStorage() {
    if (typeof window !== 'undefined' && this.cachedMapData) {
      try {
        localStorage.setItem(this.localStorageKey, JSON.stringify(this.cachedMapData));
      } catch (e) {
        console.error('캐시 데이터를 저장하는 중 오류 발생:', e);
      }
    }
  }

  /**
   * 게임 옵션 가져오기
   */
  async getGameOptions(): Promise<GameOptions> {
    // 캐시된 옵션이 있고 유효한지 확인
    if (this.cachedGameOptions && 
        (Date.now() - this.cachedGameOptions.timestamp) < this.CACHE_DURATION.GAME_OPTIONS) {
      return this.cachedGameOptions.data;
    }

    // 진행 중인 요청이 있으면 대기하지 않고 캐시나 기본값 반환
    if (this.pendingRequests['gameOptions']) {
      return this.getFallbackGameOptions();
    }

    this.pendingRequests['gameOptions'] = true;
    
    try {
      const response = await fetch(`${this.apiUrl}/game/options`);
      
      this.pendingRequests['gameOptions'] = false;
      
      if (!response.ok) {
        return this.getFallbackGameOptions();
      }

      const options = await response.json();
      
      // 캐시 및 로컬 스토리지에 저장
      this.cachedGameOptions = { data: options, timestamp: Date.now() };
      localStorage.setItem('textCivGameOptions', JSON.stringify(options));
      
      return options;
    } catch (error) {
      this.pendingRequests['gameOptions'] = false;
      return this.getFallbackGameOptions();
    }
  }

  /**
   * 폴백 게임 옵션 반환 (캐시 또는 로컬 스토리지, 기본값 순)
   */
  private getFallbackGameOptions(): GameOptions {
    // 이전에 캐시된 데이터 사용
    if (this.cachedGameOptions) {
      return this.cachedGameOptions.data;
    }
    
    // 로컬 스토리지에서 확인
    const storedOptions = localStorage.getItem('textCivGameOptions');
    if (storedOptions) {
      try {
        const parsedOptions = JSON.parse(storedOptions);
        // 캐시 업데이트
        this.cachedGameOptions = { data: parsedOptions, timestamp: Date.now() };
        return parsedOptions;
      } catch (e) {
        // 파싱 오류 시 기본값 사용
      }
    }
    
    // 모든 방법 실패 시 기본값 반환
    return this.getDefaultGameOptions();
  }

  /**
   * 기본 게임 옵션 반환
   */
  private getDefaultGameOptions(): GameOptions {
    const defaultOptions: GameOptions = {
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
        { id: 'korea', name: '한국', leader: '세종대왕', specialAbility: '과학 보너스', unit: '거북선', building: '학문소', color: 'from-blue-800 to-blue-900', type: 'science' },
        { id: 'japan', name: '일본', leader: '오다 노부나가', specialAbility: '무사도', unit: '사무라이', building: '도조', color: 'from-rose-700 to-rose-900', type: 'military' },
        { id: 'china', name: '중국', leader: '무측천', specialAbility: '장인 기술', unit: '중기병', building: '장성', color: 'from-yellow-700 to-yellow-900', type: 'science' },
        { id: 'mongol', name: '몽골', leader: '칭기즈 칸', specialAbility: '초원의 기병', unit: '카사르', building: '없음', color: 'from-green-700 to-green-900', type: 'military' },
        { id: 'india', name: '인도', leader: '간디', specialAbility: '비폭력 저항', unit: '전사 코끼리', building: '없음', color: 'from-lime-700 to-lime-900', type: 'economic' },
        { id: 'aztec', name: '아즈텍', leader: '몬테수마', specialAbility: '희생 제의', unit: '재규어 전사', building: '없음', color: 'from-emerald-700 to-emerald-900', type: 'military' },
      ],
      gameModes: [
        { id: 'short', name: '짧은 게임', turns: '50', estimatedTime: '약 30분~1시간', description: '빠른 게임' },
        { id: 'medium', name: '표준 게임', turns: '100', estimatedTime: '약 1-2시간', description: '표준 길이의 게임' },
        { id: 'long', name: '긴 게임', turns: '250', estimatedTime: '약 3-5시간', description: '긴 게임' }
      ],
      victoryTypes: [
        { id: 'all', name: '모든 승리 조건' },
        { id: 'domination', name: '정복 승리' },
        { id: 'cultural', name: '문화 승리' },
        { id: 'scientific', name: '과학 승리' },
        { id: 'diplomatic', name: '외교 승리' }
      ]
    };

    // 기본값도 캐시에 저장
    this.cachedGameOptions = { data: defaultOptions, timestamp: Date.now() };
    localStorage.setItem('textCivGameOptions', JSON.stringify(defaultOptions));
    
    return defaultOptions;
  }

  /**
   * 게임 상태 초기화
   */
  async startGame(options: GameInitRequest): Promise<GameState> {
    // 진행 중인 요청이 있으면 대기하지 않고 기본 게임 생성
    if (this.pendingRequests['startGame']) {
      return this.createDefaultGame(options.playerName, options.playerCiv);
    }

    this.pendingRequests['startGame'] = true;
    
    try {
      const response = await fetch(`${this.apiUrl}/game/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      this.pendingRequests['startGame'] = false;
      
      if (!response.ok) {
        return this.createDefaultGame(options.playerName, options.playerCiv);
      }

      const data = await response.json();
      
      // gameId와 초기 게임 상태를 로컬 스토리지에 저장
      localStorage.setItem(this.LOCAL_STORAGE_GAME_KEY, data.id);
      localStorage.setItem(this.LOCAL_STORAGE_GAME_STATE_KEY, JSON.stringify(data.initialState));
      
      // 맵 데이터도 로컬에 저장
      if (data.mapData) {
        localStorage.setItem(this.LOCAL_STORAGE_MAP_DATA_KEY, JSON.stringify(data.mapData));
        this.cachedMapData = { 
          data: data.mapData.tiles, 
          timestamp: Date.now() 
        };
      }
      
      // 게임 상태 캐시
      this.cachedGameState = {
        data: data.initialState,
        timestamp: Date.now()
      };
      
      this.gameId = data.id;
      return data.initialState;
    } catch (error) {
      this.pendingRequests['startGame'] = false;
      return this.createDefaultGame(options.playerName, options.playerCiv);
    }
  }

  /**
   * 기본 게임 생성 (API 실패 시 사용)
   */
  private createDefaultGame(playerName: string, playerCiv: string): GameState {
    const gameId = `local_${Date.now()}`;
    this.gameId = gameId;
    
    // 기본 맵 생성
    const mapTiles = this.generateFallbackMap();
    const mapData = { 
      tiles: mapTiles,
      civs: [],
      turn: 1,
      game_id: gameId
    };
    
    localStorage.setItem(this.LOCAL_STORAGE_MAP_DATA_KEY, JSON.stringify(mapData));
    this.cachedMapData = { 
      data: mapTiles, 
      timestamp: Date.now() 
    };
    
    // 기본 게임 상태 생성
    const initialState: GameState = {
      id: gameId,
      turn: 1,
      year: -4000,
      playerName: playerName,
      resources: {
        food: 10,
        production: 8,
        gold: 50,
        science: 3,
        culture: 2,
        faith: 0,
        happiness: 5
      },
      cities: [],
      units: [],
      map: mapData
    };
    
    // 캐시와 로컬 스토리지 모두 저장
    this.cachedGameState = {
      data: initialState,
      timestamp: Date.now()
    };
    
    localStorage.setItem(this.LOCAL_STORAGE_GAME_KEY, gameId);
    localStorage.setItem(this.LOCAL_STORAGE_GAME_STATE_KEY, JSON.stringify(initialState));
    
    return initialState;
  }

  /**
   * 게임 상태 가져오기 - 로컬 캐시, 로컬 스토리지 사용
   */
  async getGameState(): Promise<GameState> {
    // 메모리 캐시 확인
    if (this.cachedGameState && 
        (Date.now() - this.cachedGameState.timestamp) < this.CACHE_DURATION.GAME_STATE) {
      return this.cachedGameState.data;
    }
    
    const storedGameId = localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
    
    if (!storedGameId) {
      throw new Error('진행 중인 게임이 없습니다');
    }

    // 로컬 스토리지에서 게임 상태 확인
    const storedGameState = localStorage.getItem(this.LOCAL_STORAGE_GAME_STATE_KEY);
    if (storedGameState) {
      try {
        const parsedState = JSON.parse(storedGameState);
        this.cachedGameState = {
          data: parsedState,
          timestamp: Date.now()
        };
        return parsedState;
      } catch (e) {
        // 저장된 게임 상태 파싱 오류 시 다음 단계로 진행
      }
    }
    
    // 진행 중인 요청이 있으면 대기하지 않고 기본 게임 생성
    if (this.pendingRequests['gameState']) {
      return this.createDefaultGame('플레이어', 'korea');
    }
    
    this.pendingRequests['gameState'] = true;
    
    try {
      // API 호출은 로컬 캐시/스토리지가 없을 때만 시도
      const response = await fetch(`${this.apiUrl}/game/${storedGameId}`);
      
      this.pendingRequests['gameState'] = false;
      
      if (!response.ok) {
        return this.createDefaultGame('플레이어', 'korea');
      }

      const data = await response.json();
      
      // 게임 상태 로컬 스토리지에 저장
      localStorage.setItem(this.LOCAL_STORAGE_GAME_STATE_KEY, JSON.stringify(data.gameState));
      
      // 캐시 업데이트
      this.cachedGameState = {
        data: data.gameState,
        timestamp: Date.now()
      };
      
      return data.gameState;
    } catch (error) {
      this.pendingRequests['gameState'] = false;
      return this.createDefaultGame('플레이어', 'korea');
    }
  }

  /**
   * 로컬에 게임 상태 저장 및 캐시 업데이트
   */
  saveGameState(gameState: GameState): void {
    // 로컬 스토리지와 캐시 모두 업데이트
    localStorage.setItem(this.LOCAL_STORAGE_GAME_STATE_KEY, JSON.stringify(gameState));
    this.cachedGameState = {
      data: gameState,
      timestamp: Date.now()
    };
  }

  /**
   * 턴 종료 처리 - 서버에 현재 게임 상태를 전송하고 다음 턴 데이터를 받아옴
   */
  async endTurn(): Promise<{ newState: GameState; events: string[] }> {
    const storedGameId = localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
    
    if (!storedGameId) {
      throw new Error('진행 중인 게임이 없습니다');
    }

    // 진행 중인 요청이 있으면 대기하지 않고 로컬에서 처리
    if (this.pendingRequests['endTurn']) {
      // 현재 게임 상태 가져오기
      const currentState = await this.getGameState();
      return this.simulateNextTurn(currentState);
    }
    
    this.pendingRequests['endTurn'] = true;
    
    try {
      const currentState = await this.getGameState();
      
      const response = await fetch(`${this.apiUrl}/game/${storedGameId}/endTurn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentState),
      });
      
      this.pendingRequests['endTurn'] = false;
      
      if (!response.ok) {
        return this.simulateNextTurn(currentState);
      }

      const data = await response.json();
      
      // 게임 상태 업데이트
      if (data.newState) {
        // 로컬 스토리지에 저장
        localStorage.setItem(this.LOCAL_STORAGE_GAME_STATE_KEY, JSON.stringify(data.newState));
        
        // 캐시 업데이트
        this.cachedGameState = {
          data: data.newState,
          timestamp: Date.now()
        };
        
        // 맵 데이터도 업데이트
        if (data.newState.map?.tiles) {
          localStorage.setItem(this.LOCAL_STORAGE_MAP_DATA_KEY, JSON.stringify(data.newState.map));
          this.cachedMapData = {
            data: data.newState.map.tiles,
            timestamp: Date.now()
          };
        }
      }
      
      return {
        newState: data.newState,
        events: data.events || []
      };
    } catch (error) {
      this.pendingRequests['endTurn'] = false;
      
      // 현재 게임 상태 가져오기
      const currentState = await this.getGameState();
      // API 실패 시 로컬에서 다음 턴 시뮬레이션
      return this.simulateNextTurn(currentState);
    }
  }

  /**
   * 서버 응답이 없을 때 클라이언트에서 다음 턴 시뮬레이션
   */
  private simulateNextTurn(currentState: GameState): { newState: GameState; events: string[] } {
    // 현재 상태를 복사하여 다음 턴 상태 생성
    const newState: GameState = {
      ...currentState,
      turn: currentState.turn + 1,
      year: this.calculateYear(currentState.turn + 1),
      resources: {
        ...currentState.resources,
        food: currentState.resources.food + 2,
        production: currentState.resources.production + 1,
        gold: currentState.resources.gold + 3,
        science: currentState.resources.science + 1
      }
    };
    
    // 맵 업데이트 (있는 경우)
    if (newState.map) {
      newState.map.turn = newState.turn;
    }
    
    // 업데이트된 상태 저장
    localStorage.setItem(this.LOCAL_STORAGE_GAME_STATE_KEY, JSON.stringify(newState));
    
    // 캐시 업데이트
    this.cachedGameState = {
      data: newState,
      timestamp: Date.now()
    };
    
    // 간단한 턴 이벤트 생성
    const events = [`${newState.turn}턴이 시작되었습니다. (오프라인 모드)`];
    
    return { newState, events };
  }

  /**
   * 현재 턴에 맞는 연도 계산
   */
  private calculateYear(turn: number): number {
    if (turn <= 50) {
      return -4000 + (turn * 40);
    } else if (turn <= 100) {
      return -2000 + ((turn - 50) * 20);
    } else if (turn <= 150) {
      return 0 + ((turn - 100) * 10);
    } else if (turn <= 200) {
      return 500 + ((turn - 150) * 4);
    } else {
      return 1500 + ((turn - 200) * 2);
    }
  }

  /**
   * 현재 게임 세션 종료 및 초기화
   */
  endGameSession() {
    localStorage.removeItem(this.LOCAL_STORAGE_GAME_KEY);
    localStorage.removeItem(this.LOCAL_STORAGE_GAME_STATE_KEY);
    localStorage.removeItem(this.LOCAL_STORAGE_MAP_DATA_KEY);
    this.cachedMapData = null;
    this.cachedGameState = null;
  }

  /**
   * 맵 데이터 가져오기 - 로컬 캐시 및 로컬 스토리지 사용
   */
  async getMap(): Promise<HexTile[]> {
    const gameId = localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
    
    console.log('getMap 호출됨, 게임 ID:', gameId);
    
    // 진행 중인 요청이 있으면 대기하지 않고 기본 맵 반환
    if (this.pendingRequests['map']) {
      console.log('이미 진행 중인 요청이 있음, 캐시 사용');
      
      // 그래도 캐시가 있으면 사용
      if (this.cachedMapData) {
        return this.cachedMapData.data;
      }
      
      return this.generateFallbackMap();
    }
    
    // API 호출로 맵 데이터 요청
    this.pendingRequests['map'] = true;
    
    try {
      // 요청 과정을 콘솔에 출력
      console.log('맵 데이터 요청 시작:', `${this.apiUrl}/map/data?user_id=${gameId}`);
      
      // 올바른 맵 데이터 엔드포인트로 GET 요청 (user_id를 쿼리로 전달)
      const response = await fetch(`${this.apiUrl}/map/data?user_id=${gameId}`);
      
      this.pendingRequests['map'] = false;
      
      console.log('맵 데이터 응답 상태:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('맵 데이터 응답 확인:', data ? '데이터 있음' : '데이터 없음');
        
        if (data.tiles) {
          console.log('타일 데이터 확인:', data.tiles.length + '개 타일');
          
          // 로컬 스토리지에 저장
          localStorage.setItem(this.LOCAL_STORAGE_MAP_DATA_KEY, JSON.stringify(data));
          
          // 캐시 업데이트
          this.cachedMapData = {
            data: data.tiles,
            timestamp: Date.now()
          };
          
          return data.tiles;
        } else {
          console.log('타일 데이터 없음');
        }
      } else {
        console.log('맵 데이터 요청 실패:', await response.text());
      }
    } catch (error) {
      this.pendingRequests['map'] = false;
      console.error('맵 데이터 요청 오류:', error);
    }
    
    // API 요청 실패 시 캐시 확인
    console.log('API 요청 실패, 캐시 확인');
    
    // 메모리 캐시 확인
    if (this.cachedMapData) {
      console.log('메모리 캐시 사용');
      return this.cachedMapData.data;
    }
    
    // 로컬 스토리지 확인
    const storedMapData = localStorage.getItem(this.LOCAL_STORAGE_MAP_DATA_KEY);
    if (storedMapData) {
      try {
        const parsedData = JSON.parse(storedMapData);
        if (parsedData.tiles) {
          console.log('로컬 스토리지 데이터 사용');
          this.cachedMapData = {
            data: parsedData.tiles,
            timestamp: Date.now()
          };
          return parsedData.tiles;
        }
      } catch (e) {
        // 파싱 오류 시 조용히 다음 단계로 진행
        console.log('로컬 스토리지 파싱 오류');
      }
    }
    
    // 모든 방법 실패 시 폴백 맵 생성
    console.log('폴백 맵 생성');
    const fallbackMap = this.generateFallbackMap();
    
    // 캐시 업데이트
    this.cachedMapData = {
      data: fallbackMap,
      timestamp: Date.now()
    };
    
    // 로컬 스토리지에도 저장
    const mapData = {
      tiles: fallbackMap,
      civs: [],
      turn: this.cachedGameState?.data?.turn || 1,
      game_id: gameId || 'local'
    };
    localStorage.setItem(this.LOCAL_STORAGE_MAP_DATA_KEY, JSON.stringify(mapData));
    
    return fallbackMap;
  }

  /**
   * 맵 데이터 업데이트 - 클라이언트 측 변경사항 반영
   */
  updateMap(tiles: HexTile[]): void {
    // 캐시 업데이트
    this.cachedMapData = {
      data: tiles,
      timestamp: Date.now()
    };
    
    // 현재 맵 데이터 가져오기
    const storedMapData = localStorage.getItem(this.LOCAL_STORAGE_MAP_DATA_KEY);
    let mapData: GameMapState;
    
    if (storedMapData) {
      try {
        mapData = JSON.parse(storedMapData);
        mapData.tiles = tiles;
      } catch (error) {
        // 파싱 오류 시 새 맵 데이터 생성
        mapData = {
          tiles: tiles,
          civs: [],
          turn: this.cachedGameState?.data.turn || 1,
          game_id: this.gameId || 'local'
        };
      }
    } else {
      // 저장된 맵 데이터가 없으면 새로 생성
      mapData = {
        tiles: tiles,
        civs: [],
        turn: this.cachedGameState?.data.turn || 1,
        game_id: this.gameId || 'local'
      };
    }
    
    // 로컬 스토리지 업데이트
    localStorage.setItem(this.LOCAL_STORAGE_MAP_DATA_KEY, JSON.stringify(mapData));
    
    // 게임 상태에도 맵 데이터 업데이트
    if (this.cachedGameState) {
      const updatedState = {
        ...this.cachedGameState.data,
        map: mapData
      };
      this.saveGameState(updatedState);
    }
  }

  /**
   * 테스트용 맵 생성
   */
  generateFallbackMap(): HexTile[] {
    // 6x6 크기의 간단한 내륙 바다 스타일 맵 생성
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
          yields: {
            food: this.calculateYield(terrain, 'food'),
            production: this.calculateYield(terrain, 'production'),
            gold: this.calculateYield(terrain, 'gold'),
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
    }
    
    return hexagons;
  }

  /**
   * 지형에 따른 이동 비용 계산
   */
  getMovementCost(terrain: string): number {
    const costs: { [key: string]: number } = {
      plains: 1,
      grassland: 1,
      desert: 1,
      tundra: 1,
      snow: 2,
      hills: 2,
      forest: 2,
      jungle: 3,
      marsh: 3,
      mountain: 999, // 지나갈 수 없음
      ocean: 999,    // 지나갈 수 없음
      coast: 999,    // 육상 유닛은 지나갈 수 없음
      river: 2,      // 강 지형은 이동 비용 증가
    };

    return costs[terrain] || 1;
  }

  /**
   * 지형에 따른 기본 수확량 계산
   */
  calculateYield(terrain: string, yieldType: string): number {
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
   * 유닛 명령 처리
   */
  async commandUnit(unitId: string, command: string, params: any = {}): Promise<{ unit: Unit }> {
    const gameId = localStorage.getItem(this.LOCAL_STORAGE_GAME_KEY);
    
    if (!gameId) {
      console.error('진행 중인 게임이 없습니다');
      throw new Error('진행 중인 게임이 없습니다');
    }
    
    // 진행 중인 요청이 있으면 대기하지 않고 로컬 처리
    const requestKey = `commandUnit_${unitId}_${command}`;
    if (this.pendingRequests[requestKey]) {
      return this.handleUnitCommandLocally(unitId, command);
    }
    
    this.pendingRequests[requestKey] = true;
    
    try {
      const response = await fetch(`${BASE_URL}/game/${gameId}/unit/${unitId}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command,
          params
        }),
      });
      
      this.pendingRequests[requestKey] = false;
      
      if (!response.ok) {
        console.error(`유닛 명령 실패: ${response.status}`);
        return this.handleUnitCommandLocally(unitId, command);
      }

      const data = await response.json();
      
      // 게임 상태 업데이트
      if (data.gameState) {
        this.saveGameState(data.gameState);
      }
      
      return data;
    } catch (error) {
      this.pendingRequests[requestKey] = false;
      console.error('유닛 명령 처리 중 오류:', error);
      return this.handleUnitCommandLocally(unitId, command);
    }
  }

  /**
   * 로컬에서 유닛 명령 처리 (서버 API 실패 시)
   */
  private async handleUnitCommandLocally(unitId: string, command: string): Promise<{ unit: Unit }> {
    // 현재 게임 상태 가져오기
    const gameState = await this.getGameState();
    const unit = gameState.units.find(u => u.id === unitId);
    
    if (!unit) {
      throw new Error(`유닛을 찾을 수 없습니다 (ID: ${unitId})`);
    }
    
    // 간단한 유닛 명령 처리 (실제로는 서버에서 더 복잡한 로직 처리)
    switch (command) {
      case 'move':
        // 이동 가능 거리 계산 (이 코드에서는 간단한 구현)
        const map = await this.getMap();
        const tile = map.find(t => t.q === unit.location.q && t.r === unit.location.r);
        
        if (tile) {
          // 이동 비용 계산
          const movementCost = this.getMovementCost(tile.terrain);
          const newMovement = Math.max(0, unit.movement - movementCost);
          unit.movement = newMovement;
          
          if (newMovement <= 0) {
            unit.status = '이동 완료';
          }
        }
        break;
        
      case 'attack':
        // 공격 시 이동력 소모
        unit.movement = 0;
        unit.status = '공격 완료';
        break;
        
      case 'fortify':
        // 요새화
        unit.status = '요새화';
        unit.movement = 0;
        break;
        
      case 'sleep':
        // 휴식
        unit.status = '휴식';
        break;
        
      // 기타 명령
      default:
        unit.status = '대기 중';
    }
    
    // 게임 상태 업데이트 및 저장
    this.saveGameState(gameState);
    
    return { unit };
  }
}

// 싱글톤 인스턴스 생성
const gameService = new GameService();
export default gameService;