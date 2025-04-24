"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Menu, MessageSquare, Settings, Map, Book, 
  Beaker, Users, Sword, Award, ChevronUp, 
  ChevronDown, User, Send, 
  Home 
} from 'lucide-react';
import TurnManager, { TurnPhase } from './TurnManager';
import CityManagementPanel from "./city-management/CityManagementPanel";
import ResearchPanel from "./research-management/ResearchPanel";
import UnitPanel from "./unit-management/UnitPanel";
import DiplomacyPanel from "./diplomacy-management/DiplomacyPanel";
import ReligionPanel from "./religion-management/ReligionPanel";
import PolicyPanel from "./policy-management/PolicyPanel";
import HexMap from './map-management/HexMap';
import Toast from './ui/Toast';

// 서비스 API 가져오기
import gameService, { 
  GameState, 
  HexTile, 
  Unit, 
  City,
  ResearchState,
  PolicyState,
  ReligionState,
  DiplomacyState
} from '@/services/gameService';

interface LogEntry {
  type: 'system' | 'advisor' | 'event' | 'player';
  content: string;
  turn: number;
}

interface InfoPanel {
  open: boolean;
  type: 'tile' | 'city' | 'unit' | 'research' | 'policy' | null;
  data: any | null;
}

export default function GamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 게임 설정 파라미터
  const mapType = searchParams.get('map') || 'Continents';
  const difficulty = searchParams.get('difficulty') || 'king';
  const playerCiv = searchParams.get('civ') || 'korea';
  const civCount = Number(searchParams.get('civCount')) || 8;
  const gameMode = searchParams.get('mode') || 'medium';
  
  // 게임 ID 생성
  const gameId = searchParams.get('id') || `new_${Date.now()}`;
  
  // 게임 상태
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('map');
  
  // 지도 관련 상태
  const [mapData, setMapData] = useState<HexTile[]>([]);
  const [selectedTile, setSelectedTile] = useState<HexTile | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  
  // 턴 관련 상태
  const [turn, setTurn] = useState<number>(1);
  const [year, setYear] = useState<number>(-4000);
  const [phase, setPhase] = useState<TurnPhase>('player');
  
  // 로그 및 명령어 관련 상태
  const [log, setLog] = useState<LogEntry[]>([]);
  const [commandInput, setCommandInput] = useState<string>('');
  const [infoPanel, setInfoPanel] = useState<InfoPanel>({ 
    open: false, 
    type: null, 
    data: null 
  });
  
  // 토스트 메시지
  const [toast, setToast] = useState<{
    message: string;
    show: boolean;
    type?: 'info' | 'success' | 'warning' | 'error';
  }>({ message: '', show: false });
  
  // 게임 초기화
  
