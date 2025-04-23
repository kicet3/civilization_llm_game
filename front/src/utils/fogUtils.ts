// 안개(Fog of War) 관련 유틸리티 함수들

import { Hex } from './hexUtils'; // 기존 hexUtils 타입 import

// 안개 상태 열거형
export enum FogState {
  UNEXPLORED = 'unexplored', // 완전히 탐험되지 않은 지역
  FOG_OF_WAR = 'fogOfWar',   // 한 번 본 적 있지만 현재 시야에 없는 지역
  VISIBLE = 'visible'        // 현재 시야 내 지역
}

// 안개 관리 클래스
export class FogManager {
  // 탐험된 헥스 추적을 위한 Set
  private exploredHexes: Set<string> = new Set();
  
  // 현재 시야 내 헥스 추적을 위한 Set
  private visibleHexes: Set<string> = new Set();

  /**
   * 헥스를 문자열로 변환 (고유 키 생성)
   */
  private hexToKey(hex: Hex): string {
    return `${hex.q},${hex.r},${hex.s}`;
  }

  /**
   * 특정 헥스의 안개 상태 확인
   * @param hex 확인할 헥스 좌표
   * @returns 해당 헥스의 안개 상태
   */
  getFogState(hex: Hex): FogState {
    const key = this.hexToKey(hex);
    
    if (this.visibleHexes.has(key)) {
      return FogState.VISIBLE;
    }
    
    if (this.exploredHexes.has(key)) {
      return FogState.FOG_OF_WAR;
    }
    
    return FogState.UNEXPLORED;
  }

  /**
   * 유닛/도시의 시야를 기반으로 안개 상태 업데이트
   * @param centerHex 시야 중심점
   * @param sightRadius 시야 반경
   * @param blocksView 시야를 차단하는 지형 확인 함수
   */
  updateVisibility(
    centerHex: Hex, 
    sightRadius: number, 
    blocksView: (hex: Hex) => boolean
  ): Hex[] {
    // 기존 시야 초기화
    this.visibleHexes.clear();

    // 시야 내 헥스 계산
    const visibleHexes = this.getVisibleHexes(centerHex, sightRadius, blocksView);
    
    // 탐험된 헥스와 현재 시야 업데이트
    visibleHexes.forEach(hex => {
      const key = this.hexToKey(hex);
      this.visibleHexes.add(key);
      this.exploredHexes.add(key);
    });

    return visibleHexes;
  }

  /**
   * 시야 범위 계산 (기존 getVisibleHexes 함수와 유사)
   */
  private getVisibleHexes(
    center: Hex,
    radius: number,
    blocksView: (hex: Hex) => boolean
  ): Hex[] {
    const hexesInRange: Hex[] = [];
    
    // 중심점부터 radius 거리의 모든 헥스 계산
    for (let q = -radius; q <= radius; q++) {
      for (let r = Math.max(-radius, -q - radius); 
           r <= Math.min(radius, -q + radius); r++) {
        const s = -q - r;
        const hex: Hex = {
          q: center.q + q,
          r: center.r + r,
          s: center.s + s
        };
        
        // 시야 선 확인
        if (this.hasLineOfSight(center, hex, blocksView)) {
          hexesInRange.push(hex);
        }
      }
    }
    
    return hexesInRange;
  }

  /**
   * 두 헥스 사이의 시야 확인 (직선 경로 상 시야 차단 여부)
   */
  private hasLineOfSight(
    center: Hex, 
    target: Hex, 
    blocksView: (hex: Hex) => boolean
  ): boolean {
    // 시작점과 끝점의 직선 경로 계산
    const linePath = this.getHexLineDraw(center, target);
    
    // 시작점과 끝점 제외하고 중간 지점들 확인
    for (let i = 1; i < linePath.length - 1; i++) {
      if (blocksView(linePath[i])) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 두 헥스 사이의 선형 경로 계산
   */
  private getHexLineDraw(start: Hex, end: Hex): Hex[] {
    const distance = this.hexDistance(start, end);
    
    if (distance === 0) return [start];
    
    const results: Hex[] = [];
    
    for (let step = 0; step <= distance; step++) {
      const t = distance === 0 ? 0 : step / distance;
      results.push(this.hexLerp(start, end, t));
    }
    
    return results;
  }

  /**
   * 두 헥스 사이의 선형 보간
   */
  private hexLerp(a: Hex, b: Hex, t: number): Hex {
    return {
      q: Math.round(a.q + (b.q - a.q) * t),
      r: Math.round(a.r + (b.r - a.r) * t),
      s: Math.round(a.s + (b.s - a.s) * t)
    };
  }

  /**
   * 두 헥스 사이의 거리 계산
   */
  private hexDistance(a: Hex, b: Hex): number {
    return Math.max(
      Math.abs(a.q - b.q),
      Math.abs(a.r - b.r),
      Math.abs(a.s - b.s)
    );
  }

  /**
   * 모든 탐험된 헥스 가져오기
   */
  getExploredHexes(): Hex[] {
    return Array.from(this.exploredHexes).map(key => {
      const [q, r, s] = key.split(',').map(Number);
      return { q, r, s };
    });
  }

  /**
   * 현재 시야 내 헥스 가져오기
   */
  getVisibleHexes(): Hex[] {
    return Array.from(this.visibleHexes).map(key => {
      const [q, r, s] = key.split(',').map(Number);
      return { q, r, s };
    });
  }

  /**
   * 특정 헥스 수동으로 탐험 표시
   */
  exploreHex(hex: Hex): void {
    const key = this.hexToKey(hex);
    this.exploredHexes.add(key);
  }

  /**
   * 모든 안개 초기화
   */
  resetFog(): void {
    this.exploredHexes.clear();
    this.visibleHexes.clear();
  }
}

// 사용 예시
export function createFogManager(): FogManager {
  return new FogManager();
}