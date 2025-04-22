import { HexTile, Position, Unit, City } from '@/lib/types';
import { getDistance, getNeighbors } from '@/lib/utils';

/**
 * 타일 관리 유틸리티 클래스 
 * 타일 생성, 탐색, 시야 처리 등을 담당
 */
export class TileManager {
  private hexMap: HexTile[];
  private exploredTiles: Set<string>; // 플레이어가 한 번 본 타일들
  private visibleTiles: Set<string>; // 현재 보이는 타일들
  
  constructor(initialMap: HexTile[]) {
    this.hexMap = initialMap;
    this.exploredTiles = new Set<string>();
    this.visibleTiles = new Set<string>();
    
    // 초기 중앙 타일을 탐험한 상태로 설정
    const centerTile = this.hexMap.find(tile => tile.q === 0 && tile.r === 0);
    if (centerTile) {
      this.exploredTiles.add(this.getTileKey(centerTile));
      this.visibleTiles.add(this.getTileKey(centerTile));
    }
  }
  
  /**
   * 타일 식별자 생성
   */
  private getTileKey(tile: HexTile | Position): string {
    return `${tile.q},${tile.r}`;
  }
  
  /**
   * 현재 맵 반환
   */
  public getMap(): HexTile[] {
    return this.hexMap;
  }
  
  /**
   * 위치에 해당하는 타일 찾기
   */
  public getTileAt(pos: Position): HexTile | undefined {
    return this.hexMap.find(tile => tile.q === pos.q && tile.r === pos.r);
  }
  
  /**
   * 시야 업데이트
   * 유닛과 도시 위치를 기반으로 시야 상태 갱신
   */
  public updateVisibility(units: Unit[], cities: City[]): void {
    // 시야 초기화
    this.visibleTiles.clear();
    
    // 플레이어 유닛의 시야 추가
    units.forEach(unit => {
      if (unit.owner === 'player') {
        this.addVisionFromPoint(unit.position, unit.visionRange || 2);
      }
    });
    
    // 플레이어 도시의 시야 추가
    cities.forEach(city => {
      if (city.owner === 'player') {
        this.addVisionFromPoint(city.position, 3); // 도시는 기본적으로 3칸 시야
      }
    });
    
    // 맵의 타일 visibility 속성 갱신
    this.hexMap = this.hexMap.map(tile => {
      const tileKey = this.getTileKey(tile);
      const isVisible = this.visibleTiles.has(tileKey);
      const isExplored = this.exploredTiles.has(tileKey) || isVisible;
      
      // 보이는 타일은 탐험한 타일로 자동 추가
      if (isVisible && !isExplored) {
        this.exploredTiles.add(tileKey);
      }
      
      return {
        ...tile,
        visible: isVisible,
        explored: isExplored
      };
    });
  }
  
  /**
   * 특정 위치에서 시야 추가
   */
  private addVisionFromPoint(pos: Position, range: number): void {
    // 이 위치 자체도 볼 수 있음
    const centerKey = this.getTileKey(pos);
    this.visibleTiles.add(centerKey);
    this.exploredTiles.add(centerKey);
    
    // 주변 타일 탐색 (BFS 알고리즘)
    const queue: { pos: Position; distance: number }[] = [{ pos, distance: 0 }];
    const visited = new Set<string>();
    visited.add(centerKey);
    
    while (queue.length > 0) {
      const { pos: current, distance } = queue.shift()!;
      
      // 시야 범위 내에 있는지 확인
      if (distance <= range) {
        const currentKey = this.getTileKey(current);
        this.visibleTiles.add(currentKey);
        this.exploredTiles.add(currentKey);
        
        // 거리가 여전히 범위 내라면 이웃 타일 탐색
        if (distance < range) {
          const neighbors = getNeighbors(current);
          
          for (const neighbor of neighbors) {
            const neighborKey = this.getTileKey(neighbor);
            
            if (!visited.has(neighborKey)) {
              visited.add(neighborKey);
              
              // 이웃 타일이 맵 내에 있는지 확인
              const neighborTile = this.getTileAt(neighbor);
              if (!neighborTile) continue;
              
              // 시야 차단 지형이면 그 너머는 볼 수 없음
              if (distance > 0 && this.isVisionBlockingTerrain(neighborTile)) {
                this.visibleTiles.add(neighborKey);
                this.exploredTiles.add(neighborKey);
                continue; // 더 이상 진행하지 않음
              }
              
              queue.push({ pos: neighbor, distance: distance + 1 });
            }
          }
        }
      }
    }
  }
  
