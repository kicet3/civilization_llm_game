'use client'

import React from 'react';
import { Hexagon, HexGrid, Layout, Text } from 'react-hexgrid';
import { useGameStore } from '@/lib/store';
import { HexTile, Position } from '@/lib/types';

interface MapCanvasProps {
  onTileClick: (hex: Position) => void;
  turn: number;
  year: string;
}

const MapCanvas: React.FC<MapCanvasProps> = ({ 
  onTileClick,
  turn,
  year
}) => {
  const { hexMap, selectedTile, units, cities } = useGameStore();
  
  // 타일 색상 결정
  const getTileColor = (tile: HexTile): string => {
    const baseColor = 
      tile.terrain === 'plain' ? '#a3c557' :
      tile.terrain === 'mountain' ? '#8b8b8b' :
      tile.terrain === 'forest' ? '#2d6a4f' :
      tile.terrain === 'water' ? '#4ea8de' :
      tile.terrain === 'desert' ? '#e9c46a' : '#ffffff';
    
    // 소유자에 따라 색상 변경
    if (tile.owner === 'player') {
      return adjustColorBrightness(baseColor, 20); // 더 밝게
    } else if (tile.owner === 'ai') {
      return adjustColorBrightness(baseColor, -20); // 더 어둡게
    }
    
    return baseColor;
  };
  
  // 색상 밝기 조절 함수
  const adjustColorBrightness = (hex: string, percent: number): string => {
    // 헥스 코드를 RGB로 변환
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    // 밝기 조절
    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));
    
    // RGB를 헥스 코드로 변환하여 반환
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // 타일에 있는 유닛 찾기
  const findUnitAtTile = (q: number, r: number) => {
    return units.find(unit => unit.position.q === q && unit.position.r === r);
  };
  
  // 타일에 있는 도시 찾기
  const findCityAtTile = (q: number, r: number) => {
    return cities.find(city => city.position.q === q && city.position.r === r);
  };
  
  // 타일 아이콘 결정
  const getTileIcon = (tile: HexTile): string => {
    const city = findCityAtTile(tile.q, tile.r);
    if (city) {
      return city.owner === 'player' ? '🏛️' : '🏙️';
    }
    
    const unit = findUnitAtTile(tile.q, tile.r);
    if (unit) {
      if (unit.type === 'military') {
        return unit.name.includes('궁수') ? '🏹' : 
               unit.name.includes('기병') ? '🐎' : 
               unit.name.includes('창병') ? '🔱' : 
               unit.name.includes('검병') ? '⚔️' : '🛡️';
      } else if (unit.type === 'civilian') {
        return unit.name.includes('정착민') ? '🏠' : 
               unit.name.includes('노동자') ? '👷' : '👥';
      }
      return '👤';
    }
    
    // 자원 아이콘
    if (tile.resource) {
      return tile.resource === 'iron' ? '⚒️' :
             tile.resource === 'horses' ? '🐎' :
             tile.resource === 'oil' ? '🛢️' :
             tile.resource === 'uranium' ? '☢️' :
             tile.resource === 'gems' ? '💎' : '';
    }
    
    return '';
  };
  
  // 타일 스타일 결정
  const getTileStyle = (tile: HexTile): string => {
    let style = '';
    
    // 선택된 타일인 경우
    if (selectedTile && selectedTile.q === tile.q && selectedTile.r === tile.r) {
      style = 'stroke-white stroke-2';
    }
    
    return style;
  };
  
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
              fill={getTileColor(hex)}
              onClick={() => onTileClick(hex)}
              className={getTileStyle(hex)}
            >
              <Text>{getTileIcon(hex)}</Text>
            </Hexagon>
          ))}
        </Layout>
      </HexGrid>
      
      {/* 현재 턴 표시 */}
      <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-70 p-2 rounded-lg">
        <p>턴: {turn} | {year}</p>
      </div>
      
      {/* 게임 정보 및 미니맵 */}
      <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-70 p-2 rounded-lg">
        <p>지도 크기: {hexMap.length}칸</p>
        <p>유닛: {units.filter(u => u.position.q !== undefined).length}개</p>
        <p>도시: {cities.length}개</p>
      </div>
      
      {/* 마우스 오버 정보 패널 (선택 가능) */}
      {selectedTile && (
        <div className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-70 p-2 rounded-lg max-w-xs">
          <h3 className="font-bold text-sm">
            {selectedTile.terrain === 'plain' && '평지'}
            {selectedTile.terrain === 'mountain' && '산'}
            {selectedTile.terrain === 'forest' && '숲'}
            {selectedTile.terrain === 'water' && '물'}
            {selectedTile.terrain === 'desert' && '사막'}
            {selectedTile.resource && ` (${
              selectedTile.resource === 'iron' ? '철광석' :
              selectedTile.resource === 'horses' ? '말' :
              selectedTile.resource === 'oil' ? '석유' :
              selectedTile.resource === 'uranium' ? '우라늄' :
              selectedTile.resource === 'gems' ? '보석' : selectedTile.resource
            })`}
          </h3>
          
          {/* 선택된 타일에 도시가 있는 경우 */}
          {findCityAtTile(selectedTile.q, selectedTile.r) && (
            <div className="mt-1 text-xs">
              <p>도시: {findCityAtTile(selectedTile.q, selectedTile.r)?.name}</p>
              <p>인구: {findCityAtTile(selectedTile.q, selectedTile.r)?.population}</p>
            </div>
          )}
          
          {/* 선택된 타일에 유닛이 있는 경우 */}
          {findUnitAtTile(selectedTile.q, selectedTile.r) && (
            <div className="mt-1 text-xs">
              <p>유닛: {findUnitAtTile(selectedTile.q, selectedTile.r)?.name}</p>
              {findUnitAtTile(selectedTile.q, selectedTile.r)?.strength && (
                <p>전투력: {findUnitAtTile(selectedTile.q, selectedTile.r)?.strength}</p>
              )}
              <p>이동력: {findUnitAtTile(selectedTile.q, selectedTile.r)?.movementLeft} / {findUnitAtTile(selectedTile.q, selectedTile.r)?.movement}</p>
            </div>
          )}
          
          <p className="text-xs mt-1">좌표: ({selectedTile.q}, {selectedTile.r})</p>
        </div>
      )}
      
      {/* 단축키 도움말 */}
      <div className="absolute top-4 right-4 text-xs bg-gray-800 bg-opacity-70 p-2 rounded-lg">
        <p>스페이스바: 턴 종료</p>
        <p>M: 유닛 이동</p>
        <p>B: 도시 건설</p>
        <p>T: 기술 트리</p>
      </div>
    </div>
  );
};

export default MapCanvas;