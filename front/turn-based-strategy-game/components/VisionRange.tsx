'use client'

import React from 'react';
import { Hexagon, HexGrid, Layout } from 'react-hexgrid';
import { useGameStore } from '@/lib/store';
import { Unit, Position, HexTile } from '@/lib/types';
import { getDistance } from '@/lib/utils';

interface VisionRangeProps {
  unit: Unit | null;
  viewBox: string;
}

const VisionRange: React.FC<VisionRangeProps> = ({ unit, viewBox }) => {
  const { hexMap } = useGameStore();
  
  // 유닛이 없으면 아무 것도 렌더링하지 않음
  if (!unit) return null;
  
  // 시야 범위 계산
  const calculateVisionRange = (): Position[] => {
    if (!unit) return [];
    
    // 유닛 타입에 따른 시야 범위 설정
    const visionRange = unit.type === 'military' ? 2 : 
                        unit.name === '정찰병' ? 3 : 2;
    
    // 시야 범위 내의 모든 타일 계산
    const inRange: Position[] = [];
    
    hexMap.forEach(tile => {
      const distance = getDistance(unit.position, { q: tile.q, r: tile.r });
      
      // 시야 범위 내에 있고, 타일을 가로막는 장애물이 없는지 확인
      if (distance > 0 && distance <= visionRange) {
        // 시야 차단 지형(산, 울창한 숲 등) 처리
        // 거리가 1이면 항상 볼 수 있음
        if (distance === 1) {
          inRange.push({ q: tile.q, r: tile.r });
        } else {
          // 두 위치 사이에 장애물이 있는지 확인
          const hasObstacle = hasLineOfSightObstacle(unit.position, { q: tile.q, r: tile.r });
          if (!hasObstacle) {
            inRange.push({ q: tile.q, r: tile.r });
          }
        }
      }
    });
    
    return inRange;
  };
  
  // 두 위치 사이에 시야를 가로막는 장애물이 있는지 확인
  const hasLineOfSightObstacle = (from: Position, to: Position): boolean => {
    // 직접 이웃한 타일은 항상 볼 수 있음
    const distance = getDistance(from, to);
    if (distance <= 1) return false;
    
    // 두 위치 사이의 중간 타일들을 확인
    const intermediateTiles = getIntermediateTiles(from, to);
    
    // 중간 타일 중 하나라도 시야를 가로막는 지형이 있으면 true 반환
    return intermediateTiles.some(pos => {
      const tile = hexMap.find(t => t.q === pos.q && t.r === pos.r);
      // 산과 숲은 시야를 차단
      return tile && (tile.terrain === 'mountain' || tile.terrain === 'forest');
    });
  };
  
  // 두 위치 사이의 중간 타일들 계산 (선형 보간)
  const getIntermediateTiles = (from: Position, to: Position): Position[] => {
    const results: Position[] = [];
    const distance = getDistance(from, to);
    
    if (distance <= 1) return []; // 이웃 타일이면 중간 타일 없음
    
    // 큐브 좌표 변환 (q,r,s)
    const fromCube = { q: from.q, r: from.r, s: -from.q - from.r };
    const toCube = { q: to.q, r: to.r, s: -to.q - to.r };
    
    // 선을 따라 보간
    for (let i = 1; i < distance; i++) {
      const fraction = i / distance;
      
      // 선형 보간
      const q = Math.round(fromCube.q + (toCube.q - fromCube.q) * fraction);
      const r = Math.round(fromCube.r + (toCube.r - fromCube.r) * fraction);
      const s = Math.round(fromCube.s + (toCube.s - fromCube.s) * fraction);
      
      // 반올림 오차 보정
      let rx = q, ry = r, rz = s;
      
      const dx = Math.abs(rx - (fromCube.q + (toCube.q - fromCube.q) * fraction));
      const dy = Math.abs(ry - (fromCube.r + (toCube.r - fromCube.r) * fraction));
      const dz = Math.abs(rz - (fromCube.s + (toCube.s - fromCube.s) * fraction));
      
      if (dx > dy && dx > dz) {
        rx = -ry - rz;
      } else if (dy > dz) {
        ry = -rx - rz;
      } else {
        rz = -rx - ry;
      }
      
      results.push({ q: rx, r: ry });
    }
    
    return results;
  };
  
  // 시야 범위 내의 타일들
  const visionRangeTiles = calculateVisionRange();
  
  // 이동 범위 계산 (움직임 포인트 기준)
  const calculateMovementRange = (): Position[] => {
    if (!unit) return [];
    
    const movementLeft = unit.movementLeft || unit.movement;
    const inRange: Position[] = [];
    
    hexMap.forEach(tile => {
      const distance = getDistance(unit.position, { q: tile.q, r: tile.r });
      
      // 이동 범위 내에 있고, 지형이 이동 가능한지 확인
      if (distance > 0 && distance <= movementLeft) {
        // 지형에 따른 이동 제한 검사
        const canMove = isTileMoveable(tile, unit);
        if (canMove) {
          inRange.push({ q: tile.q, r: tile.r });
        }
      }
    });
    
    return inRange;
  };
  
  // 특정 타일로 유닛이 이동할 수 있는지 확인
  const isTileMoveable = (tile: HexTile, unit: Unit): boolean => {
    // 물 지형은 해상 유닛만 이동 가능
    if (tile.terrain === 'water' && unit.type !== 'naval') {
      return false;
    }
    
    // 산 지형은 추가 이동력이 필요
    if (tile.terrain === 'mountain' && unit.type !== 'flying') {
      // 예: 이동력이 2 이상인 유닛만 산을 넘을 수 있음
      if ((unit.movementLeft || unit.movement) < 2) {
        return false;
      }
    }
    
    // 이미 다른 유닛이 있는 타일로는 이동 불가 (적이면 공격은 가능하지만 여기서는 시각적 표시에만 집중)
    // 실제 게임에서는 유닛 소유자를 확인해야 함
    
    return true;
  };
  
  // 이동 범위 내의 타일들
  const movementRangeTiles = calculateMovementRange();
  
  return (
    <HexGrid width="100%" height="100%" viewBox={viewBox}>
      <Layout size={{ x: 5, y: 5 }} flat={true} spacing={1.05} origin={{ x: 0, y: 0 }}>
        {/* 시야 범위 렌더링 */}
        {visionRangeTiles.map((pos, index) => (
          <Hexagon
            key={`vision-${index}`}
            q={pos.q}
            r={pos.r}
            s={-pos.q-pos.r}
            fill="#4299e1"
            fillOpacity="0.3"
            stroke="#4299e1"
            strokeWidth="0.2"
            className="pointer-events-none"
          />
        ))}
        
        {/* 이동 범위 렌더링 */}
        {movementRangeTiles.map((pos, index) => (
          <Hexagon
            key={`movement-${index}`}
            q={pos.q}
            r={pos.r}
            s={-pos.q-pos.r}
            fill="#68d391"
            fillOpacity="0.4"
            stroke="#68d391"
            strokeWidth="0.2"
            className="pointer-events-none"
          />
        ))}
        
        {/* 유닛 위치 강조 */}
        <Hexagon
          key="unit-position"
          q={unit.position.q}
          r={unit.position.r}
          s={-unit.position.q-unit.position.r}
          fill="#f6ad55"
          fillOpacity="0.6"
          stroke="#ed8936"
          strokeWidth="0.4"
          className="pointer-events-none"
        />
      </Layout>
    </HexGrid>
  );
};

export default VisionRange;