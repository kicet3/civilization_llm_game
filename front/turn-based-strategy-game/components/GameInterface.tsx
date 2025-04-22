'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/store';
import Sidebar from './Sidebar';
import MapCanvas from './MapCanvas';
import FogOfWar from './FogOfWar';
import VisionRange from './VisionRange';
import MiniMap from './MiniMap';
import NpcDialog from './NpcDialog';
import EventModal from './EventModal';
import UnitManagement from './UnitManagement';
import  useTileInteraction  from '@/lib/hooks/useTileInteraction';
import { HexTile, Unit, Position, GameEvent } from '@/lib/types';
import { mockEvents } from '@/lib/mockData';

const GameInterface: React.FC = () => {
  // Zustand 스토어 사용
  const { 
    turn, 
    year, 
    hexMap, 
    selectedTile, 
    selectTile, 
    units, 
    cities, 
    endTurn 
  } = useGameStore();
  
  // 타일 상호작용 훅 사용
  const {
    selectedUnit,
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
  } = useTileInteraction();
  
  // 맵 상태 관리
  const [viewBox, setViewBox] = useState('-50 -50 100 100');
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // UI 상태 관리
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showFogOfWar, setShowFogOfWar] = useState(true);
  const [showUnitManagement, setShowUnitManagement] = useState(false);
  const [activeDialog, setActiveDialog] = useState<any | null>(null);
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  
  // 맵 클릭 핸들러
  const handleMapClick = (hex: any) => {
    const tile = hexMap.find(t => t.q === hex.q && t.r === hex.r);
    if (tile) {
      handleTileClick(tile);
      
      // 유닛이 선택되었으면 유닛 관리 패널 표시
      if (selectedUnit) {
        setShowUnitManagement(true);
      } else {
        setShowUnitManagement(false);
      }
    }
  };
  
  // 턴 종료 핸들러
  const handleEndTurn = () => {
    endTurn();
    
    // 이벤트 발생 확률 (30%)
    if (Math.random() < 0.3) {
      triggerRandomEvent();
    }
  };
  
  // 랜덤 이벤트 트리거
  const triggerRandomEvent = () => {
    // 랜덤하게 이벤트 선택
    const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
    setCurrentEvent(randomEvent);
    setShowEventModal(true);
  };
  
  // 미니맵 위치 클릭 핸들러
  const handleMiniMapClick = (q: number, r: number) => {
    // 맵 중심 이동
    const newPosition = {
      x: -q * 2, // 적절한 비율로 조정
      y: -r * 2  // 적절한 비율로 조정
    };
    setPosition(newPosition);
    
    // 해당 타일 찾기
    const tile = hexMap.find(t => t.q === q && t.r === r);
    if (tile) {
      selectTile(tile);
    }
  };
  
  // 뷰박스 계산
  useEffect(() => {
    const baseSize = 100;
    const adjustedWidth = baseSize / scale;
    const adjustedHeight = baseSize / scale;
    
    const viewBoxValue = `${-adjustedWidth/2 - position.x} ${-adjustedHeight/2 - position.y} ${adjustedWidth} ${adjustedHeight}`;
    setViewBox(viewBoxValue);
  }, [scale, position]);
  
  // 메인 맵 컨테이너 참조
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* 게임 맵 영역 */}
      <div 
        ref={mapContainerRef}
        className="flex-grow relative overflow-hidden"
      >
        {/* 메인 맵 - 저수준에서 높은 수준으로 레이어 쌓기 */}
        <div className="absolute inset-0">
          <MapCanvas 
            onTileClick={handleMapClick}
            turn={turn}
            year={year}
          />
        </div>
        
        {/* 시야 범위 레이어 */}
        {selectedUnit && (
          <div className="absolute inset-0 pointer-events-none">
            <VisionRange
              unit={selectedUnit}
              viewBox={viewBox}
            />
          </div>
        )}
        
        {/* 안개 레이어 */}
        {showFogOfWar && (
          <div className="absolute inset-0 pointer-events-none">
            <FogOfWar 
              viewBox={viewBox}
              onTileClick={showFogOfWar ? undefined : handleMapClick}
            />
          </div>
        )}
        
        {/* 맵 컨트롤 패널 */}
        <div className="absolute bottom-20 right-4 flex flex-col gap-2 z-10">
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
            onClick={() => setPosition({ x: 0, y: 0 })}
            title="중앙으로"
          >
            ⟳
          </button>
          <button 
            className={`p-2 rounded-full shadow-lg transition-colors ${showFogOfWar ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-700'}`}
            onClick={() => setShowFogOfWar(!showFogOfWar)}
            title={showFogOfWar ? '안개 숨기기' : '안개 표시'}
          >
            👁️
          </button>
        </div>
        
        {/* 미니맵 */}
        {showMiniMap && (
          <div className="absolute bottom-4 left-4 z-10">
            <MiniMap
              width={150}
              height={150}
              onPositionClick={handleMiniMapClick}
              viewportPosition={position}
              viewportScale={scale}
            />
          </div>
        )}
        
        {/* 선택된 유닛 컨트롤 패널 */}
        {showUnitManagement && selectedUnit && (
          <div className="absolute bottom-4 left-28 z-10 bg-gray-800 p-2 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">{selectedUnit.name}</h3>
              <button 
                className="text-gray-400 hover:text-white"
                onClick={() => setShowUnitManagement(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="mb-2 text-sm">
              <p>이동력: {selectedUnit.movementLeft || 0}/{selectedUnit.movement}</p>
              {selectedUnit.type === 'military' && (
                <p>전투력: {selectedUnit.strength}</p>
              )}
            </div>
            
            <div className="flex flex-col gap-1">
              {selectedUnit.movementLeft && selectedUnit.movementLeft > 0 && (
                <button 
                  className={`px-2 py-1 rounded ${isMoving ? 'bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  onClick={isMoving ? handleCancel : handleMoveStart}
                >
                  {isMoving ? '이동 취소' : '이동'}
                </button>
              )}
              
              {selectedUnit.type === 'military' && selectedUnit.movementLeft && selectedUnit.movementLeft > 0 && (
                <button 
                  className="px-2 py-1 rounded bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    // 공격 처리 로직
                    const attackTargets = calculateAttackRange(selectedUnit);
                    if (attackTargets.length === 0) {
                      alert('공격 가능한 대상이 없습니다.');
                    } else {
                      // 공격 모드 처리 (여기서는 미구현)
                      alert('공격 가능한 대상: ' + attackTargets.length + '개');
                    }
                  }}
                >
                  공격
                </button>
              )}
              
              {selectedUnit.name === '정착민' && (
                <button 
                  className={`px-2 py-1 rounded ${isBuildingCity ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                  onClick={isBuildingCity ? handleCancel : handleBuildCityStart}
                >
                  {isBuildingCity ? '건설 취소' : '도시 건설'}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* 턴 정보 표시 */}
        <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-70 p-2 rounded-lg z-10">
          <p>턴: {turn} | {year}</p>
        </div>
        
        {/* 모드 상태 표시 */}
        {(isMoving || isBuildingCity) && (
          <div className="absolute top-16 left-4 bg-gray-800 bg-opacity-70 p-2 rounded-lg z-10">
            <p>{isMoving ? '이동 모드' : isBuildingCity ? '도시 건설 모드' : ''}</p>
            <p className="text-xs text-gray-400">ESC 키를 누르거나 다른 곳을 클릭하여 취소</p>
          </div>
        )}
      </div>
      
      {/* 사이드바 */}
      <Sidebar onEndTurn={handleEndTurn} />
      
      {/* NPC 대화 모달 */}
      {activeDialog && (
        <NpcDialog 
          dialog={activeDialog}
          onClose={() => setActiveDialog(null)}
        />
      )}
      
      {/* 이벤트 모달 */}
      {showEventModal && currentEvent && (
        <EventModal 
          event={currentEvent}
          onClose={() => setShowEventModal(false)}
        />
      )}
      
      {/* 키보드 이벤트 리스너 - ESC로 모드 취소 */}
      <KeyboardListener onEscape={handleCancel} />
    </div>
  );
};

// 키보드 이벤트 처리를 위한 컴포넌트
const KeyboardListener: React.FC<{ onEscape: () => void }> = ({ onEscape }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEscape]);
  
  return null; // 실제 렌더링되는 요소 없음
};

export default GameInterface;