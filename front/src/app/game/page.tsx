"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HexGrid, Layout, Hexagon, Text, GridGenerator } from 'react-hexgrid';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Menu, MessageSquare, Settings, Map, Book, 
  Beaker, Users, Sword, Award, ChevronUp, 
  ChevronDown, User, PanelLeft, Send, 
  ZoomIn, ZoomOut, Move, Home 
} from 'lucide-react';
import {  
  Mountain, Trees, Waves, Globe, Sun, Leaf, 
  Tent, Compass, Anchor 
} from 'lucide-react';
// 타입 정의
interface Hexagon {
  q: number;
  r: number;
  s: number;
  terrain: string;
  resource?: string | null;
  city?: { name: string; population: number } | null;
  unit?: string | null;
}

interface Resource {
  food: number;
  production: number;
  gold: number;
  science: number;
  culture: number;
  faith: number;
}

interface City {
  id: number;
  name: string;
  population: number;
  production: string;
  turnsLeft: number;
}

interface LogEntry {
  type: 'system' | 'advisor' | 'event' | 'player';
  content: string;
  turn: number;
}

interface InfoPanel {
  open: boolean;
  type: 'tile' | null;
  data: Hexagon | null;
}

// ResourceBar: Top resource display
function ResourceBar({ resources }: { resources: Resource }) {
  const icons = [
    { color: 'bg-yellow-400', value: resources.food },
    { color: 'bg-red-500', value: resources.production },
    { color: 'bg-yellow-600', value: resources.gold },
    { color: 'bg-blue-500', value: resources.science },
    { color: 'bg-purple-500', value: resources.culture },
    { color: 'bg-white', value: resources.faith },
  ];
  return (
    <div className="bg-slate-800 p-1 flex justify-center space-x-6 text-sm border-b border-slate-700">
      {icons.map((icon, idx) => (
        <div key={idx} className="flex items-center">
          <div className={`w-4 h-4 ${icon.color} rounded-full mr-1`}></div>
          <span>{icon.value}</span>
        </div>
      ))}
    </div>
  );
}




// TabNavigation: Left tab bar
function TabNavigation({ selectedTab, setSelectedTab }: { selectedTab: string, setSelectedTab: (tab: string) => void }) {
  const tabs = [
    { key: 'map', icon: <Map size={24} /> },
    { key: 'cities', icon: <Book size={24} /> },
    { key: 'research', icon: <Beaker size={24} /> },
    { key: 'units', icon: <Sword size={24} /> },
  ];
  return (
    <div className="w-16 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-4">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={cn(
            "w-12 h-12 mb-4 rounded-lg flex items-center justify-center",
            selectedTab === tab.key ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'
          )}
          onClick={() => setSelectedTab(tab.key)}
        >
          {tab.icon}
        </button>
      ))}
    </div>
  );
}

