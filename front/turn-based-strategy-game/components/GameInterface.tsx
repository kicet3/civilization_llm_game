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

const GameInterface: React.FC = () => {
  const [gameState, setGameState] = useState(mockGameState);
  const [hexMap, setHexMap] = useState<HexTile[]>([]);
  const [units, setUnits] = useState<Unit[]>(mockUnits);
  const [cities, setCities] = useState(mockCities);
  const [selectedTile, setSelectedTile] = useState<HexTile | null>(null);
  const [activeDialog, setActiveDialog] = useState<any | null>(null);
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [currentEvent, setCurrentEvent] = useState<GameEvent>(mockEvents[0]);
  
  // 유닛 및 전투 관련 상태
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [showUnitManagement, setShowUnitManagement] = useState<boolean>(false);
  const [combatMode, setCombatMode] = useState<boolean>(false);
  const [attackingUnit, setAttackingUnit] = useState<Unit | null>(null);
  const [defendingUnit, setDefendingUnit] = useState<Unit | null>(null);
  
  // 컴포넌트 마운트 시 맵 생성
  useEffect(() => {
    setHexMap(generateHexMap());
  }, []);
  
  // 타일 선택 핸들러
  const handleTileClick = (hex: HexTile) => {
    // 공격 모드 체크
    if (combatMode && attackingUnit) {
      const unitAtTile = findUnitAtPosition(units, { q: hex.q, r: hex.r });
      
      if (unitAtTile && unitAtTile.owner !== attackingUnit.owner) {
        // 방어자 설정 및 전투 시작
        setDefendingUnit(unitAtTile);
        return;
      }
      // 공격할 유닛이 없으면 공격 모드 취소
      setCombatMode(false);
      setAttackingUnit(null);
    }
    
    setSelectedTile(hex);
    
    // 선택한 타일에 유닛이 있는지 확인
    const unitAtTile = findUnitAtPosition(units, { q: hex.q, r: hex.r });
    
    if (unitAtTile) {
      setSelectedUnit(unitAtTile);
      setShowUnitManagement(true);
    } else {
      setSelectedUnit(null);
      setShowUnitManagement(false);
    }
  };
  
  // 턴 종료 핸들러
  const handleEndTurn = () => {
    // 턴 증가
    setGameState(prev => ({
      ...prev,
      turn: prev.turn + 1
    }));
    
    // 모든 유닛의 이동력 초기화
    setUnits(prevUnits => 
      prevUnits.map(unit => ({
        ...unit,
        movementLeft: unit.movement
      }))
    );
    
    // 이벤트 발생 시뮬레이션 (30% 확률)
    if (Math.random() < 0.3) {
      setCurrentEvent(mockEvents[Math.floor(Math.random() * mockEvents.length)]);
      setShowEventModal(true);
    }
  };
  
  // 유닛 이동 핸들러
  const handleUnitMove = (unit: Unit, destination: Position) => {
    setUnits(prevUnits => 
      prevUnits.map(u => 
        u.id === unit.id 
          ? { ...u, position: destination, movementLeft: 0 }
          : u
      )
    );
    
    // 선택된 타일 업데이트
    const newSelectedTile = hexMap.find(
      tile => tile.q === destination.q && tile.r === destination.r
    );
    
    if (newSelectedTile) {
      setSelectedTile(newSelectedTile);
    }
    
    // 유닛 관리 패널 닫기
    setShowUnitManagement(false);
  };
  
  // 공격 모드 설정
  const handleAttackMode = (unit: Unit) => {
    setCombatMode(true);
    setAttackingUnit(unit);
    setShowUnitManagement(false);
  };
  
  // 전투 결과 처리
  const handleCombatEnd = (result: {
    winner: 'attacker' | 'defender';
    destroyedUnit: Unit | null;
    damagedUnit: Unit | null;
  }) => {
    if (result.destroyedUnit) {
      // 패배한 유닛 제거
      setUnits(prevUnits => 
        prevUnits.filter(u => u.id !== result.destroyedUnit?.id)
      );
    }
    
    if (result.damagedUnit) {
      // 승리한 유닛 업데이트 (체력, 경험치 등)
      setUnits(prevUnits => 
        prevUnits.map(u => 
          u.id === result.damagedUnit?.id
            ? { 
                ...u, 
                strength: result.damagedUnit.strength,
                movementLeft: 0,
                experience: (u.experience || 0) + 5
              }
            : u
        )
      );
    }
    
    // 전투 모드 종료
    setCombatMode(false);
    setAttackingUnit(null);
    setDefendingUnit(null);
  };
  
  // NPC 대화 표시
  const showNpcDialog = (npcId: number) => {
    const dialog = mockNpcDialogs.find(d => d.id === npcId);
    if (dialog) {
      setActiveDialog(dialog);
    }
  };
  
  // 도시 건설 핸들러
  const handleFoundCity = (unit: Unit, cityName: string) => {
    // 새 도시 생성
    const newCity = {
      id: cities.length + 1,
      name: cityName,
      owner: unit.owner,
      population: 1,
      buildings: [],
      position: { ...unit.position },
      food: 5,
      growth: 10
    };
    
    // 도시 목록에 추가
    setCities([...cities, newCity]);
    
    // 정착민 유닛 제거
    setUnits(units.filter(u => u.id !== unit.id));
    
    // 타일 소유권 업데이트
    setHexMap(prevMap => 
      prevMap.map(tile => 
        tile.q === unit.position.q && tile.r === unit.position.r
          ? { ...tile, hasCity: true, owner: unit.owner }
          : tile
      )
    );
    
    // 이벤트 생성
    const cityEvent: GameEvent = {
      id: Date.now(),
      title: "새로운 도시 건설",
      description: `${cityName} 도시가 건설되었습니다!`,
      type: "cultural"
    };
    
    setCurrentEvent(cityEvent);
    setShowEventModal(true);
  };
  
  // 키보드 입력 처리 (단축키)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 스페이스바: 턴 종료
      if (e.code === 'Space') {
        handleEndTurn();
      }
      
      // ESC: 현재 모드 취소
      if (e.code === 'Escape') {
        setCombatMode(false);
        setAttackingUnit(null);
        setShowUnitManagement(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* 게임 맵 */}
      <div className="flex-grow">
        <MapCanvas 
          hexMap={hexMap}
          selectedTile={selectedTile}
          units={units}
          cities={cities}
          onTileClick={handleTileClick}
          turn={gameState.turn}
          year={gameState.year}
          combatMode={combatMode}
          attackingUnit={attackingUnit}
        />
      </div>
      
      {/* 사이드바 */}
      <Sidebar 
        gameState={gameState}
        selectedTile={selectedTile}
        selectedUnit={selectedUnit}
        onEndTurn={handleEndTurn}
        onShowNpcDialog={showNpcDialog}
      />
      
      {/* 유닛 관리 패널 */}
      {showUnitManagement && selectedUnit && (
        <div className="absolute bottom-4 left-4 z-10">
          <UnitManagement
            selectedUnit={selectedUnit}
            selectedTile={selectedTile}
            units={units}
            hexMap={hexMap}
            onUnitMove={handleUnitMove}
            onAttackMode={handleAttackMode}
            onFoundCity={handleFoundCity}
            onClose={() => setShowUnitManagement(false)}
          />
        </div>
      )}
      
      {/* 전투 시스템 */}
      {combatMode && attackingUnit && defendingUnit && (
        <CombatSystem
          attacker={attackingUnit}
          defender={defendingUnit}
          terrainBonus={
            selectedTile?.terrain === 'mountain' ? 3 :
            selectedTile?.terrain === 'forest' ? 2 : 0
          }
          onCombatEnd={handleCombatEnd}
        />
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
      
      {/* 게임 정보 및 도움말 */}
      <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-70 p-2 rounded-lg text-xs">
        <p>스페이스바: 턴 종료</p>
        <p>ESC: 취소</p>
        {combatMode && <p className="text-red-400">공격 모드: 적 유닛을 클릭하세요</p>}
      </div>
    </div>
  );
};

export default GameInterface;