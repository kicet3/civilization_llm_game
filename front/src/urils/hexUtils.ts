// 헥스 타일 인터페이스
export interface Hex {
  q: number;
  r: number;
  s: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * 헥스 그리드 맵 생성기
 * 다양한 맵 유형에 따라 육각형 타일 그리드를 생성합니다
 */
export function generateHexMap(
  width: number,
  height: number,
  mapType: string = 'Continents',
  seed: number = Math.random() * 10000
  source: Hex,
  target: Hex,
  blocksView: (hex: Hex) => boolean
): boolean {
  if (source.q === target.q && source.r === target.r && source.s === target.s) {
    return true;
  }
  const linePath = getHexLineDraw(source, target);
  for (let i = 1; i < linePath.length - 1; i++) {
    if (blocksView(linePath[i])) {
      return false;
    }
  }
  return true;
}

/**
 * 시야 범위 계산
 * 특정 위치에서 볼 수 있는 모든 타일 계산
 * @param center 시야 중심점
 * @param radius 시야 거리
 * @param blocksView 시야 차단 여부 확인 함수
 */
// 시야 범위 계산 함수: center에서 radius만큼 떨어진 모든 hex 중 시야가 닿는 hex만 반환
export function getVisibleHexes(
  center: Hex,
  radius: number,
  blocksView: (hex: Hex) => boolean
): Hex[] {
  const hexesInRange = getHexesInRange(center, radius);
  return hexesInRange.filter(hex => hasLineOfSight(center, hex, blocksView));
}

  /**
   * 두 헥스 좌표 사이의 방향 계산
   * @returns 0-5 사이의 방향 인덱스 (0: 동쪽, 1: 북동쪽, 2: 북서쪽, 3: 서쪽, 4: 남서쪽, 5: 남동쪽)
   */
  export function getHexDirection(from: Hex, to: Hex): number {
    // 방향 벡터 계산
    const dirQ = to.q - from.q;
    const dirR = to.r - from.r;
    const dirS = to.s - from.s;
    
    // 주요 이동 방향 찾기
    const absQ = Math.abs(dirQ);
    const absR = Math.abs(dirR);
    const absS = Math.abs(dirS);
    
    if (absQ >= absR && absQ >= absS) {
      // q축 방향으로 이동
      return dirQ > 0 ? 0 : 3; // 동/서
    } else if (absR >= absQ && absR >= absS) {
      // r축 방향으로 이동
      return dirR > 0 ? 5 : 2; // 남동/북서
    } else {
      // s축 방향으로 이동
      return dirS > 0 ? 1 : 4; // 북동/남서
    }
  }
  
  /**
   * 헥스 좌표를 문자열로 변환
   */
  export function hexToString(hex: Hex): string {
    return `${hex.q},${hex.r},${hex.s}`;
  }
  
  /**
   * 문자열을 헥스 좌표로 변환
   */
  export function stringToHex(str: string): Hex {
    const [q, r, s] = str.split(',').map(Number);
    return { q, r, s };
  }
  
  /**
   * 특정 방향으로 헥스 이동
   * @param hex 시작 헥스
   * @param direction 방향 인덱스 (0-5)
   */
  export function hexNeighbor(hex: Hex, direction: number): Hex {
    const directions: Hex[] = [
      { q: 1, r: 0, s: -1 },  // 0: 동쪽
      { q: 1, r: -1, s: 0 },  // 1: 북동쪽
      { q: 0, r: -1, s: 1 },  // 2: 북서쪽
      { q: -1, r: 0, s: 1 },  // 3: 서쪽
      { q: -1, r: 1, s: 0 },  // 4: 남서쪽
      { q: 0, r: 1, s: -1 }   // 5: 남동쪽
    ];
    
    const dir = directions[direction % 6];
    return {
      q: hex.q + dir.q,
      r: hex.r + dir.r,
      s: hex.s + dir.s
    };
  }
  
  /**
   * 타일 이동 비용 계산 (지형에 따라 다름)
   * @param terrain 지형 타입
   * @returns 이동 비용
   */
  export function getTerrainMovementCost(terrain: string): number {
    switch (terrain) {
      case 'plains': return 1;     // 평원
      case 'grassland': return 1;  // 초원
      case 'desert': return 1;     // 사막
      case 'tundra': return 1;     // 툰드라
      case 'snow': return 2;       // 눈
      case 'hills': return 2;      // 언덕
      case 'forest': return 2;     // 숲
      case 'jungle': return 2;     // 정글
      case 'marsh': return 3;      // 늪지
      case 'mountain': return Infinity; // 산 (통과 불가)
      case 'ocean': return Infinity;    // 대양 (육상 유닛 통과 불가)
      case 'coast': return Infinity;    // 해안 (육상 유닛 통과 불가)
      case 'lake': return Infinity;     // 호수 (육상 유닛 통과 불가)
      case 'river': return 2;      // 강 (건너기 어려움)
      default: return 1;           // 기본값
    }
  }
  
