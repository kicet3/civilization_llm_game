"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, Settings, Map, Book, 
  Beaker, Users, Sword, ChevronDown, User, Send, 
  Home 
} from 'lucide-react';

// 컴포넌트 임포트
import TurnManager, { TurnPhase } from './TurnManager';
import ResearchPanel from "./research-management/ResearchPanel";
import UnitPanel from "./unit-management/UnitPanel";
import DiplomacyPanel from "./diplomacy-management/DiplomacyPanel";
import HexMap from './map-management/HexMap';
import Toast from './ui/Toast';
import ChatPanel from './components/ChatPanel';
import GameNavigation from './components/GameNavigation';

// 서비스 API 가져오기
import gameService from '@/services/gameService';
import { GameState, HexTile, Unit, City } from '@/types/game';

// 로그 엔트리 타입 정의
interface LogEntry {
  type: 'system' | 'advisor' | 'event' | 'player';
  content: string;
  turn: number;
}

// 정보 패널 타입 정의
interface InfoPanel {
  open: boolean;
  type: 'tile' | 'city' | 'unit' | 'research' | 'policy' | null;
  data: any | null;
}

// 탑 네비게이션 바 컴포넌트 - 메모이제이션
const TopNavigationBar = React.memo(({ turn, year, resources, onToggleChat }: { 
  turn: number, 
  year: number, 
  resources: GameState['resources'],
  onToggleChat: () => void
}) => {
  return (
    <nav className="h-[7vh] bg-slate-800 p-2 flex items-center justify-between border-b border-slate-700 overflow-hidden">
      <div className="fixed left-5 flex items-center">
        <span className="font-bold text-lg">문명</span>
      </div>
      <div className="flex space-x-6 max-w-[70vw] overflow-hidden">
        <div className="flex items-center">
          <span className="font-bold">턴: {turn}</span>
        </div>
        <div className="flex items-center">
          <span>{year < 0 ? `BC ${Math.abs(year)}` : `AD ${year}`}</span>
        </div>
      </div>
      <div className="fixed flex items-center space-x-4 right-4">
        {/* 자원 표시 */}
        <div className="flex items-center space-x-4 text-base overflow-x-auto">
          <div className="flex items-center">
            <div className="px-2 py-0.5 bg-green-400 text-white rounded-full mr-2 text-xs">식량</div>
            <span>{resources.food}</span>
          </div>
          <div className="flex items-center">
            <div className="px-2 py-0.5 bg-red-400 text-white rounded-full mr-2 text-xs">생산력</div>
            <span>{resources.production}</span>
          </div>
          <div className="flex items-center">
            <div className="px-2 py-0.5 bg-yellow-400 text-white rounded-full mr-2 text-xs">골드</div>
            <span>{resources.gold}</span>
          </div>
          <div className="flex items-center">
            <div className="px-2 py-0.5 bg-blue-400 text-white rounded-full mr-2 text-xs">과학</div>
            <span>{resources.science}</span>
          </div>
          <div className="flex items-center">
            <div className="px-2 py-0.5 bg-purple-400 text-white rounded-full mr-2 text-xs">문화</div>
            <span>{resources.culture}</span>
          </div>
        </div>
        
        {/* 채팅 버튼 추가 */}
        <button 
          onClick={onToggleChat}
          className="ml-2 p-2 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center"
          title="게임 어드바이저와 채팅"
        >
          <MessageSquare size={18} />
        </button>
      </div>
    </nav>
  );
});
TopNavigationBar.displayName = 'TopNavigationBar';

