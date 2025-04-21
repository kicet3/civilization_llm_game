'use client'

import React, { useState, useEffect } from 'react';
import MapCanvas from './MapCanvas';
import Sidebar from './Sidebar';
import NpcDialog from './NpcDialog';
import EventModal from './EventModal';
import { 
  mockGameState, 
  generateHexMap, 
  mockUnits, 
  mockCities, 
  mockNpcDialogs, 
  mockEvents 
} from '@/lib/mockData';
import { 
  HexTile, 
  GameState, 
  Unit, 
  City, 
  NpcDialog as NpcDialogType, 
  GameEvent 
} from '@/lib/types';

const GameInterface: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(mockGameState);
  const [hexMap, setHexMap] = useState<HexTile[]>([]);
  const [units, setUnits] = useState<Unit[]>(mockUnits);
  const [cities, setCities] = useState<City[]>(mockCities);
  const [selectedTile, setSelectedTile] = useState<HexTile | null>(null);
  const [activeDialog, setActiveDialog] = useState<NpcDialogType | null>(null);
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [currentEvent, setCurrentEvent] = useState<GameEvent>(mockEvents[0]);
  
  // 컴포넌트 마운트 시 맵 생성
  useEffect(() => {
    setHexMap(generateHexMap());
  }, []);
  
  // 타일 선택 핸들러
  const handleTileClick = (hex: HexTile) => {
    setSelectedTile(hex);
  };
  
  // NPC 대화 표시
  const showNpcDialog = (npcId: number) => {
    const dialog = mockNpcDialogs.find(d => d.id === npcId);
    if (dialog) {
      setActiveDialog(dialog);
    }
  };
  
  // 턴 종료 핸들러
  const handleEndTurn = () => {
    setGameState(prev => ({
      ...prev,
      turn: prev.turn + 1
    }));
    
    // 이벤트 발생 시뮬레이션 (30% 확률)
    if (Math.random() < 0.3) {
      setCurrentEvent(mockEvents[Math.floor(Math.random() * mockEvents.length)]);
      setShowEventModal(true);
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* 게임 맵 */}
      <MapCanvas 
        hexMap={hexMap}
        selectedTile={selectedTile}
        onTileClick={handleTileClick}
        gameState={gameState}
      />
      
      {/* 사이드바 */}
      <Sidebar 
        gameState={gameState}
        selectedTile={selectedTile}
        onEndTurn={handleEndTurn}
        onShowNpcDialog={showNpcDialog}
      />
      
      {/* NPC 대화 모달 */}
      {activeDialog && (
        <NpcDialog 
          dialog={activeDialog}
          onClose={() => setActiveDialog(null)}
        />
      )}
      
      {/* 이벤트 모달 */}
      {showEventModal && (
        <EventModal 
          event={currentEvent}
          onClose={() => setShowEventModal(false)}
        />
      )}
    </div>
  );
};

export default GameInterface;