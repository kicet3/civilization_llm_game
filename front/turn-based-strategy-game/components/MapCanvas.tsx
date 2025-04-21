'use client'

import React from 'react';
import { Hexagon, HexGrid, Layout, Text } from 'react-hexgrid';
import { HexTile, GameState } from '@/lib/types';
import { getTileColor } from '@/lib/utils';

interface MapCanvasProps {
  hexMap: HexTile[];
  selectedTile: HexTile | null;
  gameState: GameState;
  onTileClick: (hex: HexTile) => void;
}

const MapCanvas: React.FC<MapCanvasProps> = ({ 
  hexMap, 
  selectedTile, 
  gameState, 
  onTileClick 
}) => {
  return (
    <div className="flex-grow relative">
      <HexGrid width="100%" height="100%" viewBox="-50 -50 100 100">
        <Layout size={{ x: 5, y: 5 }} flat={true} spacing={1.05} origin={{ x: 0, y: 0 }}>
          {hexMap.map((hex, index) => (
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
              {hex.hasCity && (
                <Text>{hex.owner === "player" ? "🏛️" : "🏙️"}</Text>
              )}
              {hex.hasUnit && !hex.hasCity && (
                <Text>{hex.owner === "player" ? "⚔️" : "👥"}</Text>
              )}
            </Hexagon>
          ))}
        </Layout>
      </HexGrid>
      
      {/* 현재 턴 표시 */}
      <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-70 p-2 rounded-lg">
        <p>턴: {gameState.turn} | {gameState.year}</p>
      </div>
    </div>
  );
};

export default MapCanvas;