  /**
   * 바다 타일인지 확인
   */
  export function isWaterTerrain(terrain: string): boolean {
    return ['ocean', 'coast', 'lake'].includes(terrain);
  }
  
  /**
   * 통행 불가능한 지형인지 확인
   */
  export function isImpassableTerrain(terrain: string): boolean {
    return terrain === 'mountain' || isWaterTerrain(terrain);
  }
  
  /**
   * 시야를 차단하는 지형인지 확인
   */
  export function isViewBlockingTerrain(terrain: string): boolean {
    return terrain === 'mountain' || terrain === 'hills' || terrain === 'forest' || terrain === 'jungle';
  }
  
  /**
   * 특정 유닛 타입이 해당 지형을 통과할 수 있는지 확인
   */
  export function canUnitPassTerrain(unitType: string, terrain: string): boolean {
    // 특수한 유닛 타입에 따른 이동성 확인
    switch (unitType) {
      case 'naval':
        // 해상 유닛은 물 위만 이동 가능
        return isWaterTerrain(terrain);
        
      case 'land':
        // 육상 유닛은 물 위로 이동 불가능
        return !isWaterTerrain(terrain) && terrain !== 'mountain';
        
      case 'scout':
        // 정찰대는 숲/정글에서 이동 페널티 없음, 산은 여전히 불가
        return terrain !== 'mountain' && !isWaterTerrain(terrain);
        
      case 'helicopter':
        // 헬리콥터는 산 제외 모든 지형 통과 가능
        return terrain !== 'mountain';
        
      case 'hovering':
        // 호버크래프트는 물과 육지 모두 이동 가능
        return terrain !== 'mountain';
        
      default:
        // 기본적으로 산과 물은 통과 불가
        return !isImpassableTerrain(terrain);
    }
  }
  
  /**
   * 특정 유닛 타입의 지형별 이동 비용 계산
   */
  export function getUnitMovementCost(unitType: string, terrain: string): number {
    // 통행 불가능한 경우 무한대 반환
    if (!canUnitPassTerrain(unitType, terrain)) {
      return Infinity;
    }
    
    // 유닛 타입별 지형 이동 비용 계산
    switch (unitType) {
      case 'scout':
        // 정찰대는 숲/정글에서 이동 페널티 없음
        if (terrain === 'forest' || terrain === 'jungle') {
          return 1;
        }
        break;
        
      case 'tank':
        // 탱크는 숲/정글에서 더 느림
        if (terrain === 'forest' || terrain === 'jungle') {
          return 3;
        }
        break;
    }
    
    // 기본 지형 이동 비용 적용
    return getTerrainMovementCost(terrain);
  }

  /**
    center: Hex,
    radius: number,
    blocksView: (hex: Hex) => boolean
  ): Hex[] {// src/utils/hexUtils.ts
  
  /**
   * 헥스 그리드 관련 유틸리티 함수들
   * (x,y,z) 좌표계를 사용하는 3D 큐브 좌표계 기반
   * 참고: https://www.redblobgames.com/grids/hexagons/
   */
  
  // 헥스 타일 인터페이스
  // 헥스 타일 인터페이스
export interface Hex {
  q: number; // 큐브 좌표의 x
  r: number; // 큐브 좌표의 z
  s: number; // 큐브 좌표의 y (q + r + s = 0)
}

// 픽셀 좌표 인터페이스
export interface Point {
  x: number;
  y: number;
}

/**
 * 두 헥스 타일 사이의 거리 계산
 */
export function hexDistance(a: Hex, b: Hex): number {
    return Math.max(
      Math.abs(a.q - b.q),
      Math.abs(a.r - b.r),
      Math.abs(a.s - b.s)
    );
  }

  export function getHexNeighbors(hex: Hex): Hex[] {
    const directions: Hex[] = [
      { q: 1, r: 0, s: -1 },  // 동쪽
      { q: 1, r: -1, s: 0 },  // 북동쪽
      { q: 0, r: -1, s: 1 },  // 북서쪽
      { q: -1, r: 0, s: 1 },  // 서쪽
      { q: -1, r: 1, s: 0 },  // 남서쪽
      { q: 0, r: 1, s: -1 }   // 남동쪽
    ];
    
    return directions.map(dir => ({
      q: hex.q + dir.q,
      r: hex.r + dir.r,
      s: hex.s + dir.s
    }));
  }

