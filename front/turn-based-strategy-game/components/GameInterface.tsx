'use client'

import React, { useState, useEffect } from 'react';
import MapCanvas from './MapCanvas';
import Sidebar from './Sidebar';
import UnitManagement from './UnitManagement';
import NpcDialog from './NpcDialog';
import EventModal from './EventModal';
import CombatSystem from './CombatSystem';
import { 
  mockGameState, 
  mockUnits, 
  mockCities, 
  mockNpcDialogs, 
  mockEvents,
  generateHexMap,
  getTileColor,
  findUnitAtPosition
} from '@/lib/mockData';
import { HexTile, Unit, Position, GameEvent } from '@/lib/types';
import { useGameStore } from '@/lib/store';

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
    endTurn,
    moveUnit
  } = useGameStore();
  
  const [activeDialog, setActiveDialog] = useState<any | null>(null);
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [currentEvent, setCurrentEvent] = useState<GameEvent>(mockEvents[0]);
  
  // 유닛 및 전투 관련 상태
  const [showUnitManagement, setShowUnitManagement] = useState<boolean>(false);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [combatMode, setCombatMode] = useState<boolean>(false);
  const [attackingUnit, setAttackingUnit] = useState<Unit | null>(null);
  const [defendingUnit, setDefendingUnit] = useState<Unit | null>(null);
  
  // 타일 선택 핸들러
  const handleTileClick = (hex: any) => {
    const tile = hexMap.find(t => t.q === hex.q && t.r === hex.r);
    if (tile) {
      selectTile(tile);
      
      // 선택한 타일에 유닛이 있는지 확인
      const unitAtTile = units.find(unit => 
        unit.position.q === hex.q && unit.position.r === hex.r
      );
      
      if (unitAtTile) {
        setSelectedUnitId(unitAtTile.id);
        setShowUnitManagement(true);
      } else {
        setSelectedUnitId(null);
        setShowUnitManagement(false);
      }
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
  
  // 유닛 이동 핸들러
  const handleUnitMove = (unitId: number, destination: Position) => {
    moveUnit(unitId, destination);
    setShowUnitManagement(false);
  };
  
  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* 게임 맵 */}
      <MapCanvas 
        onTileClick={handleTileClick}
        turn={turn}
        year={year}
      />
      
      {/* 사이드바 */}
      <Sidebar />
      
      {/* 유닛 관리 패널 */}
      {showUnitManagement && selectedUnitId !== null && (
        <div className="absolute bottom-4 left-4 z-10">
          <UnitManagement
            selectedUnitId={selectedUnitId}
          />
        </div>
      )}
      
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