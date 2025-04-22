import { useState, useCallback } from 'react';
import { HexTile, Unit, Position } from '@/lib/types';
import { useGameStore } from '@/lib/store';
import { getDistance, getNeighbors } from '@/lib/utils';

interface UseTileInteractionResult {
  selectedUnit: Unit | null;
  selectedTile: HexTile | null;
  highlightedTiles: Position[];
  isMoving: boolean;
  isBuildingCity: boolean;
  handleTileClick: (tile: HexTile) => void;
  handleUnitSelect: (unit: Unit) => void;
  handleMoveStart: () => void;
  handleBuildCityStart: () => void;
  handleCancel: () => void;
  calculateMovementRange: (unit: Unit) => Position[];
  calculateAttackRange: (unit: Unit) => Position[];
}

export const useTileInteraction = (): UseTileInteractionResult => {
  const { 
    hexMap, 
    units, 
    cities, 
    selectTile, 
    selectedTile, 
    moveUnit, 
    buildCity 
  } = useGameStore();
  
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [highlightedTiles, setHighlightedTiles] = useState<Position[]>([]);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [isBuildingCity, setIsBuildingCity] = useState<boolean>(false);
  
  // 타일 선택 핸들러
  const handleTileClick = useCallback((tile: HexTile) => {
    // 이동 모드에서 타일 클릭 처리
    if (isMoving && selectedUnit) {
      const canMove = highlightedTiles.some(pos => pos.q === tile.q && pos.r === tile.r);
      
      if (canMove) {
        moveUnit(selectedUnit.id, { q: tile.q, r: tile.r });
        setIsMoving(false);
        setHighlightedTiles([]);
      } else {
        // 이동할 수 없는 타일 클릭 - 이동 취소
        setIsMoving(false);
        setHighlightedTiles([]);
      }
      return;
    }
    
    // 도시 건설 모드에서 타일 클릭 처리
    if (isBuildingCity && selectedUnit) {
      const canBuild = highlightedTiles.some(pos => pos.q === tile.q && pos.r === tile.r);
      
      if (canBuild) {
        // 임시 도시 이름 생성
        const cityName = `도시-${Math.floor(Math.random() * 1000)}`;
        buildCity({ q: tile.q, r: tile.r }, cityName);
        setIsBuildingCity(false);
        setHighlightedTiles([]);
        setSelectedUnit(null);
      } else {
        // 건설할 수 없는 타일 클릭 - 건설 취소
        setIsBuildingCity(false);
        setHighlightedTiles([]);
      }
      return;
    }
    
    // 일반 타일 선택 처리
    selectTile(tile);
    
    // 타일에 유닛이 있는지 확인
    const unitAtTile = units.find(unit => 
      unit.position.q === tile.q && unit.position.r === tile.r && unit.owner === 'player'
    );
    
    setSelectedUnit(unitAtTile || null);
    setHighlightedTiles([]);
    
  }, [selectTile, units, isMoving, isBuildingCity, selectedUnit, highlightedTiles, moveUnit, buildCity]);
  
  // 유닛 선택 핸들러
  const handleUnitSelect = useCallback((unit: Unit) => {
    setSelectedUnit(unit);
    
    // 해당 타일도 선택
    const unitTile = hexMap.find(tile => tile.q === unit.position.q && tile.r === unit.position.r);
    if (unitTile) {
      selectTile(unitTile);
    }
  }, [hexMap, selectTile]);
  
  // 이동 시작 핸들러
  const handleMoveStart = useCallback(() => {
    if (!selectedUnit) return;
    
    setIsMoving(true);
    const moveRange = calculateMovementRange(selectedUnit);
    setHighlightedTiles(moveRange);
  }, [selectedUnit]);
  
  // 도시 건설 시작 핸들러
  const handleBuildCityStart = useCallback(() => {
    if (!selectedUnit || selectedUnit.name !== '정착민') return;
    
    setIsBuildingCity(true);
    // 정착민은 현재 위치에서만 도시를 건설할 수 있음
    setHighlightedTiles([selectedUnit.position]);
  }, [selectedUnit]);
  
  // 취소 핸들러
  const handleCancel = useCallback(() => {
    setIsMoving(false);
    setIsBuildingCity(false);
    setHighlightedTiles([]);
  }, []);
  
  // 이동 범위 계산 (BFS 알고리즘 사용)
  const calculateMovementRange = useCallback((unit: Unit): Position[] => {
    if (!unit) return [];
    
    const movementLeft = unit.movementLeft || unit.movement;
    const visited = new Set<string>();
    const queue: {pos: Position, cost: number}[] = [
      {pos: unit.position, cost: 0}
    ];
    const result: Position[] = [];
    
    while (queue.length > 0) {
      const {pos, cost} = queue.shift()!;
      const posKey = `${pos.q},${pos.r}`;
      
      if (visited.has(posKey)) continue;
      visited.add(posKey);
      
      // 시작 위치가 아니고 이동 가능한 타일이면 결과에 추가
      if (cost > 0) {
        result.push(pos);
      }
      
      // 이동 비용이 남아있으면 이웃 타일 탐색
      if (cost < movementLeft) {
        const neighbors = getNeighbors(pos);
        
        for (const neighbor of neighbors) {
          const neighborKey = `${neighbor.q},${neighbor.r}`;
          if (visited.has(neighborKey)) continue;
          
          // 이웃 타일이 맵 내에 있고 이동 가능한지 확인
          const tile = hexMap.find(t => t.q === neighbor.q && t.r === neighbor.r);
          if (!tile) continue;
          
          // 이동 비용 계산 (지형에 따라 다름)
          let moveCost = 1;
          if (tile.terrain === 'mountain') moveCost = 2;
          if (tile.terrain === 'forest') moveCost = 1.5;
          if (tile.terrain === 'water' && unit.type !== 'naval') continue; // 물은 해상 유닛만 이동 가능
          
          // 다른 유닛이 있는 타일은 이동 불가
          const unitAtTile = units.find(u => 
            u.id !== unit.id && u.position.q === neighbor.q && u.position.r === neighbor.r
          );
          if (unitAtTile && unitAtTile.owner === unit.owner) continue;
          
          // 적 도시가 있는 타일은 이동 불가 (공격은 별도 처리)
          const cityAtTile = cities.find(c => 
            c.position.q === neighbor.q && c.position.r === neighbor.r && c.owner !== unit.owner
          );
          if (cityAtTile) continue;
          
          // 이동 비용이 남아있으면 큐에 추가
          const newCost = cost + moveCost;
          if (newCost <= movementLeft) {
            queue.push({pos: neighbor, cost: newCost});
          }
        }
      }
    }
    
    return result;
  }, [hexMap, units, cities]);
  
  // 공격 범위 계산
  const calculateAttackRange = useCallback((unit: Unit): Position[] => {
    if (!unit || unit.type !== 'military') return [];
    
    const result: Position[] = [];
    const attackRange = 1; // 기본 공격 범위 (인접 타일)
    
    hexMap.forEach(tile => {
      const distance = getDistance(unit.position, { q: tile.q, r: tile.r });
      
      if (distance > 0 && distance <= attackRange) {
        // 해당 타일에 적 유닛이나 도시가 있는지 확인
        const enemyUnit = units.find(u => 
          u.owner !== unit.owner && 
          u.position.q === tile.q && 
          u.position.r === tile.r
        );
        
        const enemyCity = cities.find(c => 
          c.owner !== unit.owner && 
          c.position.q === tile.q && 
          c.position.r === tile.r
        );
        
        if (enemyUnit || enemyCity) {
          result.push({ q: tile.q, r: tile.r });
        }
      }
    });
    
    return result;
  }, [hexMap, units, cities]);
  
  return {
    selectedUnit,
    selectedTile,
    highlightedTiles,
    isMoving,
    isBuildingCity,
    handleTileClick,
    handleUnitSelect,
    handleMoveStart,
    handleBuildCityStart,
    handleCancel,
    calculateMovementRange,
    calculateAttackRange
  };
};

export default useTileInteraction;