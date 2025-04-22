'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Hexagon, HexGrid, Layout, Pattern } from 'react-hexgrid';
import { useGameStore } from '@/lib/store';
import { HexTile, Position, TileVisibility } from '@/lib/types';
import { getDistance } from '@/lib/utils';

interface FogOfWarProps {
  viewBox: string;
  onTileClick?: (hex: any) => void;
  fadeSpeed?: number; // 페이드 속도 (밀리초)
}

const FogOfWar: React.FC<FogOfWarProps> = ({ 
  viewBox, 
  onTileClick,
  fadeSpeed = 300
}) => {
  // 게임 스토어에서 필요한 데이터 가져오기
  const { hexMap, units, cities, turn } = useGameStore();
  
  // 시야 상태 관리
  const [visibilityMap, setVisibilityMap] = useState<Map<string, { 
    status: TileVisibility, 
    opacity: number 
  }>>(new Map());
  
  // 타일의 시야 상태 계산 (유닛과 도시 위치에 따라)
  const calculateVisibility = () => {
    const result = new Map<string, TileVisibility>();
    
    // 플레이어 유닛의 위치 모음
    const playerUnitPositions = units
      .filter(unit => unit.owner === 'player')
      .map(unit => ({
        pos: unit.position,
        range: unit.visionRange || 2 // 기본 시야 범위 2
      }));
    
    // 플레이어 도시의 위치 모음
    const playerCityPositions = cities
      .filter(city => city.owner === 'player')
      .map(city => ({
        pos: city.position,
        range: 3 // 도시는 시야 범위 3
      }));
    
    // 모든 시야 포인트 결합
    const sightPoints = [...playerUnitPositions, ...playerCityPositions];
    
    // 각 타일의 시야 상태 결정
    hexMap.forEach(tile => {
      const tileKey = `${tile.q},${tile.r}`;
      
      // 시야 범위 내에 있는지 확인
      const isVisible = sightPoints.some(({ pos, range }) => {
        const distance = getDistance(pos, { q: tile.q, r: tile.r });
        
        if (distance <= range) {
          // 직접적인 시야 내의 타일
          if (distance <= 1) return true;
          
          // 거리가 1보다 크면 시야 차단 확인 (라인 오브 사이트)
          return !hasLineOfSightObstacle(pos, { q: tile.q, r: tile.r }, hexMap);
        }
        
        return false;
      });
      
      if (isVisible) {
        result.set(tileKey, 'visible');
      } else {
        // 타일에 explored 속성이 있으면 사용, 없으면 임의로 결정 (데모용)
        const isExplored = tile.explored ?? (tile.owner === 'player' || Math.random() > 0.7);
        result.set(tileKey, isExplored ? 'explored' : 'hidden');
      }
    });
    
    return result;
  };
  
  // 두 위치 사이에 시야를 가로막는 장애물이 있는지 확인
  const hasLineOfSightObstacle = (from: Position, to: Position, hexMap: HexTile[]): boolean => {
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

  // 턴이 변경될 때마다 시야 상태 업데이트
  useEffect(() => {
    // 새 시야 상태 계산
    const newVisibility = calculateVisibility();
    
    // 애니메이션을 위해 현재 상태와 새 상태를 병합
    const updatedVisibilityMap = new Map(visibilityMap);
    
    newVisibility.forEach((status, key) => {
      const current = updatedVisibilityMap.get(key);
      
      if (!current) {
        // 새로운 타일
        updatedVisibilityMap.set(key, { 
          status, 
          opacity: status === 'visible' ? 0 : 
                  status === 'explored' ? 0.6 : 0.9 
        });
      } else if (current.status !== status) {
        // 상태가 변경된 타일
        updatedVisibilityMap.set(key, { 
          status, 
          opacity: current.opacity // 현재 불투명도 유지 (애니메이션으로 변경)
        });
      }
    });
    
    setVisibilityMap(updatedVisibilityMap);
    
  }, [turn, units, cities, hexMap]);
  
  // 불투명도 애니메이션 처리
  useEffect(() => {
    if (visibilityMap.size === 0) return;
    
    const startTime = Date.now();
    
    const animateOpacity = () => {
      const elapsed = Math.min(fadeSpeed, Date.now() - startTime);
      const progress = elapsed / fadeSpeed;
      
      let hasUpdates = false;
      const updatedMap = new Map<string, { status: TileVisibility, opacity: number }>();
      
      visibilityMap.forEach((data, key) => {
        // 목표 불투명도 계산
        const targetOpacity = data.status === 'visible' ? 0 : 
                             data.status === 'explored' ? 0.6 : 0.9;
        
        // 현재 불투명도에서 목표 불투명도로 보간
        const newOpacity = data.opacity + (targetOpacity - data.opacity) * progress;
        
        // 값이 충분히 변경되었는지 확인
        if (Math.abs(newOpacity - data.opacity) > 0.01) {
          hasUpdates = true;
          updatedMap.set(key, { status: data.status, opacity: newOpacity });
        } else {
          // 거의 목표에 도달했으면 정확한 값 사용
          updatedMap.set(key, { status: data.status, opacity: targetOpacity });
        }
      });
      
      if (hasUpdates) {
        setVisibilityMap(updatedMap);
        requestAnimationFrame(animateOpacity);
      }
    };
    
    const animationId = requestAnimationFrame(animateOpacity);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [visibilityMap, fadeSpeed]);
  
  // 텍스처 패턴 SVG 정의
  const fogPatternSvg = `
    <pattern id="fogPattern" patternUnits="userSpaceOnUse" width="100" height="100">
      <rect width="100" height="100" fill="#2d3748" fill-opacity="0.8" />
      <circle cx="50" cy="50" r="30" fill="#1a202c" fill-opacity="0.7" />
      <circle cx="20" cy="80" r="20" fill="#1a202c" fill-opacity="0.5" />
      <circle cx="80" cy="20" r="15" fill="#1a202c" fill-opacity="0.6" />
    </pattern>
  `;
  
  const exploredPatternSvg = `
    <pattern id="exploredPattern" patternUnits="userSpaceOnUse" width="100" height="100">
      <rect width="100" height="100" fill="#1a202c" fill-opacity="0.5" />
      <line x1="0" y1="0" x2="100" y2="100" stroke="#2d3748" stroke-width="1" stroke-opacity="0.3" />
      <line x1="100" y1="0" x2="0" y2="100" stroke="#2d3748" stroke-width="1" stroke-opacity="0.3" />
    </pattern>
  `;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg width="0" height="0">
        <defs dangerouslySetInnerHTML={{ __html: fogPatternSvg + exploredPatternSvg }} />
      </svg>
      
      <HexGrid width="100%" height="100%" viewBox={viewBox}>
        <Pattern id="fog-pattern" link="#fogPattern" size={{ x: 10, y: 10 }} />
        <Pattern id="dim-pattern" link="#exploredPattern" size={{ x: 10, y: 10 }} />
        
        <Layout size={{ x: 5, y: 5 }} flat={true} spacing={1.05} origin={{ x: 0, y: 0 }}>
          {hexMap.map((hex, index) => {
            const key = `${hex.q},${hex.r}`;
            const visData = visibilityMap.get(key);
            
            // 시야 데이터가 없으면 기본값 사용
            const status = visData?.status || 'hidden';
            const opacity = visData?.opacity !== undefined ? visData.opacity : 
                           (status === 'visible' ? 0 : 
                            status === 'explored' ? 0.6 : 0.9);
            
            // 완전히 투명한 타일은 렌더링하지 않음 (최적화)
            if (status === 'visible' && opacity < 0.05) {
              return null;
            }
            
            return (
              <Hexagon
                key={`fog-${index}`}
                q={hex.q}
                r={hex.r}
                s={-hex.q-hex.r}
                fill={status === 'hidden' ? "url(#fog-pattern)" : "url(#dim-pattern)"}
                fillOpacity={opacity}
                className="transition-opacity duration-300"
                style={{ pointerEvents: onTileClick ? 'auto' : 'none' }}
                onClick={onTileClick ? () => onTileClick(hex) : undefined}
              />
            );
          })}
        </Layout>
      </HexGrid>
    </div>
  );
};

export default FogOfWar;