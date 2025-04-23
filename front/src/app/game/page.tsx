"use client";

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Menu, MessageSquare, Settings, Map, Book, Beaker, Users, Sword, Award, ChevronUp, ChevronDown, User, PanelLeft, Send, ZoomIn, ZoomOut, Move, Home } from 'lucide-react';
import './hex-map.css'; 

export default function GamePage() {
  const [turn, setTurn] = useState(1);
  const [year, setYear] = useState(-4000);
  const [mapSize] = useState({ width: 15, height: 12 }); // 육각형 타일에 맞게 크기 조정
  const [mapTiles, setMapTiles] = useState([]);
  const [selectedTab, setSelectedTab] = useState('map');
  const [selectedTile, setSelectedTile] = useState(null);
  const [resources, setResources] = useState({
    food: 12,
    production: 8,
    gold: 50,
    science: 3,
    culture: 2,
    faith: 1
  });
  const [cities, setCities] = useState([
    { id: 1, name: '수도', population: 3, production: '정착민', turnsLeft: 2 }
  ]);
  const [log, setLog] = useState([
    { type: 'system', content: '게임이 시작되었습니다.', turn: 1 },
    { type: 'advisor', content: '새로운 문명의 지도자님, 환영합니다! 이제 우리는 새로운 문명을 건설하여 역사에 이름을 남길 것입니다.', turn: 1 },
    { type: 'advisor', content: '우선 정착민을 생산하여 새로운 도시를 건설하는 것이 좋을 것 같습니다.', turn: 1 }
  ]);
  const [commandInput, setCommandInput] = useState('');
  const [infoPanel, setInfoPanel] = useState({ open: false, type: null, data: null });
  
  // 지도 관련 상태
  const [mapTransform, setMapTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef(null);

  // 맵 생성
  useEffect(() => {
    generateHexMap();
  }, []);

  // 육각형 타일 맵 생성 함수
  const generateHexMap = () => {
    const terrainTypes = ['grassland', 'plains', 'desert', 'tundra', 'mountain', 'ocean', 'forest', 'hills', 'jungle'];
    const newMapTiles = [];
    
    // 육각형 타일의 중심점 위치를 계산하기 위한 상수
    const hexHeight = 80; // 육각형 높이
    const hexWidth = Math.sqrt(3)/2 * hexHeight; // 육각형 너비
    
    for (let y = 0; y < mapSize.height; y++) {
      for (let x = 0; x < mapSize.width; x++) {
        // 가장자리는 물로 설정
        let terrain = 'grassland';
        if (x === 0 || y === 0 || x === mapSize.width - 1 || y === mapSize.height - 1) {
          terrain = 'ocean';
        } else {
          // 랜덤 지형 생성
          const randIdx = Math.floor(Math.random() * 100);
          if (randIdx < 40) terrain = 'grassland';
          else if (randIdx < 65) terrain = 'plains';
          else if (randIdx < 75) terrain = 'forest';
          else if (randIdx < 82) terrain = 'hills';
          else if (randIdx < 88) terrain = 'desert';
          else if (randIdx < 94) terrain = 'tundra';
          else if (randIdx < 97) terrain = 'jungle';
          else terrain = 'mountain';
        }
        
        // 자원 추가 (10% 확률)
        const hasResource = Math.random() < 0.1;
        let resource = null;
        if (hasResource) {
          const resources = ['iron', 'horses', 'coal', 'oil', 'uranium', 'wheat', 'cattle', 'sheep', 'deer', 'banana', 'gems', 'gold', 'silver'];
          resource = resources[Math.floor(Math.random() * resources.length)];
        }
        
        // 육각형 그리드에서의 x, y 좌표 계산
        // 짝수 행에서는 x좌표가 일반적인 그리드와 일치하지만,
        // 홀수 행에서는 x좌표가 0.5칸 오른쪽으로 오프셋 됨
        const posX = x * hexWidth + (y % 2) * (hexWidth / 2);
        const posY = y * (hexHeight * 0.75);
        
        newMapTiles.push({
          id: `${x}-${y}`,
          gridX: x,
          gridY: y,
          x: posX,
          y: posY,
          terrain,
          resource,
          improvement: null,
          unit: (x === Math.floor(mapSize.width / 2) && y === Math.floor(mapSize.height / 2)) ? 'settler' : null, // 시작 유닛
          city: (x === Math.floor(mapSize.width / 2) && y === Math.floor(mapSize.height / 2 - 1)) ? { name: '수도', size: 3 } : null // 시작 도시
        });
      }
    }
    
    setMapTiles(newMapTiles);
    
    // 중앙으로 초기 위치 설정
    const mapContainer = mapContainerRef.current;
    if (mapContainer) {
      const containerWidth = mapContainer.clientWidth;
      const containerHeight = mapContainer.clientHeight;
      setMapTransform({
        x: containerWidth / 2,
        y: containerHeight / 2,
        scale: 1
      });
    }
  };

  // 턴 진행
  const nextTurn = () => {
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
  };

  // 게임 로그 추가
  const addLog = (type, content, turn) => {
    setLog(prev => [...prev, { type, content, turn }]);
  };

  // 명령어 처리
  const handleCommand = (e) => {
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
  };

  // 타일 선택 처리
  const handleTileClick = (tile) => {
    setSelectedTile(tile.id === selectedTile ? null : tile.id);
    setInfoPanel({ open: true, type: 'tile', data: tile });
  };

  // 지도 드래그 시작
  const handleMapDragStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    
    // 마우스 또는 터치 이벤트에 따라 시작 위치 설정
    if (e.type === 'mousedown') {
      setDragStart({
        x: e.clientX - mapTransform.x,
        y: e.clientY - mapTransform.y
      });
    } else if (e.type === 'touchstart' && e.touches.length === 1) {
      setDragStart({
        x: e.touches[0].clientX - mapTransform.x,
        y: e.touches[0].clientY - mapTransform.y
      });
    }
  };

  // 지도 드래그 중
  const handleMapDrag = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    let newX, newY;
    
    // 마우스 또는 터치 이벤트에 따라 새 위치 계산
    if (e.type === 'mousemove') {
      newX = e.clientX - dragStart.x;
      newY = e.clientY - dragStart.y;
    } else if (e.type === 'touchmove' && e.touches.length === 1) {
      newX = e.touches[0].clientX - dragStart.x;
      newY = e.touches[0].clientY - dragStart.y;
    } else {
      return;
    }
    
    setMapTransform(prev => ({
      ...prev,
      x: newX,
      y: newY
    }));
  };

  // 지도 드래그 종료
  const handleMapDragEnd = () => {
    setIsDragging(false);
  };

  // 지도 확대/축소
  const handleZoom = (factor) => {
    setMapTransform(prev => {
      const newScale = prev.scale * factor;
      // 확대/축소 한계 설정
      if (newScale < 0.5 || newScale > 2) return prev;
      
      return {
        ...prev,
        scale: newScale
      };
    });
  };

  // 지도 중앙 정렬
  const centerMap = () => {
    const mapContainer = mapContainerRef.current;
    if (mapContainer) {
      const containerWidth = mapContainer.clientWidth;
      const containerHeight = mapContainer.clientHeight;
      setMapTransform({
        x: containerWidth / 2,
        y: containerHeight / 2,
        scale: 1
      });
    }
  };

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'map':
        return (
          <div 
            ref={mapContainerRef}
            className="w-full h-full overflow-hidden relative"
            onMouseDown={handleMapDragStart}
            onMouseMove={handleMapDrag}
            onMouseUp={handleMapDragEnd}
            onMouseLeave={handleMapDragEnd}
            onTouchStart={handleMapDragStart}
            onTouchMove={handleMapDrag}
            onTouchEnd={handleMapDragEnd}
          >
            {/* 지도 컨트롤 버튼 */}
            <div className="map-controls">
              <button 
                className="control-button"
                onClick={() => handleZoom(1.2)}
              >
                <ZoomIn size={20} />
              </button>
              <button 
                className="control-button"
                onClick={() => handleZoom(0.8)}
              >
                <ZoomOut size={20} />
              </button>
              <button 
                className="control-button"
                onClick={centerMap}
              >
                <Home size={20} />
              </button>
            </div>
            
            {/* 육각형 타일 지도 */}
            <div 
              className="hex-grid absolute"
              style={{ 
                transform: `translate(${mapTransform.x}px, ${mapTransform.y}px) scale(${mapTransform.scale})`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
            >
              {mapTiles.map((tile) => (
                <div 
                  key={tile.id}
                  className={cn(
                    "hex-tile",
                    `terrain-${tile.terrain}`,
                    selectedTile === tile.id && "selected"
                  )}
                  style={{
                    left: `${tile.x - (mapSize.width * 40)}px`,
                    top: `${tile.y - (mapSize.height * 60)}px`,
                  }}
                  onClick={() => handleTileClick(tile)}
                >
                  {/* 유닛 */}
                  {tile.unit && (
                    <div className="unit-marker">
                      {tile.unit === 'settler' && <User size={14} className="text-white" />}
                    </div>
                  )}
                  
                  {/* 도시 */}
                  {tile.city && (
                    <div className="city-marker">
                      <div className="bg-red-700 rounded-full w-1/2 h-1/2 border-2 border-white"></div>
                    </div>
                  )}
                  
                  {/* 자원 */}
                  {tile.resource && (
                    <div className="resource-marker"></div>
                  )}
                  
                  {/* 타일 좌표 (디버그용) */}
                  {/* <div className="text-xs font-bold text-center text-white drop-shadow-md">
                    {tile.gridX},{tile.gridY}
                  </div> */}
                </div>
              ))}
            </div>
          </div>
        );
      case 'cities':
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
                    <div className="bg-gray-700 p-2 rounded">
                      <p>식량: +5/턴</p>
                    </div>
                    <div className="bg-gray-700 p-2 rounded">
                      <p>생산력: +4/턴</p>
                    </div>
                    <div className="bg-gray-700 p-2 rounded">
                      <p>금: +3/턴</p>
                    </div>
                    <div className="bg-gray-700 p-2 rounded">
                      <p>과학: +2/턴</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'research':
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
                <div className="bg-gray-800 rounded p-3 cursor-pointer hover:bg-gray-700">
                  <h5 className="font-bold">도자기</h5>
                  <p className="text-xs text-gray-400">4턴 소요</p>
                </div>
                <div className="bg-gray-800 rounded p-3 cursor-pointer hover:bg-gray-700">
                  <h5 className="font-bold">동물 사육</h5>
                  <p className="text-xs text-gray-400">4턴 소요</p>
                </div>
                <div className="bg-gray-800 rounded p-3 cursor-pointer hover:bg-gray-700">
                  <h5 className="font-bold">채광</h5>
                  <p className="text-xs text-gray-400">5턴 소요</p>
                </div>
                <div className="bg-gray-800 rounded p-3 cursor-pointer hover:bg-gray-700">
                  <h5 className="font-bold">범선</h5>
                  <p className="text-xs text-gray-400">6턴 소요</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'units':
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
      default:
        return <div>선택된 탭이 없습니다</div>;
    }
  };

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
      <div className="bg-slate-800 p-1 flex justify-center space-x-6 text-sm border-b border-slate-700">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-400 rounded-full mr-1"></div>
          <span>{resources.food}</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-1"></div>
          <span>{resources.production}</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-600 rounded-full mr-1"></div>
          <span>{resources.gold}</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-1"></div>
          <span>{resources.science}</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-500 rounded-full mr-1"></div>
          <span>{resources.culture}</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-white rounded-full mr-1"></div>
          <span>{resources.faith}</span>
        </div>
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex">
        {/* 탭 네비게이션 */}
        <div className="w-16 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-4">
          <button
            className={cn(
              "w-12 h-12 mb-4 rounded-lg flex items-center justify-center",
              selectedTab === 'map' ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'
            )}
            onClick={() => setSelectedTab('map')}
          >
            <Map size={24} />
          </button>
          <button
            className={cn(
              "w-12 h-12 mb-4 rounded-lg flex items-center justify-center",
              selectedTab === 'cities' ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'
            )}
            onClick={() => setSelectedTab('cities')}
          >
            <Book size={24} />
          </button>
          <button
            className={cn(
              "w-12 h-12 mb-4 rounded-lg flex items-center justify-center",
              selectedTab === 'research' ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'
            )}
            onClick={() => setSelectedTab('research')}
          >
            <Beaker size={24} />
          </button>
          <button
            className={cn(
              "w-12 h-12 mb-4 rounded-lg flex items-center justify-center",
              selectedTab === 'units' ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'
            )}
            onClick={() => setSelectedTab('units')}
          >
            <Sword size={24} />
          </button>
        </div>
        
        {/* 주요 콘텐츠 영역 */}
        <div className="flex-1 h-full overflow-hidden flex flex-col">
          {/* 탭 콘텐츠 */}
          <div className="flex-1 overflow-hidden">
            {renderTabContent()}
          </div>
          
          {/* 하단 명령 및 로그 영역 */}
          <div className="h-1/3 bg-slate-800 border-t border-slate-700 flex">
            {/* 로그 영역 */}
            <div className="flex-1 p-3 overflow-auto flex flex-col-reverse">
              <div className="space-y-3">
                {log.slice().reverse().map((entry, index) => (
                  <div key={index} className={cn(
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
                {infoPanel.open && infoPanel.type === 'tile' && (
                  <div className="bg-slate-700 p-3 rounded">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-bold">타일 정보</h4>
                      <button onClick={() => setInfoPanel({ open: false, type: null, data: null })}>
                        ✕
                      </button>
                    </div>
                    <div className="text-sm space-y-1">
                      <p>위치: ({infoPanel.data.gridX}, {infoPanel.data.gridY})</p>
                      <p>지형: {infoPanel.data.terrain}</p>
                      {infoPanel.data.resource && <p>자원: {infoPanel.data.resource}</p>}
                      {infoPanel.data.improvement && <p>개발: {infoPanel.data.improvement}</p>}
                      {infoPanel.data.unit && <p>유닛: {infoPanel.data.unit}</p>}
                      {infoPanel.data.city && <p>도시: {infoPanel.data.city.name} (인구: {infoPanel.data.city.size})</p>}
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
                )}
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
        </div>
      </div>
    </div>
  );
}