  /**
   * 시야를 차단하는 지형인지 확인
   */
  private isVisionBlockingTerrain(tile: HexTile): boolean {
    return tile.terrain === 'mountain' || tile.terrain === 'forest';
  }
  
  /**
   * 특정 위치가 시야 내에 있는지 확인
   */
  public isTileVisible(pos: Position): boolean {
    return this.visibleTiles.has(this.getTileKey(pos));
  }
  
  /**
   * 특정 위치가 탐험된 곳인지 확인
   */
  public isTileExplored(pos: Position): boolean {
    return this.exploredTiles.has(this.getTileKey(pos));
  }
  
  /**
   * 타일 소유권 변경
   */
  public setTileOwner(pos: Position, owner: 'player' | 'ai' | null): void {
    const tileIndex = this.hexMap.findIndex(tile => tile.q === pos.q && tile.r === pos.r);
    
    if (tileIndex !== -1) {
      this.hexMap[tileIndex] = {
        ...this.hexMap[tileIndex],
        owner
      };
    }
  }
  
  /**
   * 도시 주변 타일 소유권 설정
   */
  public setCityTerritory(city: City): void {
    // 도시 중심부터 2칸 반경의 타일을 도시 영역으로 설정
    const cityRadius = city.cityRadius || 2;
    const owner = city.owner;
    
    this.hexMap.forEach(tile => {
      const distance = getDistance(city.position, { q: tile.q, r: tile.r });
      
      if (distance <= cityRadius) {
        // 타일 소유권 변경
        const tileIndex = this.hexMap.findIndex(t => t.q === tile.q && t.r === tile.r);
        
        if (tileIndex !== -1) {
          this.hexMap[tileIndex] = {
            ...this.hexMap[tileIndex],
            owner
          };
        }
      }
    });
  }
  
  /**
   * 자원이 있는 타일 필터링
   */
  public getResourceTiles(): HexTile[] {
    return this.hexMap.filter(tile => tile.resource !== undefined);
  }
  
  /**
   * 타일에 유닛 상태 업데이트
   */
  public updateUnitPresence(units: Unit[]): void {
    // 먼저 모든 타일의 hasUnit을 false로 설정
    this.hexMap = this.hexMap.map(tile => ({
      ...tile,
      hasUnit: false
    }));
    
    // 유닛이 있는 타일 업데이트
    units.forEach(unit => {
      const tileIndex = this.hexMap.findIndex(
        tile => tile.q === unit.position.q && tile.r === unit.position.r
      );
      
      if (tileIndex !== -1) {
        this.hexMap[tileIndex] = {
          ...this.hexMap[tileIndex],
          hasUnit: true
        };
      }
    });
  }
  
  /**
   * 타일에 도시 상태 업데이트
   */
  public updateCityPresence(cities: City[]): void {
    // 먼저 모든 타일의 hasCity를 false로 설정
    this.hexMap = this.hexMap.map(tile => ({
      ...tile,
      hasCity: false
    }));
    
    // 도시가 있는 타일 업데이트
    cities.forEach(city => {
      const tileIndex = this.hexMap.findIndex(
        tile => tile.q === city.position.q && tile.r === city.position.r
      );
      
      if (tileIndex !== -1) {
        this.hexMap[tileIndex] = {
          ...this.hexMap[tileIndex],
          hasCity: true,
          owner: city.owner
        };
      }
    });
  }
  
  /**
   * 지형 생산량 계산
   */
  public getTerrainProduction(tile: HexTile): {
    food: number;
    production: number;
    gold: number;
    science: number;
  } {
    let food = 0;
    let production = 0;
    let gold = 0;
    let science = 0;
    
    // 지형에 따른 기본 생산량
    switch (tile.terrain) {
      case 'plain':
        food = 2;
        production = 1;
        break;
      case 'mountain':
        production = 1;
        science = 1;
        break;
      case 'forest':
        food = 1;
        production = 2;
        break;
      case 'water':
        food = 1;
        gold = 1;
        break;
      case 'desert':
        production = 1;
        break;
    }
    
    // 자원에 따른 추가 생산량
    if (tile.resource) {
      switch (tile.resource) {
        case 'iron':
          production += 2;
          break;
        case 'horses':
          food += 1;
          production += 1;
          break;
        case 'oil':
          production += 3;
          gold += 1;
          break;
        case 'uranium':
          production += 2;
          science += 2;
          break;
        case 'gems':
          gold += 3;
          break;
      }
    }
    
    return { food, production, gold, science };
  }
}

export default TileManager;