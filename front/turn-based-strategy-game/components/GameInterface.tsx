'use client'

import React, { useEffect, useState } from 'react';
import MapCanvas from './MapCanvas';
import Sidebar from './Sidebar';
import NpcDialog from './NpcDialog';
import EventModal from './EventModal';
import { mockNpcDialogs, mockEvents } from '@/lib/mockData';
import { NpcDialog as NpcDialogType, GameEvent } from '@/lib/types';
import { useGameStore } from '@/lib/store';

const GameInterface: React.FC = () => {
  const { 
    turn,
    year,
    hexMap,
    selectedTile,
    selectTile,
    endTurn
  } = useGameStore();
  
  const [activeDialog, setActiveDialog] = useState<NpcDialogType | null>(null);
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [currentEvent, setCurrentEvent] = useState<GameEvent>(mockEvents[0]);
  
  // 타일 선택 핸들러
  const handleTileClick = (hex: any) => {
    const tile = hexMap.find(t => t.q === hex.q && t.r === hex.r);
    if (tile) {
      selectTile(tile);
    }
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
    endTurn();
    
    // 이벤트 발생 시뮬레이션 (30% 확률)
    if (Math.random() < 0.3) {
      setCurrentEvent(mockEvents[Math.floor(Math.random() * mockEvents.length)]);
      setShowEventModal(true);
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* 게임 맵 */}
      <div className="flex-grow">
        <MapCanvas 
          onTileClick={handleTileClick}
          turn={turn}
          year={year}
        />
      </div>
      
      {/* 사이드바 */}
      <Sidebar />
      
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