useEffect(() => {
  const loadGameData = async () => {
    try {
      setIsLoading(true);
      
      // 초기 게임 상태 설정 (로컬에서 처리)
      const initialState = {
        turn: 1,
        year: -4000,
        resources: {
          food: 10,
          production: 5,
          gold: 20,
          science: 3,
          culture: 2,
          faith: 1,
          happiness: 10
        },
        cities: [],
        units: []
      };
      
      setGameState(initialState);
      setTurn(initialState.turn);
      setYear(initialState.year);
      
      // 맵 데이터만 가져오기
      const { hexagons } = await gameService.getMap();
      setMapData(hexagons);
      
      // 초기 로그 메시지
      addLog('system', '게임이 시작되었습니다.', initialState.turn);
      addLog('advisor', `새로운 문명의 지도자님, 환영합니다! 이제 우리는 새로운 문명을 건설하여 역사에 이름을 남길 것입니다.`, initialState.turn);
      
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게임 데이터 로드 실패');
      setIsLoading(false);
      showToast('게임 데이터 로드 실패', 'error');
    }
  };

  loadGameData();
}, [mapType, difficulty, playerCiv, civCount, gameMode]);
  
  // 토스트 메시지 표시
  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, show: true, type });
    setTimeout(() => {
      setToast({ message: '', show: false });
    }, 3000);
  };
  
  // 게임 로그 추가
  const addLog = useCallback((type: LogEntry['type'], content: string, currentTurn: number) => {
    setLog(prev => [...prev, { type, content, turn: currentTurn }]);
  }, []);
  
  // 턴 종료 처리
  const endTurn = useCallback(async () => {
    if (!gameState) return;
    
    try {
      setPhase('resolve');
      addLog('system', `턴 ${turn} 종료! AI 처리 중...`, turn);
      showToast(`턴 ${turn} 종료! AI 처리 중...`, 'info');
      
      // 턴 종료 API 호출
      const { newState, events } = await gameService.endTurn();
      
      // 이벤트 로그에 추가
      events.forEach(event => {
        addLog('event', event, turn);
      });
      
      // 게임 상태 업데이트
      setGameState(newState);
      setTurn(newState.turn);
      setYear(newState.year);
      
      // 맵 데이터 업데이트
      const { hexagons } = await gameService.getMap();
      setMapData(hexagons);
      
      // 턴 시작 메시지
      addLog('system', `턴 ${newState.turn} 시작`, newState.turn);
      showToast(`턴 ${newState.turn} 시작`, 'success');
      
      setPhase('player');
    } catch (err) {
      setError(err instanceof Error ? err.message : '턴 처리 실패');
      showToast('턴 처리 실패', 'error');
      setPhase('player');
    }
  }, [turn, gameState, addLog]);
  
  // 타일 선택 처리
  const handleSelectTile = (tile: HexTile) => {
    setSelectedTile(tile);
    
    // 타일에 있는 유닛 선택
    if (tile.unit && tile.unit.owner === 'player' && !tile.unit.hasActed) {
      setSelectedUnit(tile.unit);
      showToast(`${tile.unit.typeName} 유닛 선택됨`, 'info');
    } else {
      setSelectedUnit(null);
    }
    
    // 타일에 있는 도시 선택
    if (tile.city && tile.city.owner === 'player') {
      setSelectedCity(tile.city);
      showToast(`${tile.city.name} 도시 선택됨`, 'info');
    } else {
      setSelectedCity(null);
    }
    
    // 정보 패널 업데이트
    setInfoPanel({
      open: true,
      type: 'tile',
      data: tile
    });
  };
  
  // 유닛 이동 처리
  const handleUnitMove = (unit: Unit, q: number, r: number) => {
    // 유닛 이동 후 맵 데이터 업데이트
    const updatedMapData = mapData.map(tile => {
      // 원래 위치에서 유닛 제거
      if (tile.q === unit.location.q && tile.r === unit.location.r) {
        return { ...tile, unit: null };
      }
      // 새 위치에 유닛 배치
      if (tile.q === q && tile.r === r) {
        return { ...tile, unit: { ...unit, location: { q, r, s: -q-r } } };
      }
      return tile;
    });
    
    setMapData(updatedMapData);
    
    // 선택 상태 업데이트
    const newLocation = { q, r, s: -q-r };
    const movedUnit = { ...unit, location: newLocation, hasActed: true };
    setSelectedUnit(movedUnit);
    
    // 이동한 타일 찾아서 선택
    const targetTile = mapData.find(tile => tile.q === q && tile.r === r);
    if (targetTile) {
      setSelectedTile({ ...targetTile, unit: movedUnit });
    }
    
    addLog('player', `${unit.typeName} 유닛이 이동했습니다`, turn);
  };
  
  // 유닛 명령 처리
  const handleUnitCommand = async (unit: Unit, command: string) => {
    try {
      const { unit: updatedUnit } = await gameService.commandUnit(unit.id, command);
      
      // 맵 데이터 업데이트
      const { hexagons } = await gameService.getMap();
      setMapData(hexagons);
      
      // 선택 상태 업데이트
      setSelectedUnit(updatedUnit);
      
      // 명령 로그 추가
      addLog('player', `${unit.typeName} 유닛에게 ${command} 명령을 내렸습니다`, turn);
      showToast(`${command} 명령 성공`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '명령 실패', 'error');
    }
  };
  
  // 도시 생산 설정
  const handleCityProduction = async (cityId: number, item: string) => {
    try {
      const { city } = await gameService.setCityProduction(cityId, item);
      
      // 게임 상태 업데이트
      if (gameState) {
        const updatedCities = gameState.cities.map(c => 
          c.id === cityId ? city : c
        );
        setGameState({ ...gameState, cities: updatedCities });
      }
      
      // 선택된 도시 업데이트
      if (selectedCity && selectedCity.id === cityId) {
        setSelectedCity(city);
      }
      
      addLog('player', `${city.name} 도시가 ${item} 생산을 시작했습니다`, turn);
      showToast(`${item} 생산 시작`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '생산 설정 실패', 'error');
    }
  };
  
  // 명령어 입력 처리
  const handleCommand = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commandInput.trim() || !gameState) return;
    
    // 사용자 메시지 로그 추가
    addLog('player', commandInput, turn);
    
    // LLM 처리를 대신해 간단한 명령어 처리 로직
    const command = commandInput.toLowerCase();
    
    if (command.includes('턴') || command.includes('다음')) {
      endTurn();
    } else if (command.includes('도시') && command.includes('정보')) {
      if (gameState.cities.length > 0) {
        addLog('advisor', `현재 당신의 도시는 총 ${gameState.cities.length}개입니다.`, turn);
        gameState.cities.forEach(city => {
          addLog('system', `${city.name} (인구: ${city.population}) - 생산: ${city.production} (${city.turnsLeft}턴)`, turn);
        });
      } else {
        addLog('advisor', `아직 도시가 없습니다. 정착민을 이용해 첫 도시를 건설하세요.`, turn);
      }
    } else if (command.includes('자원')) {
      const res = gameState.resources;
      addLog('advisor', `현재 보유 자원: 식량 ${res.food}, 생산력 ${res.production}, 금 ${res.gold}, 과학 ${res.science}, 문화 ${res.culture}, 신앙 ${res.faith}, 행복도 ${res.happiness}`, turn);
    } else if (command.includes('유닛') && command.includes('목록')) {
      if (gameState.units.length > 0) {
        addLog('advisor', `현재 보유 유닛은 총 ${gameState.units.length}개입니다.`, turn);
        gameState.units.forEach(unit => {
          addLog('system', `${unit.typeName} - 위치: (${unit.location.q}, ${unit.location.r}), 이동력: ${unit.movement}/${unit.maxMovement}`, turn);
        });
      } else {
        addLog('advisor', `보유 중인 유닛이 없습니다.`, turn);
      }
    } else if (command.includes('유닛') && command.includes('이동') && selectedUnit) {
      addLog('advisor', `유닛을 이동하려면 지도에서 목적지를 선택하세요.`, turn);
    } else if (command.includes('도움말') || command.includes('명령어')) {
      addLog('advisor', '가능한 명령어: "다음 턴", "도시 정보", "자원 정보", "유닛 목록", "유닛 이동", "건설 [건물명]", "연구 [기술명]"', turn);
    } else {
      // 명령어 해석 (실제로는 LLM이 처리할 부분)
      setTimeout(() => {
        addLog('advisor', '명령을 처리하는 중입니다...', turn);
        
        // 간단한 응답 예시
        setTimeout(() => {
          const responses = [
            '당신의 명령을 수행하겠습니다.',
            '좋은 전략적 선택입니다.',
            '흥미로운 접근 방식이군요.',
            '그렇게 하겠습니다. 다른 명령이 있으신가요?',
            '알겠습니다. 다음 턴에 결과가 반영될 것입니다.'
          ];
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          addLog('advisor', randomResponse, turn);
        }, 1000);
      }, 500);
    }
    
    setCommandInput('');
  };
  
  // 로딩 중 화면
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">게임 로딩 중...</div>
      </div>
    );
  }
  
  // 에러 화면
  if (error || !gameState) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <div className="text-red-400 text-xl mb-4">{error || '게임 상태를 로드할 수 없습니다'}</div>
        <button 
          onClick={() => router.refresh()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 현재 선택된 탭에 따른 컴포넌트 렌더링
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'map':
        return (
          <HexMap 
            gameId={gameId}
            onTileClick={handleSelectTile}
            selectedTile={selectedTile}
            onUnitMove={handleUnitMove}
          />
        );
      case 'cities':
        return (
          <CityManagementPanel 
            cities={gameState.cities}
            onProductionSelect={handleCityProduction}
          />
        );
      case 'research':
        return <ResearchPanel />;
      case 'units':
        return (
          <UnitPanel 
            units={gameState.units}
            onSelectUnit={setSelectedUnit}
            onUnitCommand={handleUnitCommand}
          />
        );
      case 'diplomacy':
        return <DiplomacyPanel />;
      case 'religion':
        return <ReligionPanel />;
      case 'policy':
        return <PolicyPanel />;
      case 'turn':
        return (
          <TurnManager 
            turn={turn}
            phase={phase}
            onEndTurn={endTurn}
            events={log.filter(entry => entry.type === 'event' && entry.turn === turn)}
          />
        );
      default:
        return <div className="p-4">선택된 탭이 없습니다</div>;
    }
  };

  return (
    <div className="h-[100vh] min-h-screen bg-slate-900 text-white flex flex-col">
      {/* 토스트 메시지 */}
      <Toast 
        message={toast.message} 
        show={toast.show} 
        onClose={() => setToast({ ...toast, show: false })}
      />
      
      {/* 상단 네비게이션 */}
      <nav className="h-[7vh] bg-slate-800 p-2 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center">
          <Menu className="mr-2" size={24} />
          <span className="font-bold text-lg">문명</span>
        </div>
        <div className="flex space-x-6">
          <div className="flex items-center">
            <span className="font-bold">턴: {turn}</span>
          </div>
          <div className="flex items-center">
            <span>{year < 0 ? `BC ${Math.abs(year)}` : `AD ${year}`}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* 자원 표시 */}
          <div className="flex items-center space-x-4 text-base">
            <div className="flex items-center">
              <div className="px-2 py-0.5 bg-green-400 text-white rounded-full mr-2 text-xs">식량</div>
              <span>{gameState.resources.food}</span>
            </div>
            <div className="flex items-center">
              <div className="px-2 py-0.5 bg-red-400 text-white rounded-full mr-2 text-xs">생산력</div>
              <span>{gameState.resources.production}</span>
            </div>
            <div className="flex items-center">
              <div className="px-2 py-0.5 bg-yellow-400 text-white rounded-full mr-2 text-xs">골드</div>
              <span>{gameState.resources.gold}</span>
            </div>
            <div className="flex items-center">
              <div className="px-2 py-0.5 bg-blue-400 text-white rounded-full mr-2 text-xs">과학</div>
              <span>{gameState.resources.science}</span>
            </div>
            <div className="flex items-center">
              <div className="px-2 py-0.5 bg-purple-400 text-white rounded-full mr-2 text-xs">문화</div>
              <span>{gameState.resources.culture}</span>
            </div>
            <div className="flex items-center">
              <div className="px-2 py-0.5 bg-gray-200 text-gray-800 rounded-full mr-2 text-xs">신앙</div>
              <span>{gameState.resources.faith}</span>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="h-[calc(100vh-3rem)] flex-1 flex flex-row">
        {/* 왼쪽 탭 네비게이션 */}
        <div className="w-16 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-4">
          <button
            key="map"
            className={cn(
              "w-12 h-12 mb-4 rounded-lg flex items-center justify-center",
              selectedTab === 'map' ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'
            )}
            onClick={() => setSelectedTab('map')}
          >
            <Map size={24} />
          </button>
          <button
            key="cities"
            className={cn(
              "w-12 h-12 mb-4 rounded-lg flex items-center justify-center",
              selectedTab === 'cities' ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'
            )}
            onClick={() => setSelectedTab('cities')}
          >
            <Book size={24} />
          </button>
          <button
            key="research"
            className={cn(
              "w-12 h-12 mb-4 rounded-lg flex items-center justify-center",
              selectedTab === 'research' ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'
            )}
            onClick={() => setSelectedTab('research')}
          >
            <Beaker size={24} />
          </button>
          <button
            key="units"
            className={cn(
              "w-12 h-12 mb-4 rounded-lg flex items-center justify-center",
              selectedTab === 'units' ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'
            )}
            onClick={() => setSelectedTab('units')}
          >
            <Sword size={24} />
          </button>
          <button
            key="diplomacy"
            className={cn(
              "w-12 h-12 mb-4 rounded-lg flex items-center justify-center",
              selectedTab === 'diplomacy' ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'
            )}
            onClick={() => setSelectedTab('diplomacy')}
          >
            <Users size={24} />
          </button>
          <button
            key="religion"
            className={cn(
              "w-12 h-12 mb-4 rounded-lg flex items-center justify-center",
              selectedTab === 'religion' ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'
            )}
            onClick={() => setSelectedTab('religion')}
          >
            <Award size={24} />
          </button>
          <button
            key="policy"
            className={cn(
              "w-12 h-12 mb-4 rounded-lg flex items-center justify-center",
              selectedTab === 'policy' ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'
            )}
            onClick={() => setSelectedTab('policy')}
          >
            <ChevronUp size={24} />
          </button>
          <button
            key="turn"
            className={cn(
              "w-12 h-12 mb-4 rounded-lg flex items-center justify-center",
              selectedTab === 'turn' ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'
            )}
            onClick={() => setSelectedTab('turn')}
          >
            <ChevronDown size={24} />
          </button>
        </div>
        
        {/* 메인 콘텐츠 영역 */}
        <div className="h-[93vh] flex-1 flex flex-col overflow-hidden">
          <div className="h-[100%] flex-1 overflow-hidden">
            {renderTabContent()}
          </div>
          
          {/* 하단 로그 및 명령 영역 */}
          <div className="h-[25vh] bg-slate-800 border-t border-slate-700 flex">
            {/* 로그 영역 */}
            <div className="flex-1 p-3 overflow-auto flex flex-col-reverse">
              <div className="space-y-3">
                {log.slice().reverse().map((entry: LogEntry, idx: number) => (
                  <div key={idx} className={cn(
                    "p-2 rounded",
                    entry.type === 'system' ? 'bg-slate-700 text-gray-300' :
                    entry.type === 'advisor' ? 'bg-indigo-900' :
                    entry.type === 'event' ? 'bg-amber-900' : 'bg-slate-600'
                  )}>
                    <div className="flex items-start">
                      <div className="text-sm">
                        {entry.type === 'system' && <span className="font-bold text-xs mr-1">[시스템]</span>}
                        {entry.type === 'advisor' && <span className="font-bold text-xs mr-1">[조언자]</span>}
                        {entry.type === 'event' && <span className="font-bold text-xs mr-1">[이벤트]</span>}
                        {entry.type === 'player' && <span className="font-bold text-xs mr-1">[명령]</span>}
                        {entry.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 명령 입력 및 정보 패널 영역 */}
            <div className="w-1/3 border-l border-slate-700 p-3 flex flex-col">
              <div className="flex-1 overflow-auto mb-3">
                {/* 현재 선택된 타일/유닛/도시 정보 */}
                {infoPanel.open && infoPanel.data && (
                  <div className="bg-slate-700 p-3 rounded mb-3">
                    {/* 타일 정보 */}
                    {infoPanel.type === 'tile' && (
                      <>
                        <div className="flex justify-between mb-2">
                          <h4 className="font-bold">타일 정보</h4>
                          <button onClick={() => setInfoPanel({ open: false, type: null, data: null })}>✕</button>
                        </div>
                        <div className="text-sm space-y-1">
                          <p>위치: ({infoPanel.data.q}, {infoPanel.data.r})</p>
                          <p>지형: {infoPanel.data.terrain}</p>
                          {infoPanel.data.resource && <p>자원: {infoPanel.data.resource}</p>}
                          {infoPanel.data.naturalWonder && <p>자연경관: {infoPanel.data.naturalWonder}</p>}
                          {infoPanel.data.city && <p>도시: {infoPanel.data.city.name} (인구: {infoPanel.data.city.population})</p>}
                          {infoPanel.data.unit && <p>유닛: {infoPanel.data.unit.typeName}</p>}
                        </div>
                        
                        {/* 유닛 관련 액션 */}
                        {selectedUnit && (
                          <div className="mt-3 space-x-2">
                            <button 
                              className="bg-blue-600 text-xs px-2 py-1 rounded"
                              onClick={() => handleUnitCommand(selectedUnit, 'fortify')}
                              disabled={selectedUnit.hasActed}
                            >
                              요새화
                            </button>
                            <button 
                              className="bg-green-600 text-xs px-2 py-1 rounded"
                              onClick={() => handleUnitCommand(selectedUnit, 'skip_turn')}
                              disabled={selectedUnit.hasActed}
                            >
                              턴 넘기기
                            </button>
                            {selectedUnit.type === 'settler' && (
                              <button 
                                className="bg-yellow-600 text-xs px-2 py-1 rounded"
                                onClick={() => handleUnitCommand(selectedUnit, 'found_city')}
                                disabled={selectedUnit.hasActed}
                              >
                                도시 건설
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* 명령 입력 */}
              <form onSubmit={handleCommand} className="flex">
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="명령을 입력하세요..."
                  className="flex-1 bg-slate-700 rounded-l p-2 focus:outline-none"
                />
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 px-4 rounded-r flex items-center"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}