// MapPanel: Hex grid map
function MapPanel({ hexagons, getHexColor, handleHexClick, selectedHex }: {
  hexagons: Hexagon[], 
  getHexColor: (terrain: string) => string, 
  handleHexClick: (hex: Hexagon) => void, 
  selectedHex: Hexagon | null
}) {
  // 뷰박스 오프셋 상태 추가
  const [viewBoxOffset, setViewBoxOffset] = useState({ x: -50, y: -50 });

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setViewBoxOffset((prev) => {
        const step = 5; // 움직이는 거리
        switch (e.key) {
          case "ArrowUp": return { ...prev, y: prev.y - step };
          case "ArrowDown": return { ...prev, y: prev.y + step };
          case "ArrowLeft": return { ...prev, x: prev.x - step };
          case "ArrowRight": return { ...prev, x: prev.x + step };
          default: return prev;
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 육각형 데이터가 없을 경우 처리
  if (!hexagons || hexagons.length === 0) {
    return <div className="text-red-500 p-4">지도 데이터를 로드할 수 없습니다.</div>;
  }

  // 지형에 따른 아이콘 매핑
  const getTerrainIcon = (terrain: string) => {
    switch (terrain) {
      case 'mountain': return Mountain;
      case 'forest': return Trees;
      case 'ocean': return Waves;
      case 'plains': return Globe;
      case 'desert': return Sun;
      case 'grassland': return Leaf;
      case 'hills': return Tent;
      default: return Compass;
    }
  };

  return (
    <div className="w-full h-full">
      <HexGrid 
        width="100%" 
        height="100%" 
        viewBox={`${viewBoxOffset.x} ${viewBoxOffset.y} 100 100`}
      >
        <Layout 
          size={{ x: 4, y: 4 }}  // 크기 축소 
          flat 
          spacing={1.05}  // 간격 조정
          origin={{ x: 0, y: 0 }}
        >
          {hexagons.map((hex, idx) => {
            const TerrainIcon = getTerrainIcon(hex.terrain);
            return (
              <Hexagon
                key={idx}
                q={hex.q}
                r={hex.r}
                s={hex.s}
                fill={getHexColor(hex.terrain)}
                onClick={() => handleHexClick(hex)}
                className={cn(
                  "cursor-pointer hover:opacity-80",
                  selectedHex === hex ? "stroke-2 stroke-white" : ""
                )}
              >
                <foreignObject x="-2.5" y="-2.5" width="5" height="5">
                  <div className="flex items-center justify-center w-full h-full">
                    <TerrainIcon 
                      size={16} 
                      color="white" 
                      strokeWidth={1.5}
                    />
                    {hex.resource && (
                      <span className="absolute bottom-0 right-0 text-[0.5rem] text-white">
                        {hex.resource.slice(0,2)}
                      </span>
                    )}
                    {hex.city && (
                      <span className="absolute top-0 left-0 text-[0.5rem] text-white">
                        도
                      </span>
                    )}
                  </div>
                </foreignObject>
              </Hexagon>
            );
          })}
        </Layout>
      </HexGrid>
    </div>
  );
}

// CityList: Cities tab
function CityList({ cities }: { cities: City[] }) {
  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-xl font-bold mb-4">도시 관리</h3>
      <div className="space-y-4">
        {cities.map(city => (
          <div key={city.id} className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-bold">{city.name}</h4>
              <span className="text-sm px-2 py-1 bg-blue-900 rounded-full">인구: {city.population}</span>
            </div>
            <div className="text-gray-300 text-sm mb-3">
              <p>생산: {city.production} ({city.turnsLeft}턴 남음)</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-700 p-2 rounded"><p>식량: +5/턴</p></div>
              <div className="bg-gray-700 p-2 rounded"><p>생산력: +4/턴</p></div>
              <div className="bg-gray-700 p-2 rounded"><p>금: +3/턴</p></div>
              <div className="bg-gray-700 p-2 rounded"><p>과학: +2/턴</p></div>
              <div className="bg-gray-700 p-2 rounded"><p>문화: +1/턴</p></div>
              <div className="bg-gray-700 p-2 rounded"><p>신앙: +1/턴</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ResearchPanel: Research tab
function ResearchPanel() {
  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-xl font-bold mb-4">연구</h3>
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <h4 className="text-lg font-bold mb-2">현재 연구: 농업</h4>
        <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-full" style={{ width: '60%' }}></div>
        </div>
        <p className="text-right text-sm mt-1">2턴 남음</p>
      </div>
      <div className="space-y-3">
        <h4 className="font-bold">다음 가능한 연구:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded p-3 cursor-pointer hover:bg-gray-700"><h5 className="font-bold">도자기</h5><p className="text-xs text-gray-400">4턴 소요</p></div>
          <div className="bg-gray-800 rounded p-3 cursor-pointer hover:bg-gray-700"><h5 className="font-bold">동물 사육</h5><p className="text-xs text-gray-400">4턴 소요</p></div>
          <div className="bg-gray-800 rounded p-3 cursor-pointer hover:bg-gray-700"><h5 className="font-bold">채광</h5><p className="text-xs text-gray-400">5턴 소요</p></div>
          <div className="bg-gray-800 rounded p-3 cursor-pointer hover:bg-gray-700"><h5 className="font-bold">범선</h5><p className="text-xs text-gray-400">6턴 소요</p></div>
        </div>
      </div>
    </div>
  );
}

// UnitsPanel: Units tab
function UnitsPanel() {
  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-xl font-bold mb-4">유닛</h3>
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-bold">정착민</h4>
            <span className="text-sm px-2 py-1 bg-blue-900 rounded-full">민간 유닛</span>
          </div>
          <div className="text-gray-300 text-sm mb-3">
            <p>위치: 수도 인근</p>
            <p>이동력: 2/2</p>
          </div>
          <div className="flex space-x-2">
            <button className="bg-blue-600 px-3 py-1 rounded text-sm">이동</button>
            <button className="bg-green-600 px-3 py-1 rounded text-sm">도시 건설</button>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-bold">전사</h4>
            <span className="text-sm px-2 py-1 bg-red-900 rounded-full">군사 유닛</span>
          </div>
          <div className="text-gray-300 text-sm mb-3">
            <p>위치: 수도</p>
            <p>이동력: 2/2</p>
            <p>체력: 20/20</p>
          </div>
          <div className="flex space-x-2">
            <button className="bg-blue-600 px-3 py-1 rounded text-sm">이동</button>
            <button className="bg-red-600 px-3 py-1 rounded text-sm">경계</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// InfoPanel: Tile/city/unit info
function InfoPanelComponent({ infoPanel, setInfoPanel }: { infoPanel: InfoPanel, setInfoPanel: any }) {
  if (!infoPanel.open || !infoPanel.data) return null;
  return (
    <div className="bg-slate-700 p-3 rounded">
      <div className="flex justify-between mb-2">
        <h4 className="font-bold">타일 정보</h4>
        <button onClick={() => setInfoPanel({ open: false, type: null, data: null })}>✕</button>
      </div>
      <div className="text-sm space-y-1">
        <p>위치: ({infoPanel.data.q}, {infoPanel.data.r})</p>
        <p>지형: {infoPanel.data.terrain}</p>
        {infoPanel.data.resource && <p>자원: {infoPanel.data.resource}</p>}
        {infoPanel.data.city && <p>도시: {infoPanel.data.city.name} (인구: {infoPanel.data.city.population})</p>}
        {infoPanel.data.unit && <p>유닛: {infoPanel.data.unit}</p>}
      </div>
      {infoPanel.data.unit && (
        <div className="mt-3 space-x-2">
          <button className="bg-blue-600 text-xs px-2 py-1 rounded">이동</button>
          {infoPanel.data.unit === 'settler' && (
            <button className="bg-green-600 text-xs px-2 py-1 rounded">도시 건설</button>
          )}
        </div>
      )}
    </div>
  );
}

// LogPanel: Game log and command input
function LogPanel({ log, infoPanel, setInfoPanel, commandInput, setCommandInput, handleCommand }: any) {
  return (
    <div className="h-full bg-slate-800 border-t border-slate-700 flex">
      {/* 로그 영역 */}
      <div className="flex-1 p-3 flex flex-col-reverse h-full">
        <div className="space-y-3 h-full max-h-[40vh] overflow-y-auto flex flex-col-reverse">
          {log.slice().reverse().map((entry: LogEntry, idx: number) => (
            <div key={idx} className={cn(
              "p-2 rounded",
              entry.type === 'system' ? 'bg-slate-700 text-gray-300' :
              entry.type === 'advisor' ? 'bg-indigo-900' :
              entry.type === 'event' ? 'bg-amber-900' : 'bg-slate-600'
            )}>
              <div className="flex items-start">
                <div className="text-sm">
                  {entry.type === 'system' && '시스템: '}
                  {entry.type === 'advisor' && '조언자: '}
                  {entry.type === 'event' && '이벤트: '}
                  {entry.type === 'player' && '명령: '}
                  {entry.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* 명령 입력 영역 */}
      <div className="w-1/3 border-l border-slate-700 p-3 flex flex-col">
        <div className="flex-1 overflow-auto mb-3">
          <InfoPanelComponent infoPanel={infoPanel} setInfoPanel={setInfoPanel} />
        </div>
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
}

export default function GamePage() {
  const router = useRouter();
  
  // 상태 관리
  const [turn, setTurn] = useState<number>(1);
  const [year, setYear] = useState<number>(-4000);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<string>('map');
  const [selectedHex, setSelectedHex] = useState<Hexagon | null>(null);
  const [resources, setResources] = useState<Resource>({
    food: 12,
    production: 8,
    gold: 50,
    science: 3,
    culture: 2,
    faith: 1
  });
  const [cities, setCities] = useState<City[]>([
    { id: 1, name: '수도', population: 3, production: '정착민', turnsLeft: 2 }
  ]);
  const [log, setLog] = useState<LogEntry[]>([
    { type: 'system', content: '게임이 시작되었습니다.', turn: 1 },
    { type: 'advisor', content: '새로운 문명의 지도자님, 환영합니다! 이제 우리는 새로운 문명을 건설하여 역사에 이름을 남길 것입니다.', turn: 1 },
    { type: 'advisor', content: '우선 정착민을 생산하여 새로운 도시를 건설하는 것이 좋을 것 같습니다.', turn: 1 }
  ]);
  const [commandInput, setCommandInput] = useState<string>('');
  const [infoPanel, setInfoPanel] = useState<InfoPanel>({ 
    open: false, 
    type: null, 
    data: null 
  });
  const [isHexGridLoaded, setIsHexGridLoaded] = useState(false);
  const [hexGridError, setHexGridError] = useState<Error | null>(null);
  const addLog = useCallback((type: LogEntry['type'], content: string, turn: number) => {
    setLog(prev => [...prev, { type, content, turn }]);
  }, []);
  // 초기 로딩 및 라이브러리 로드 확인
  useEffect(() => {
    // 초기 데이터 로딩 시뮬레이션
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // HexGrid 라이브러리 로드 확인
    if (typeof window !== 'undefined') {
      setIsHexGridLoaded(true);
    }

    return () => {
      clearTimeout(loadTimer);
    };
  }, []);

  // 맵 설정
  const mapSize = useMemo(() => ({ width: 15, height: 12 }), []);
  
  // 성능 최적화된 hexagons 생성 로직
  const hexagons = useMemo(() => {
    // 더 큰 육각형 그리드 생성 (대략 300개 근접)
    const generatedHexagons = GridGenerator.hexagon(12);
    
    return generatedHexagons.map(hex => ({
      ...hex,
      terrain: ['grassland', 'plains', 'desert', 'mountain', 'ocean', 'forest', 'hills'][
        Math.floor(Math.random() * 7)
      ],
      resource: Math.random() < 0.1 
        ? ['iron', 'horses', 'wheat', 'cattle', 'deer', 'gold'][
            Math.floor(Math.random() * 6)
          ]
        : null,
      city: Math.random() < 0.05 ? { name: '도시', population: 3 } : null,
      unit: Math.random() < 0.05 ? 'settler' : null
    }));
  }, []);
  
  const getHexColor = useCallback((terrain: string) => {
    switch (terrain) {
      case 'grassland': return '#2ecc71';  // 밝은 녹색
      case 'plains': return '#f1c40f';     // 노란색
      case 'desert': return '#f39c12';     // 주황색
      case 'mountain': return '#7f8c8d';   // 회색
      case 'ocean': return '#3498db';      // 파란색
      case 'forest': return '#27ae60';     // 진한 녹색
      case 'hills': return '#2ecc71';      // 밝은 녹색
      default: return '#34495e';           // 어두운 회색
    }
  }, []);

  // 육각형 클릭 핸들러
  const handleHexClick = useCallback((hex: Hexagon) => {
    setSelectedHex(hex);
    setInfoPanel({ 
      open: true, 
      type: 'tile', 
      data: hex 
    });
  }, []);

  // 턴 진행
  const nextTurn = useCallback(() => {
    const newTurn = turn + 1;
    setTurn(newTurn);
    
    // 연도 진행 (고대: 턴당 40년, 후반부로 갈수록 감소)
    const newYear = year + (year < 0 ? 40 : 20);
    setYear(newYear);
    
    // 새 로그 추가
    addLog('system', `턴 ${newTurn}이 시작되었습니다.`, newTurn);
    
    // 랜덤 이벤트 (20% 확률)
    if (Math.random() < 0.2) {
      const events = [
        '야만인 캠프가 발견되었습니다.',
        '당신의 탐험대가 자연경이를 발견했습니다!',
        '시민들이 당신의 통치를 칭송합니다.',
        '폭풍이 몰아치며 일부 타일의 생산량이 감소했습니다.',
        '인근 도시국가가 사절을 보냈습니다.'
      ];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      addLog('event', randomEvent, newTurn);
    }
    
    // 자원 업데이트 (간단한 증가)
    setResources(prev => ({
      food: prev.food + 5,
      production: prev.production + 4,
      gold: prev.gold + 6,
      science: prev.science + 2,
      culture: prev.culture + 1,
      faith: prev.faith + 1
    }));
  }, [turn, year, addLog]);

  // 게임 로그 추가
  

  // 명령어 처리
  const handleCommand = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    
    // 사용자 메시지 로그 추가
    addLog('player', commandInput, turn);
    
    // 간단한 명령어 처리 로직
    const command = commandInput.toLowerCase();
    
    if (command.includes('턴') || command.includes('다음')) {
      nextTurn();
      addLog('system', '다음 턴으로 진행합니다.', turn);
    } else if (command.includes('도시') && command.includes('정보')) {
      addLog('advisor', '현재 당신의 도시는 총 1개입니다. 수도(인구: 3)는 현재 정착민을 2턴 남겨두고 생산 중입니다.', turn);
    } else if (command.includes('자원')) {
      addLog('advisor', `현재 보유 자원: 식량 ${resources.food}, 생산력 ${resources.production}, 금 ${resources.gold}, 과학 ${resources.science}, 문화 ${resources.culture}, 신앙 ${resources.faith}`, turn);
    } else if (command.includes('도움말') || command.includes('명령어')) {
      addLog('advisor', '가능한 명령어: "다음 턴", "도시 정보", "자원 정보", "유닛 이동", "건설 [건물명]", "연구 [기술명]"', turn);
    } else {
      // LLM 응답 시뮬레이션
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
      }, 500);
    }
    
    setCommandInput('');
  }, [commandInput, turn, resources, addLog, nextTurn]);

  // 로딩 중 화면
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">게임 로딩 중...</div>
      </div>
    );
  }

  // 탭 컨텐츠 렌더링 (modularized)
  let tabContent;
  if (selectedTab === 'map') {
    tabContent = <MapPanel hexGridError={hexGridError} isHexGridLoaded={isHexGridLoaded} hexagons={hexagons} getHexColor={getHexColor} handleHexClick={handleHexClick} selectedHex={selectedHex} />;
  } else if (selectedTab === 'cities') {
    tabContent = <CityList cities={cities} />;
  } else if (selectedTab === 'research') {
    tabContent = <ResearchPanel />;
  } else if (selectedTab === 'units') {
    tabContent = <UnitsPanel />;
  } else {
    tabContent = <div>선택된 탭이 없습니다</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* 상단 네비게이션 */}
      <nav className="bg-slate-800 p-2 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center">
          <Menu className="mr-2" size={24} />
          <span className="font-bold text-lg">텍스트 문명</span>
        </div>
        <div className="flex space-x-6">
          <div className="flex items-center">
            <span className="font-bold">턴: {turn}</span>
          </div>
          <div className="flex items-center">
            <span>{year < 0 ? `BC ${Math.abs(year)}` : `AD ${year}`}</span>
          </div>
          <button 
            onClick={nextTurn}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-1 rounded font-bold"
          >
            다음 턴
          </button>
        </div>
        <div className="flex items-center">
          <Settings className="ml-2" size={20} />
        </div>
      </nav>
      
      {/* 주요 자원 표시 */}
      <ResourceBar resources={resources} />
      
      {/* 메인 콘텐츠 영역 - 고정된 높이로 분할 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 탭 네비게이션 */}
        <TabNavigation selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
        
        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 상단 콘텐츠 영역 (고정된 높이) */}
          <div className="flex-1 overflow-auto">
            {tabContent}
          </div>
          
          {/* 로그 패널 (고정된 높이) */}
          <div className="h-[20vh] min-h-[180px] max-h-[300px]">
            <LogPanel 
              log={log} 
              infoPanel={infoPanel} 
              setInfoPanel={setInfoPanel} 
              commandInput={commandInput} 
              setCommandInput={setCommandInput} 
              handleCommand={handleCommand}
            />
          </div>
        </div>
      </div>
    </div>
  );
}