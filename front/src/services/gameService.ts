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
 * 맵 데이터 가져오기
 */
async getMap(): Promise<{ hexagons: HexTile[] }> {
  try {
    // 백엔드 API 호출 - 이제 내륙 바다 맵 데이터를 반환함
    const response = await fetch(`${BASE_URL}/api/map/data`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`맵 정보 로드 실패: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('맵 데이터 로드 중 오류:', error);
    
    // 백엔드 연결 실패 시 간단한 테스트 맵 데이터 반환
    // 원래는 generateTestMapData 함수를 호출했지만 이제는 더 간단한 에러 대응 맵을 반환
    const fallbackMap = this.generateFallbackMap();
    return { hexagons: fallbackMap };
  }
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
      const response = await fetch(`${BASE_URL}/api/wonders`);
      
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
      const response = await fetch(`${BASE_URL}/api/map/adjacent?q=${q}&r=${r}`);
      
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
      const response = await fetch(`${BASE_URL}/api/unit/path`, {
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
      const response = await fetch(`${BASE_URL}/api/unit/move`, {
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
      const response = await fetch(`${BASE_URL}/api/unit/command`, {
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
}

// 싱글톤 인스턴스 생성 및 내보내기
const gameService = new GameService();
export default gameService;