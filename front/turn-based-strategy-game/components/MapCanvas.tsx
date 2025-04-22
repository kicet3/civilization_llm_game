// MapCanvas.tsx
'use client'

import React from 'react';
import { Hexagon, HexGrid, Layout, Text } from 'react-hexgrid';
import { useGameStore } from '@/lib/store';
import { getTileColor } from '@/lib/utils';

interface MapCanvasProps {
  onTileClick: (hex: any) => void;
  turn: number;
  year: string;
}

const MapCanvas: React.FC<MapCanvasProps> = ({ 
  onTileClick,
  turn,
  year
}) => {
  // Zustand 스토어에서 필요한 상태들을 가져옵니다
  const { hexMap, selectedTile, units, cities } = useGameStore();
  
  // 특정 타일에 있는 유닛 찾기
  const findUnitAtTile = (q: number, r: number) => {
    return units.find(unit => 
      unit.position.q === q && unit.position.r === r
    );
  };

  // 유닛 타입에 따른 아이콘 결정
  const getUnitIcon = (unitType: string): string => {
    if (unitType === 'military') {
      return '⚔️';
    } else if (unitType === 'civilian') {
      return '👷';
    } else if (unitType === 'naval') {
      return '⛵';
    } else {
      return '🏃';
    }
  };

  // 타일에 있는 도시 찾기
  const findCityAtTile = (q: number, r: number) => {
    return cities.find(city => 
      city.position.q === q && city.position.r === r
    );
  };

  return (
    <div className="flex-grow relative">
      <HexGrid width="100%" height="100%" viewBox="-50 -50 100 100">
        <Layout size={{ x: 5, y: 5 }} flat={true} spacing={1.05} origin={{ x: 0, y: 0 }}>
          {hexMap.map((hex, index) => {
            const unitAtTile = findUnitAtTile(hex.q, hex.r);
            const cityAtTile = findCityAtTile(hex.q, hex.r);
            
            return (
              <Hexagon
                key={index}
                q={hex.q}
                r={hex.r}
                s={hex.s}
                fill={getTileColor(hex.terrain)}
                onClick={() => onTileClick(hex)}
                className={selectedTile && selectedTile.q === hex.q && selectedTile.r === hex.r ? 'stroke-white stroke-2' : ''}
              >
                {/* 도시가 있는 경우 도시 아이콘 표시 */}
                {cityAtTile && (
                  <Text>{cityAtTile.owner === "player" ? "🏛️" : "🏙️"}</Text>
                )}
                
                {/* 유닛이 있는 경우 유닛 아이콘 표시 */}
                {unitAtTile && !cityAtTile && (
                  <Text>{getUnitIcon(unitAtTile.type)}</Text>
                )}
              </Hexagon>
            );
          })}
        </Layout>
      </HexGrid>
      
      {/* 현재 턴 표시 */}
      <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-70 p-2 rounded-lg">
        <p>턴: {turn} | {year}</p>
      </div>
      
      {/* 선택된 타일 정보 */}
      {selectedTile && (
        <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-70 p-2 rounded-lg">
          <p>지형: {
            selectedTile.terrain === 'plain' ? '평지' :
            selectedTile.terrain === 'mountain' ? '산' : 
            selectedTile.terrain === 'forest' ? '숲' :
            selectedTile.terrain === 'water' ? '물' : '사막'
          }</p>
          <p>좌표: ({selectedTile.q}, {selectedTile.r})</p>
          {selectedTile.owner && <p>소유: {selectedTile.owner === 'player' ? '플레이어' : 'AI'}</p>}
          {findUnitAtTile(selectedTile.q, selectedTile.r) && (
            <p className="text-yellow-400">유닛 있음 (클릭하여 관리)</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MapCanvas;