  export function getHexNeighborsRing2(hex: Hex): Hex[] {
    const neighbors = [];
    for (let q = -2; q <= 2; q++) {
      for (let r = -2; r <= 2; r++) {
        const s = -q - r;
        // 거리가 2인 타일만 선택
        if (Math.abs(s) <= 2 && Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) === 2) {
          neighbors.push({ 
            q: hex.q + q, 
            r: hex.r + r, 
            s: hex.s + s 
          });
        }
      }
    }
    return neighbors;
  }

  export function getHexRing(center: Hex, radius: number): Hex[] {
    if (radius === 0) return [center];
    
    const results: Hex[] = [];
    
    // 시작 헥스 계산 (북서쪽에서 시작)
    let hex = {
      q: center.q,
      r: center.r - radius,
      s: center.s + radius
    };
    
    // 6개 방향으로 이동하며 헥스 링 구성
    const directions = [
      { q: 1, r: 0, s: -1 },  // 동쪽
      { q: 0, r: 1, s: -1 },  // 남동쪽
      { q: -1, r: 1, s: 0 },  // 남서쪽
      { q: -1, r: 0, s: 1 },  // 서쪽
      { q: 0, r: -1, s: 1 },  // 북서쪽
      { q: 1, r: -1, s: 0 }   // 북동쪽
    ];
    
    // 각 방향으로 radius만큼 이동하며 헥스 추가
    for (let direction = 0; direction < 6; direction++) {
      for (let step = 0; step < radius; step++) {
        hex = {
          q: hex.q + directions[direction].q,
          r: hex.r + directions[direction].r,
          s: hex.s + directions[direction].s
        };
        results.push(hex);
      }
    }
    
    return results;
  }

  export function getHexesInRange(center: Hex, radius: number): Hex[] {
    const results: Hex[] = [];
    
    for (let q = -radius; q <= radius; q++) {
      for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
        const s = -q - r;
        results.push({
          q: center.q + q,
          r: center.r + r,
          s: center.s + s
        });
      }
    }
    
    return results;
  }
  
  /**
   * 헥스 그리드에서 선 그리기 (Bresenham 알고리즘)
   * 시작 타일부터 도착 타일까지의 경로를 구합니다
   */
  export function getHexLineDraw(start: Hex, end: Hex): Hex[] {
    const distance = hexDistance(start, end);
    
    if (distance === 0) return [start];
    
    const results: Hex[] = [];
    
    for (let step = 0; step <= distance; step++) {
      const t = distance === 0 ? 0 : step / distance;
      
      results.push(hexLerp(start, end, t));
    }
    
    return results;
  }
  
  /**
   * 두 헥스 타일 사이의 선형 보간
   */
  export function hexLerp(a: Hex, b: Hex, t: number): Hex {
    return {
      q: Math.round(a.q + (b.q - a.q) * t),
      r: Math.round(a.r + (b.r - a.r) * t),
      s: Math.round(a.s + (b.s - a.s) * t)
    };
  }
  
  /**
   * 헥스 좌표를 픽셀 좌표로 변환
   * 캔버스 렌더링에 활용
   */
  export function hexToPixel(hex: Hex, size: number, origin: Point = { x: 0, y: 0 }): Point {
    const x = size * (3/2 * hex.q);
    const y = size * (Math.sqrt(3)/2 * hex.q + Math.sqrt(3) * hex.r);
    
    return {
      x: x + origin.x,
      y: y + origin.y
    };
  }
  
  /**
   * 픽셀 좌표를 헥스 좌표로 변환
   * 마우스 클릭 위치 변환에 활용
   */
  export function pixelToHex(point: Point, size: number, origin: Point = { x: 0, y: 0 }): Hex {
    const adjustedPoint = {
      x: point.x - origin.x,
      y: point.y - origin.y
    };
    
    const q = (2/3 * adjustedPoint.x) / size;
    const r = (-1/3 * adjustedPoint.x + Math.sqrt(3)/3 * adjustedPoint.y) / size;
    const s = -q - r;
    
    return hexRound({ q, r, s });
  }
  
  /**
   * 헥스 좌표 반올림
   * 픽셀 좌표에서 변환 시 소수점 반올림 처리
   */
  export function hexRound(hex: Hex): Hex {
    let q = Math.round(hex.q);
    let r = Math.round(hex.r);
    let s = Math.round(hex.s);
    
    const qDiff = Math.abs(q - hex.q);
    const rDiff = Math.abs(r - hex.r);
    const sDiff = Math.abs(s - hex.s);
    
    // q + r + s = 0 제약 조건 유지
    if (qDiff > rDiff && qDiff > sDiff) {
      q = -r - s;
    } else if (rDiff > sDiff) {
      r = -q - s;
    } else {
      s = -q - r;
    }
    
    return { q, r, s };
  }
  
  /**
   * 헥스 좌표계 내에서의 A* 경로 탐색 알고리즘
   * 시작 타일부터 도착 타일까지의 최적 경로를 찾습니다
   * @param start 시작 타일
   * @param goal 도착 타일
   * @param isPassable 통행 가능 여부 확인 함수 (타일 -> 통행 가능 여부)
   * @param movementCost 두 타일 간 이동 비용 함수 (현재 타일, 다음 타일 -> 비용)
   */
  export function findPath(
    start: Hex, 
    goal: Hex, 
    isPassable: (hex: Hex) => boolean, 
    movementCost: (from: Hex, to: Hex) => number
  ): { path: Hex[], cost: number } {
    // 우선순위 큐 (오픈 리스트)
    const openSet: Hex[] = [start];
    
    // 시작점부터의 비용 추적
    const gScore: Map<string, number> = new Map();
    gScore.set(`${start.q},${start.r},${start.s}`, 0);
    
    // 출발점→현재→도착점 예상 총 비용
    const fScore: Map<string, number> = new Map();
    fScore.set(`${start.q},${start.r},${start.s}`, hexDistance(start, goal));
    
    // 경로 추적을 위한 각 노드의 이전 노드
    const cameFrom: Map<string, Hex> = new Map();
    
    // 우선순위 큐 구현 (제일 낮은 fScore를 가진 노드 선택)
    const getLowestFScoreNode = (): Hex | null => {
      if (openSet.length === 0) return null;
      
      let lowestIndex = 0;
      let lowestValue = Infinity;
      
      for (let i = 0; i < openSet.length; i++) {
        const hex = openSet[i];
        const key = `${hex.q},${hex.r},${hex.s}`;
        const f = fScore.get(key) ?? Infinity;
        
        if (f < lowestValue) {
          lowestValue = f;
          lowestIndex = i;
        }
      }
      
      return openSet.splice(lowestIndex, 1)[0];
    };
    
    // 경로를 다시 구성하는 함수
    const reconstructPath = (current: Hex): Hex[] => {
      const totalPath: Hex[] = [current];
      let currentKey = `${current.q},${current.r},${current.s}`;
      
      while (cameFrom.has(currentKey)) {
        const prev = cameFrom.get(currentKey)!;
        totalPath.unshift(prev);
        currentKey = `${prev.q},${prev.r},${prev.s}`;
      }
      
      return totalPath;
    };
    
    // A* 알고리즘
    while (openSet.length > 0) {
      const current = getLowestFScoreNode();
      if (!current) break;
      
      const currentKey = `${current.q},${current.r},${current.s}`;
      
      // 목적지 도달
      if (current.q === goal.q && current.r === goal.r && current.s === goal.s) {
        return { 
          path: reconstructPath(current),
          cost: gScore.get(currentKey) ?? 0
        };
      }
      
      // 이웃 탐색
      const neighbors = getHexNeighbors(current);
      
      for (const neighbor of neighbors) {
        // 통행 불가능한 타일은 건너뜀
        if (!isPassable(neighbor)) continue;
        
        const neighborKey = `${neighbor.q},${neighbor.r},${neighbor.s}`;
        
        // 현재 노드를 통해 이웃으로 가는 비용 계산
        const tentativeGScore = (gScore.get(currentKey) ?? Infinity) + movementCost(current, neighbor);
        
        // 현재 알고 있는 것보다 더 좋은 경로를 찾았다면 업데이트
        if (tentativeGScore < (gScore.get(neighborKey) ?? Infinity)) {
          // 이 경로 기록
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(neighborKey, tentativeGScore + hexDistance(neighbor, goal));
          
          // 이웃이 openSet에 없으면 추가
          if (!openSet.some(h => h.q === neighbor.q && h.r === neighbor.r && h.s === neighbor.s)) {
            openSet.push(neighbor);
          }
        }
      }
    }
    
    // 경로를 찾지 못함
    return { path: [], cost: Infinity };
  }
  
  /**
   * 헥스 그리드 맵