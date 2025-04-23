"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sword, Brain, BookOpen, Users, Flag, Award, Play, Globe, Wand2, Clock, ZoomIn, ZoomOut, Move, Zap, Calendar } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [hoveredCivilization, setHoveredCivilization] = useState(null);
  const mapContainerRef = useRef(null);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [mapScale, setMapScale] = useState(1);
  const [demoTiles, setDemoTiles] = useState([]);

  const civilizations = [
    { 
      id: 'rome', 
      name: '로마', 
      specialty: '군사 확장에 특화', 
      icon: <Sword size={32} />, 
      color: 'from-red-700 to-red-900' 
    },
    { 
      id: 'china', 
      name: '중국', 
      specialty: '과학과 경이 건설에 보너스', 
      icon: <Brain size={32} />, 
      color: 'from-yellow-700 to-yellow-900' 
    },
    { 
      id: 'egypt', 
      name: '이집트', 
      specialty: '문화와 경이 건설에 특화', 
      icon: <BookOpen size={32} />, 
      color: 'from-amber-700 to-amber-900' 
    },
    { 
      id: 'mongol', 
      name: '몽골', 
      specialty: '기병 유닛과 정복에 강점', 
      icon: <Flag size={32} />, 
      color: 'from-green-700 to-green-900' 
    },
    { 
      id: 'england', 
      name: '영국', 
      specialty: '해군과 식민지 확장에 보너스', 
      icon: <Flag size={32} />, 
      color: 'from-blue-700 to-blue-900' 
    },
    { 
      id: 'france', 
      name: '프랑스', 
      specialty: '문화와 외교에 특화', 
      icon: <Users size={32} />, 
      color: 'from-indigo-700 to-indigo-900' 
    },
    { 
      id: 'japan', 
      name: '일본', 
      specialty: '군사와 생산에 균형된 능력', 
      icon: <Sword size={32} />, 
      color: 'from-rose-700 to-rose-900' 
    },
    { 
      id: 'aztec', 
      name: '아즈텍', 
      specialty: '종교와 인적 자원 활용에 특화', 
      icon: <Award size={32} />, 
      color: 'from-emerald-700 to-emerald-900' 
    },
  ];

  const features = [
    "🌍 육각형 타일 기반 세계 탐험",
    "🏙️ 도시 건설 및 발전",
    "🔬 기술 연구와 발전",
    "⚔️ 전략적 전투 시스템",
    "🤝 AI 문명과의 외교",
    "✨ LLM 기반 적응형 내러티브"
  ];

  const gameTypes = [
    { name: "빠른 게임", turns: "100턴", time: "약 1-2시간" },
    { name: "일반 게임", turns: "250턴", time: "약 3-5시간" },
    { name: "장기 게임", turns: "500턴", time: "약 8-12시간" }
  ];

  // 데모용 육각형 타일 생성
  useEffect(() => {
    const terrainTypes = ['grassland', 'plains', 'desert', 'mountain', 'ocean', 'forest', 'hills'];
    const tiles = [];
    
    // 크기 설정
    const width = 10;
    const height = 8;
    
    // 육각형 타일의 크기
    const hexSize = 40;
    const hexWidth = Math.sqrt(3) * hexSize;
    const hexHeight = 2 * hexSize;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // 랜덤 지형 선택
        const terrain = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
        
        // 육각형 그리드에서의 x, y 좌표 계산
        const posX = x * hexWidth + (y % 2) * (hexWidth / 2);
        const posY = y * (hexHeight * 0.75);
        
        tiles.push({
          id: `${x}-${y}`,
          x: posX,
          y: posY,
          terrain
        });
      }
    }
    
    setDemoTiles(tiles);
    
    // 중앙 정렬
    const container = mapContainerRef.current;
    if (container) {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      setMapOffset({
        x: containerWidth / 2,
        y: containerHeight / 2
      });
    }
  }, []);

  // 타일 색상 가져오기
  const getTileColor = (terrain) => {
    switch (terrain) {
      case 'grassland': return 'bg-green-600';
      case 'plains': return 'bg-yellow-600';
      case 'desert': return 'bg-yellow-300';
      case 'tundra': return 'bg-gray-300';
      case 'mountain': return 'bg-gray-600';
      case 'ocean': return 'bg-blue-500';
      case 'forest': return 'bg-green-800';
      case 'hills': return 'bg-green-700';
      default: return 'bg-gray-400';
    }
  };

  // 맵 확대/축소
  const handleZoom = (factor) => {
    const newScale = mapScale * factor;
    if (newScale >= 0.5 && newScale <= 1.5) {
      setMapScale(newScale);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* 헤더 영역 */}
      <header className="w-full py-8 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 z-0"></div>
        <h1 className="text-5xl font-bold mb-2 z-10 font-geist-mono tracking-tight">텍스트 문명</h1>
        <h2 className="text-2xl text-gray-300 mb-8 z-10">Text Civilization</h2>
        <p className="text-lg text-center max-w-2xl mx-auto mb-8 text-gray-300 z-10">
          고대부터 미래까지, 당신의 문명을 이끌어 승리를 향해 나아가세요.
          육각형 타일 기반의 턴제 전략 게임으로 역사를 새롭게 써내려갑니다.
        </p>
        <button 
          onClick={() => router.push('/game/select-mode')}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 py-3 px-12 rounded-full text-xl font-bold flex items-center z-10 hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg"
        >
          <Play className="mr-2" size={24} />
          게임 시작하기
        </button>
      </header>

      {/* 육각형 타일 데모 맵 */}
      <section className="py-8 px-4 relative overflow-hidden" style={{ height: '300px' }}>
        <div ref={mapContainerRef} className="w-full h-full relative">
          {/* 지도 컨트롤 */}
          <div className="absolute top-2 right-2 z-10 flex flex-col space-y-2">
            <button 
              className="bg-slate-700 p-2 rounded-full hover:bg-slate-600"
              onClick={() => handleZoom(1.2)}
            >
              <ZoomIn size={20} />
            </button>
            <button 
              className="bg-slate-700 p-2 rounded-full hover:bg-slate-600"
              onClick={() => handleZoom(0.8)}
            >
              <ZoomOut size={20} />
            </button>
          </div>
          
          {/* 육각형 타일 */}
          <div 
            className="absolute left-0 top-0 w-full h-full"
            style={{ 
              transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${mapScale})`,
              transformOrigin: 'center',
            }}
          >
            {demoTiles.map((tile) => (
              <div 
                key={tile.id}
                className={cn(
                  "absolute cursor-pointer transition-transform hover:scale-105",
                  getTileColor(tile.terrain)
                )}
                style={{
                  width: '70px',
                  height: '80px',
                  clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                  left: `${tile.x - 200}px`,
                  top: `${tile.y - 100}px`,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 문명 선택 영역 */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-2 text-center">당신의 문명을 선택하세요</h2>
          <p className="text-center text-gray-300 mb-12">각 문명은 고유한 특성과 장점을 가지고 있습니다</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {civilizations.map((civ) => (
              <div 
                key={civ.id}
                className={cn(
                  "bg-gradient-to-br p-0.5 rounded-lg transform transition-all hover:scale-105",
                  hoveredCivilization === civ.id ? civ.color : "from-gray-700 to-gray-900"
                )}
                onMouseEnter={() => setHoveredCivilization(civ.id)}
                onMouseLeave={() => setHoveredCivilization(null)}
              >
                <div className="bg-gray-800 h-full rounded-lg p-6 flex flex-col items-center justify-center">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all",
                    `bg-gradient-to-br ${civ.color}`
                  )}>
                    {civ.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-1">{civ.name}</h3>
                  <p className="text-gray-300 text-center text-sm">{civ.specialty}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 게임 특징 영역 */}
      <section className="py-16 px-4 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-2 text-center">게임 특징</h2>
          <p className="text-center text-gray-300 mb-12">텍스트 문명만의 특별한 경험</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-xl transition-all"
                style={{ 
                  clipPath: index % 2 === 0 ? 'polygon(0% 0%, 100% 0%, 100% 85%, 85% 100%, 0% 100%)' : 'polygon(0% 0%, 100% 0%, 100% 100%, 15% 100%, 0% 85%)'
                }}
              >
                <p className="text-lg">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 게임 모드 영역 - 육각형 카드 디자인 */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-2 text-center">게임 모드</h2>
          <p className="text-center text-gray-300 mb-12">당신의 플레이 스타일에 맞게 선택하세요</p>
          
          <div className="flex items-center justify-center">
            <div className="flex flex-wrap justify-center gap-4">
              {gameTypes.map((type, index) => (
                <div 
                  key={index} 
                  className="w-64 h-72 relative cursor-pointer transition-transform hover:scale-105"
                >
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-blue-700 to-indigo-900"
                    style={{
                      clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                    }}
                  >
                    <div className="absolute inset-2 bg-gray-800 flex flex-col items-center justify-center"
                      style={{
                        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                      }}
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center mb-4">
                        {index === 0 ? <Zap size={28} /> : index === 1 ? <Clock size={28} /> : <Calendar size={28} />}
                      </div>
                      <h3 className="text-xl font-bold mb-3">{type.name}</h3>
                      <p className="text-gray-300 mb-2">{type.turns}</p>
                      <p className="text-gray-400 text-sm">{type.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 승리 조건 영역 */}
      <section className="py-16 px-4 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-2 text-center">승리 조건</h2>
          <p className="text-center text-gray-300 mb-12">문명의 위대함을 증명하는 다양한 방법</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div 
              className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-6 shadow-lg"
              style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}
            >
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center mr-3">
                  <Wand2 size={20} />
                </div>
                <h3 className="text-xl font-bold">과학 승리</h3>
              </div>
              <p className="text-gray-300">가장 발전된 기술을 연구하고 미래 시대를 선도하세요. 우주 개척이나 첨단 기술로 승리를 쟁취하세요.</p>
            </div>
            <div 
              className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-lg p-6 shadow-lg"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 15% 100%)' }}
            >
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center mr-3">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-xl font-bold">문화 승리</h3>
              </div>
              <p className="text-gray-300">예술과 문화의 중심지가 되어 당신의 문화적 영향력을 전 세계에 전파하세요.</p>
            </div>
            <div 
              className="bg-gradient-to-r from-red-900 to-red-800 rounded-lg p-6 shadow-lg"
              style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }}
            >
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-red-700 flex items-center justify-center mr-3">
                  <Sword size={20} />
                </div>
                <h3 className="text-xl font-bold">정복 승리</h3>
              </div>
              <p className="text-gray-300">강력한 군사력으로 적대 문명의 수도를 점령하고 세계를 통일하세요.</p>
            </div>
            <div 
              className="bg-gradient-to-r from-green-900 to-green-800 rounded-lg p-6 shadow-lg"
              style={{ clipPath: 'polygon(0 0, 85% 0, 100% 100%, 0 100%)' }}
            >
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center mr-3">
                  <Users size={20} />
                </div>
                <h3 className="text-xl font-bold">외교 승리</h3>
              </div>
              <p className="text-gray-300">외교적 영향력을 확대하고 세계 의회에서 주도적인 역할을 맡아 평화로운 리더십을 보여주세요.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 영역 */}
      <footer className="py-8 px-4 text-center text-gray-400">
        <p>© 2025 텍스트 문명 (Text Civilization)</p>
        <p className="mt-2 text-sm">육각형 타일 기반 웹 브라우저 턴제 전략 게임</p>
      </footer>
    </div>
  );
}