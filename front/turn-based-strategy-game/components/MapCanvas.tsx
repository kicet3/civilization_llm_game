'use client'

import React from 'react';
import { Hexagon, HexGrid, Layout, Text } from 'react-hexgrid';
import { HexTile, GameState, Unit } from '@/lib/types';
import { getTileColor, isSamePosition } from '@/lib/utils';

interface MapCanvasProps {
  hexMap: HexTile[];
  selectedTile: HexTile | null;
  gameState: GameState;
  units: Unit[];
  onTileClick: (hex: HexTile) => void;
}

const MapCanvas: React.FC<MapCanvasProps> = ({ 
  hexMap, 
  selectedTile, 
  gameState, 
  units,
  onTileClick 
}) => {
  // 특정 타일에 있는 유닛 찾기
  const findUnitAtTile = (q: number, r: number): Unit | undefined => {
    return units.find(unit => 
      unit.position.q === q && unit.position.r === r
    );
  };

  // 유닛 타입에 따른 아이콘 결정
  const getUnitIcon = (unit: Unit): string => {
    if (unit.type === 'military') {
      return '⚔️';
    } else if (unit.type === 'civilian') {
      return '👷';
    } else {
      return '🏃';
    }
  };

  return (
    <div className="flex-grow relative">
      <HexGrid width="100%" height="100%" viewBox="-50 -50 100 100">
        <Layout size={{ x: 5, y: 5 }} flat={true} spacing={1.05} origin={{ x: 0, y: 0 }}>
          {hexMap.map((hex, index) => {
            const unitAtTile = findUnitAtTile(hex.q, hex.r);
            
            return (
              <Hexagon
                key={index}
                q={hex.q}
                r={hex.r}
                s={hex.s}
                fill={hex.owner === "player" ? `${getTileColor(hex.terrain)}` : 
                      hex.owner === "ai" ? `${getTileColor(hex.terrain)}` : 
                      getTileColor(hex.terrain)}
                onClick={() => onTileClick(hex)}
                className={selectedTile && selectedTile.q === hex.q && selectedTile.r === hex.r ? 'stroke-white stroke-2' : ''}
              >
                {/* 도시가 있는 경우 도시 아이콘 표시 */}
                {hex.hasCity && (
                  <Text>{hex.owner === "player" ? "🏛️" : "🏙️"}</Text>
                )}
                
                {/* 유닛이 있는 경우 유닛 아이콘 표시 */}
                {unitAtTile && !hex.hasCity && (
                  <Text>{getUnitIcon(unitAtTile)}</Text>
                )}
              </Hexagon>
            );
          })}
        </Layout>
      </HexGrid>
      
      {/* 현재 턴 표시 */}
      <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-70 p-2 rounded-lg">
        <p>턴: {gameState.turn} | {gameState.year}</p>
      </div>
      
      {/* 선택된 타일 정보 */}
      {selectedTile && (
        <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-70 p-2 rounded-lg">
          <p>지형: {selectedTile.terrain}</p>
          <p>좌표: ({selectedTile.q}, {selectedTile.r})</p>
          {selectedTile.owner && <p>소유: {selectedTile.owner}</p>}
          {findUnitAtTile(selectedTile.q, selectedTile.r) && (
            <p className="text-yellow-400">유닛 있음 (클릭하여 관리)</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MapCanvas;