// 게임 로그 컴포넌트 - 메모이제이션
const GameLog = React.memo(({ 
  log, 
  commandInput, 
  setCommandInput, 
  handleCommand 
}: { 
  log: LogEntry[], 
  commandInput: string, 
  setCommandInput: (value: string) => void, 
  handleCommand: (e: React.FormEvent<HTMLFormElement>) => void 
}) => {
  // 로그가 추가될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    const logContainer = document.getElementById('logContainer');
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }, [log]);

  return (
    <div className="h-[25vh] bg-slate-800 border-t border-slate-700 flex">
      {/* 로그 영역 */}
      <div className="flex-1 p-3 overflow-auto" id="logContainer">
        <div className="space-y-3">
          {log.map((entry: LogEntry, idx: number) => (
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
          {/* 정보 패널 영역 - 필요한 경우 추가 */}
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
  );
});
GameLog.displayName = 'GameLog';

// 메인 게임 페이지 컴포넌트
export default function GamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 게임 설정 파라미터
  const mapType = searchParams.get('map') || 'Continents';
  const difficulty = searchParams.get('difficulty') || 'king';
  const playerCiv = searchParams.get('civ') || 'korea';
  const civCount = Number(searchParams.get('civCount')) || 8;
  const gameMode = searchParams.get('mode') || 'medium';
  const playerName = searchParams.get('playerName') || '지도자';
  
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
  const [selectedCity, setSelectedCity] = useState<HexTile['city'] | null>(null);
  
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
  
  // 토스트 메시지 상태
  const [toast, setToast] = useState<{
    message: string;
    show: boolean;
    type?: 'info' | 'success' | 'warning' | 'error';
  }>({ message: '', show: false });
  
  // 채팅 패널 상태
  const [chatPanelOpen, setChatPanelOpen] = useState<boolean>(false);
  
  // 게임 초기화
  useEffect(() => {
    loadGameData();
  }, [gameId]);
  
  // 게임 데이터 로드 함수
  const loadGameData = async () => {
    if (!gameId) return;
    
    try {
      setIsLoading(true);
      console.log("게임 데이터 로딩 중...");
      
      // 리서치 데이터 불러오기
      await loadResearchData();
      
      // 맵 데이터 불러오기
      const mapResult = await gameService.getMap();
      console.log("맵 데이터 로드 완료:", mapResult);
      setMapData(mapResult);
      
      // 게임의 현재 턴과 상태 불러오기
      const gameState = await gameService.getGameState();
      if (gameState) {
        console.log("게임 상태 로드 완료:", gameState);
        setTurn(gameState.turn);
        setYear(gameState.year);
        
        // 다른 게임 상태 변수 설정
        setGameState(gameState);
        if (gameState.cities && gameState.cities.length > 0) {
          setSelectedCity(gameState.cities[0]);
        }
        
        // 초기 로그 메시지 추가
        addLog('system', '게임이 시작되었습니다.', gameState.turn);
        addLog('advisor', `${playerName}님, 환영합니다. 이제 문명을 이끌어주세요.`, gameState.turn);
      }
      
      console.log("모든 게임 데이터 로딩 완료!");
    } catch (error) {
      console.error("게임 데이터 로딩 오류:", error);
      setError(error instanceof Error ? error.message : '게임 데이터를 로드하는 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 리서치 데이터 로드 함수
  const loadResearchData = async () => {
    try {
      console.log("리서치 데이터 로딩 중...");
      // 여기서는 연구 데이터 로드 로직을 실제 API에 맞게 구현
    } catch (error) {
      console.error("리서치 데이터 로딩 오류:", error);
    }
  };

  // 게임 데이터 수동 업데이트 함수 - 메모이제이션으로 성능 최적화
  const updateGameData = useCallback(async () => {
    if (!gameId) return;
    
    try {
      console.log("게임 데이터 수동 업데이트 중...");
      
      // 맵 데이터 업데이트
      const mapResult = await gameService.getMap();
      console.log("맵 데이터 업데이트 완료");
      setMapData(mapResult);
      
      // 게임 상태 업데이트
      const gameState = await gameService.getGameState();
      if (gameState) {
        console.log("게임 상태 업데이트 완료");
        setTurn(gameState.turn);
        setYear(gameState.year);
        setGameState(gameState);
        if (gameState.cities && gameState.cities.length > 0) {
          setSelectedCity(gameState.cities[0]);
        }
      }
      
      // 리서치 데이터 업데이트
      await loadResearchData();
      
      console.log("모든 게임 데이터 업데이트 완료!");
    } catch (error) {
      console.error("게임 데이터 업데이트 오류:", error);
      setError(error instanceof Error ? error.message : '게임 데이터를 업데이트하는 중 오류가 발생했습니다');
      throw error;
    }
  }, [gameId]);

  // 턴 종료 처리 - 메모이제이션으로 성능 최적화
  const endTurn = useCallback(async () => {
    try {
      console.log("턴 종료 중...");
      setIsLoading(true);
      
      // 서버에 턴 종료 요청
      const result = await gameService.endTurn();
      console.log("턴 종료 결과:", result);
      
      if (result && result.newState) {
        // 새 턴 정보 업데이트
        await updateGameData();
        
        showToast(`턴 ${turn}이 종료되었습니다. 새로운 턴이 시작됩니다!`, 'success');
      } else {
        console.error("턴 종료 실패");
        setError('턴 종료 요청이 실패했습니다.');
      }
    } catch (error) {
      console.error("턴 종료 오류:", error);
      setError(error instanceof Error ? error.message : '턴을 종료하는 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [turn, updateGameData]);
  
  // 토스트 메시지 표시 - 메모이제이션으로 성능 최적화
  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, show: true, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  }, []);
  
  // 게임 로그 추가 - 메모이제이션으로 성능 최적화
  const addLog = useCallback((type: LogEntry['type'], content: string, currentTurn: number) => {
    setLog(prev => [...prev, { type, content, turn: currentTurn }]);
  }, []);
  
  // 타일 선택 처리 - 메모이제이션으로 성능 최적화
  const handleSelectTile = useCallback((tile: HexTile) => {
    try {
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
    } catch (err) {
      console.error('타일 선택 중 오류:', err);
      showToast('타일 선택 중 오류 발생', 'error');
    }
  }, [showToast]);
  
  // 유닛 이동 처리 - 메모이제이션으로 성능 최적화
  const handleUnitMove = useCallback((unit: Unit, q: number, r: number) => {
    if (!mapData || !Array.isArray(mapData) || mapData.length === 0) {
      console.error('맵 데이터가 없거나 유효하지 않습니다');
      showToast('맵 데이터 오류로 이동할 수 없습니다', 'error');
      return;
    }
    
    try {
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
    } catch (err) {
      console.error('유닛 이동 중 오류:', err);
      showToast('유닛 이동 중 오류 발생', 'error');
    }
  }, [mapData, turn, addLog, showToast]);
  
  // 유닛 명령 처리 - 메모이제이션으로 성능 최적화
  const handleUnitCommand = useCallback(async (unit: Unit, command: string) => {
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
  }, [turn, addLog, showToast]);
  
  // 명령어 입력 처리 - 메모이제이션으로 성능 최적화
  const handleCommand = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commandInput.trim() || !gameState) return;
    
    // 사용자 메시지 로그 추가
    addLog('player', commandInput, turn);
    
    try {
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
        addLog('advisor', `현재 보유 자원: 식량 ${res.food}, 생산력 ${res.production}, 금 ${res.gold}, 과학 ${res.science}, 문화 ${res.culture}, 행복도 ${res.happiness}`, turn);
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
      } else if (command.includes('채팅') || command.includes('대화')) {
        // 채팅 패널 열기
        setChatPanelOpen(true);
        addLog('advisor', '채팅 패널을 열었습니다. 여기서 어드바이저와 직접 대화할 수 있습니다.', turn);
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
    } catch (error) {
      console.error('명령 처리 중 오류:', error);
      addLog('system', '명령을 처리하는 도중 오류가 발생했습니다.', turn);
    }
    
    setCommandInput('');
  }, [commandInput, gameState, turn, addLog, endTurn, selectedUnit]);

  // 탭 선택 핸들러 - 메모이제이션으로 성능 최적화
  const handleSelectTab = useCallback((tab: string) => {
    setSelectedTab(tab);
    
    // 채팅 탭인 경우 채팅 페이지로 이동
    if (tab === 'chat') {
      router.push(`/game/chat?gameId=${gameId}&playerId=${gameState?.playerId || '1'}`);
    }
  }, [gameId, gameState?.playerId, router]);
  
  // 채팅 패널 토글
  const toggleChatPanel = useCallback(() => {
    setChatPanelOpen(prev => !prev);
  }, []);
  
  // 메모이제이션된 탭 컨텐츠 렌더링
  const tabContent = useMemo(() => {
    try {
      switch (selectedTab) {
        case 'map':
          return (
            <HexMap 
              gameId={gameId}
              onTileClick={handleSelectTile}
              selectedTile={selectedTile}
            />
          );
        case 'research':
          return <ResearchPanel updateGameData={updateGameData} />;
        case 'units':
          return <UnitPanel />;
        case 'diplomacy':
          return (
            <DiplomacyPanel 
              mapData={Array.isArray(mapData) ? mapData : []} 
              playerCivId={playerCiv}
            />
          );
        case 'turn':
          return (
            <TurnManager 
              turn={turn}
              phase={phase}
              onEndTurn={endTurn}
              updateGameData={updateGameData}
              events={log.filter(entry => entry.type === 'event' && entry.turn === turn)}
            />
          );
        default:
          return <div className="p-4">선택된 탭이 없습니다</div>;
      }
    } catch (err) {
      console.error('탭 렌더링 중 오류:', err);
      return (
        <div className="p-4 text-red-400">
          탭 콘텐츠를 로드하는 중 오류가 발생했습니다. 다른 탭을 선택해보세요.
        </div>
      );
    }
  }, [selectedTab, gameId, mapData, handleSelectTile, selectedTile, updateGameData, turn, phase, endTurn, log, playerCiv]);

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

  return (
    <div className="h-[100vh] min-h-screen bg-slate-900 text-white flex flex-col">
      {/* 토스트 메시지 */}
      <Toast 
        message={toast.message} 
        show={toast.show} 
        onClose={() => setToast({ ...toast, show: false })}
      />
      
      {/* 상단 네비게이션 */}
      <TopNavigationBar 
        turn={turn} 
        year={year} 
        resources={gameState.resources} 
        onToggleChat={toggleChatPanel}
      />
      
      <div className="h-[calc(100vh-3rem)] flex-1 flex flex-row">
        {/* 탭 네비게이션 */}
        <GameNavigation
          gameId={gameId}
          playerId={gameState.playerId || '1'}
          selectedTab={selectedTab}
          onSelectTab={handleSelectTab}
          onToggleChat={toggleChatPanel}
        />
        
        {/* 메인 콘텐츠 영역 */}
        <div className="h-[93vh] flex-1 flex flex-col overflow-hidden">
          <div className="h-[100%] flex-1 overflow-hidden">
            {tabContent}
          </div>
          
          {/* 하단 로그 및 명령 영역 */}
          <GameLog
            log={log}
            commandInput={commandInput}
            setCommandInput={setCommandInput}
            handleCommand={handleCommand}
          />
        </div>
      </div>
      
      {/* 채팅 패널 */}
      <ChatPanel
        gameId={gameId}
        playerId={gameState.playerId || '1'}
        isOpen={chatPanelOpen}
        onClose={toggleChatPanel}
      />
    </div>
  );
}