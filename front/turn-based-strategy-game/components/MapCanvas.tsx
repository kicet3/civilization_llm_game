'use client'

import React, { useState, useRef, useEffect } from 'react';
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
  
  // 확대/축소 및 패닝 관련 상태
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  
  // 맵 컨테이너 참조
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
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
  
  // 휠 이벤트 핸들러 - 확대/축소
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    const newScale = Math.max(0.5, Math.min(3, scale + delta)); // 최소 0.5, 최대 3배로 제한
    setScale(newScale);
  };
  
  // 마우스 드래그 시작
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // 좌클릭만 처리
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  // 마우스 드래그 중
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setPosition({
      x: position.x + dx / scale,
      y: position.y + dy / scale
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  // 마우스 드래그 종료
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // 마우스가 맵 영역을 벗어났을 때
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // 맵 중앙으로 이동
  const centerMap = () => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
  };
  
  // 타일 클릭 핸들러
  const handleTileClick = (hex: any) => {
    // 드래그 중에는 클릭 이벤트를 무시
    if (isDragging) return;
    onTileClick(hex);
  };
  
  useEffect(() => {
    // 컴포넌트 마운트 시 마우스 이벤트 추가
    document.addEventListener('mouseup', handleMouseUp);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 타일에 적용할 애니메이션 클래스
  const getTileAnimationClass = (q: number, r: number) => {
    // 선택된 타일에 펄스 애니메이션 적용
    if (selectedTile && selectedTile.q === q && selectedTile.r === r) {
      return 'animate-pulse';
    }
    return '';
  };

  // 맵 계산에 사용될 ViewBox
  const calculateViewBox = () => {
    const baseSize = 100;
    const adjustedWidth = baseSize / scale;
    const adjustedHeight = baseSize / scale;
    
    return `${-adjustedWidth/2 - position.x} ${-adjustedHeight/2 - position.y} ${adjustedWidth} ${adjustedHeight}`;
  };

  return (
    <div 
      className="flex-grow relative overflow-hidden"
      ref={mapContainerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <HexGrid width="100%" height="100%" viewBox={calculateViewBox()}>
        <Layout size={{ x: 5, y: 5 }} flat={true} spacing={1.05} origin={{ x: 0, y: 0 }}>
          {hexMap.map((hex, index) => {
            const unitAtTile = findUnitAtTile(hex.q, hex.r);
            const cityAtTile = findCityAtTile(hex.q, hex.r);
            const animationClass = getTileAnimationClass(hex.q, hex.r);
            
            return (
              <Hexagon
                key={index}
                q={hex.q}
                r={hex.r}
                s={hex.s}
                fill={getTileColor(hex.terrain)}
                onClick={() => handleTileClick(hex)}
                className={`
                  transition-all duration-200 hover:brightness-125
                  ${selectedTile && selectedTile.q === hex.q && selectedTile.r === hex.r ? 'stroke-white stroke-2' : ''}
                  ${animationClass}
                `}
              >
                {/* 도시가 있는 경우 도시 아이콘 표시 */}
                {cityAtTile && (
                  <Text className="text-lg">{cityAtTile.owner === "player" ? "🏛️" : "🏙️"}</Text>
                )}
                
                {/* 유닛이 있는 경우 유닛 아이콘 표시 */}
                {unitAtTile && !cityAtTile && (
                  <Text className="text-lg">{getUnitIcon(unitAtTile.type)}</Text>
                )}
                
                {/* 자원이 있는 경우 자원 아이콘 표시 */}
                {hex.resource && !cityAtTile && !unitAtTile && (
                  <Text className="text-sm">
                    {hex.resource === 'iron' && '⛏️'}
                    {hex.resource === 'horses' && '🐎'}
                    {hex.resource === 'oil' && '🛢️'}
                    {hex.resource === 'uranium' && '☢️'}
                    {hex.resource === 'gems' && '💎'}
                  </Text>
                )}
              </Hexagon>
            );
          })}
        </Layout>
      </HexGrid>
      
      {/* 맵 컨트롤 */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button 
          className="bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          onClick={() => setScale(Math.min(3, scale + 0.2))}
          title="확대"
        >
          ➕
        </button>
        <button 
          className="bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          onClick={() => setScale(Math.max(0.5, scale - 0.2))}
          title="축소"
        >
          ➖
        </button>
        <button 
          className="bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          onClick={centerMap}
          title="중앙으로"
        >
          ⟳
        </button>
      </div>
      
      {/* 현재 턴 표시 */}
      <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-70 p-2 rounded-lg shadow-lg">
        <p>턴: {turn} | {year}</p>
      </div>
      
      {/* 선택된 타일 정보 */}
      {selectedTile && (
        <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-70 p-2 rounded-lg shadow-lg">
          <p>지형: {
            selectedTile.terrain === 'plain' ? '평지' :
            selectedTile.terrain === 'mountain' ? '산' : 
            selectedTile.terrain === 'forest' ? '숲' :
            selectedTile.terrain === 'water' ? '물' : '사막'
          }</p>
          {selectedTile.resource && (
            <p>자원: {
              selectedTile.resource === 'iron' ? '철광석' :
              selectedTile.resource === 'horses' ? '말' :
              selectedTile.resource === 'oil' ? '석유' :
              selectedTile.resource === 'uranium' ? '우라늄' : '보석'
            }</p>
          )}
          <p>좌표: ({selectedTile.q}, {selectedTile.r})</p>
          {selectedTile.owner && <p>소유: {selectedTile.owner === 'player' ? '플레이어' : 'AI'}</p>}
          {findUnitAtTile(selectedTile.q, selectedTile.r) && (
            <p className="text-yellow-400">유닛 있음 (클릭하여 관리)</p>
          )}
        </div>
      )}
      
      {/* 확대/축소 및 위치 정보 */}
      <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-70 px-2 py-1 rounded text-sm">
        <span>배율: {Math.round(scale * 100)}%</span>
      </div>
    </div>
  );
};

export default MapCanvas;