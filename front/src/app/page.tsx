"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sword, Brain, BookOpen, Users, Flag, Award, Play, Globe, Wand2, Clock, ZoomIn, ZoomOut, Move, Zap, Calendar } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [hoveredCivilization, setHoveredCivilization] = useState<string | null>(null);

  const mapContainerRef = useRef(null);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [mapScale, setMapScale] = useState(1);
  const [demoTiles, setDemoTiles] = useState([]);


  const features = [
    "🌍 육각형 타일 기반 세계 탐험",
    "🏙️ 도시 건설 및 발전",
    "🔬 기술 연구와 발전",
    "⚔️ 전략적 전투 시스템",
    "🤝 AI 문명과의 외교",
    "✨ LLM 기반 적응형 내러티브"
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
      <header className="w-full py-12 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl">

      {/* 게임 모드 안내 영역 (select-mode 스타일 참고) */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 z-0 animate-pulse"></div>
        <h1 className="text-6xl md:text-7xl font-extrabold mb-3 z-10 font-geist-mono tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent drop-shadow-lg text-center">문명</h1>
        <h2 className="text-2xl md:text-3xl text-gray-200 mb-6 z-10 font-semibold tracking-wide text-center">Text Civilization</h2>
        <p className="text-lg md:text-xl text-center max-w-2xl mx-auto mb-10 text-gray-300 z-10 font-medium">
          고대부터 미래까지, <span className="text-blue-300 font-bold">당신의 문명</span>을 이끌어<br className="hidden md:block" />승리를 향해 나아가세요.<br />육각형 타일 기반의 <span className="text-indigo-300 font-bold">턴제 전략 게임</span>으로 역사를 새롭게 써내려갑니다.
        </p>
        <button 
          onClick={() => router.push(`/game/select-mode`)}
          className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 py-4 px-16 rounded-full text-2xl font-extrabold flex items-center gap-3 z-10 hover:from-blue-600 hover:to-purple-700 transition-all shadow-2xl ring-2 ring-blue-400/30 focus:outline-none focus:ring-4 focus:ring-indigo-400/50 animate-bounce"
          aria-label="게임 시작하기"
        >
          <Play className="mr-1" size={28} />
          게임 시작하기
        </button>
        <div className="absolute left-1/2 bottom-0 translate-x-[-50%] translate-y-1/2 z-0 blur-2xl opacity-40 pointer-events-none select-none" aria-hidden="true">
          <Globe size={340} className="text-blue-500/20 animate-spin-slow" />
        </div>
      </header>

    
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">게임 모드</h2>
          <p className="text-center text-gray-300 mb-10">
            원하는 플레이 스타일에 맞는 <span className="text-blue-300 font-bold">게임 모드</span>를 선택하세요.<br/>
            턴 수와 소요 시간, 난이도에 따라 다양한 전략을 경험할 수 있습니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-md flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center mb-4">
                <Zap size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">짧은 게임</h3>
              <p className="text-gray-400 text-sm mb-1">50턴</p>
              <p className="text-gray-400 text-sm mb-3">약 30분~1시간</p>
              <p className="text-gray-300 text-center text-sm">빠른 전략 전개와<br/>짧은 시간 플레이를 원하는 분께 추천</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-md flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center mb-4">
                <Clock size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">표준 게임</h3>
              <p className="text-gray-400 text-sm mb-1">100턴</p>
              <p className="text-gray-400 text-sm mb-3">약 1~2시간</p>
              <p className="text-gray-300 text-center text-sm">전략과 성장의 균형<br/>표준적인 플레이를 원하는 분께 추천</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-md flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center mb-4">
                <Calendar size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">긴 게임</h3>
              <p className="text-gray-400 text-sm mb-1">250턴</p>
              <p className="text-gray-400 text-sm mb-3">약 3~5시간</p>
              <p className="text-gray-300 text-center text-sm">장기적인 성장과<br/>깊은 전략을 원하는 분께 추천</p>
            </div>
          </div>
        </div>
      </section>
      {/* 게임 특징 영역 */}
      <section className="py-16 px-4 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-2 text-center">게임 특징</h2>
          <p className="text-center text-gray-300 mb-12">문명만의 특별한 경험</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, i) => (
              <div key={i} className="flex flex-col items-center bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all group">
                <div className="mb-3 text-4xl animate-bounce-slow group-hover:scale-125 transition-transform">{feature.slice(0,2)}</div>
                <div className="text-lg font-semibold text-gray-100 text-center tracking-tight group-hover:text-blue-200 transition-colors">
                  {feature.slice(2)}
                </div>
              </div>
            ))}
          </div>
          
          {/* 지도 유형 영역 */}
          <section className="py-10">
            <h2 className="text-3xl font-bold mb-2 text-center">지도 유형</h2>
            <p className="text-center text-gray-300 mb-8">다양한 지도 유형은 플레이 스타일과 전략에 큰 영향을 줍니다.</p>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-slate-900 rounded-xl overflow-hidden text-sm md:text-base border border-slate-700">
                <thead>
                  <tr className="bg-slate-800 text-blue-200">
                    <th className="py-3 px-4 border-b border-slate-700 text-left">지도 유형</th>
                    <th className="py-3 px-4 border-b border-slate-700 text-left">특징</th>
                    <th className="py-3 px-4 border-b border-slate-700 text-left">전략적 영향</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr className="hover:bg-slate-800/70">
                    <td className="py-3 px-4 font-bold">Continents (대륙)</td>
                    <td className="py-3 px-4">2개 이상의 큰 대륙으로 나뉜 지도</td>
                    <td className="py-3 px-4">중후반에 해상 탐사와 해군력 중요</td>
                  </tr>
                  <tr className="hover:bg-slate-800/70">
                    <td className="py-3 px-4 font-bold">Pangaea (팡게아)</td>
                    <td className="py-3 px-4">하나의 거대한 대륙으로 구성</td>
                    <td className="py-3 px-4">육지 전쟁과 빠른 접촉이 핵심</td>
                  </tr>
                  <tr className="hover:bg-slate-800/70">
                    <td className="py-3 px-4 font-bold">Archipelago (군도)</td>
                    <td className="py-3 px-4">섬이 많은 지도</td>
                    <td className="py-3 px-4">해군 중심, 해양 탐험과 도시 확장 전략 유리</td>
                  </tr>
                  <tr className="hover:bg-slate-800/70">
                    <td className="py-3 px-4 font-bold">Fractal (프랙탈)</td>
                    <td className="py-3 px-4">랜덤한 대륙/지형 생성</td>
                    <td className="py-3 px-4">예측 불가, 리플레이성 높음</td>
                  </tr>
                  <tr className="hover:bg-slate-800/70">
                    <td className="py-3 px-4 font-bold">Small Continents (작은 대륙)</td>
                    <td className="py-3 px-4">여러 개의 중간 규모 대륙</td>
                    <td className="py-3 px-4">해군과 육군 모두 균형 있게 사용 가능</td>
                  </tr>
                  <tr className="hover:bg-slate-800/70">
                    <td className="py-3 px-4 font-bold">Terra (테라)</td>
                    <td className="py-3 px-4">모두 같은 대륙에서 시작, 신대륙 존재</td>
                    <td className="py-3 px-4">신대륙 탐험이 중요한 변수</td>
                  </tr>
                  <tr className="hover:bg-slate-800/70">
                    <td className="py-3 px-4 font-bold">Tilted Axis (기울어진 축)</td>
                    <td className="py-3 px-4">지도가 남북이 아닌 동서로 길게 배치됨</td>
                    <td className="py-3 px-4">이상한 기후와 전략 요구</td>
                  </tr>
                  <tr className="hover:bg-slate-800/70">
                    <td className="py-3 px-4 font-bold">Inland Sea (내륙 바다)</td>
                    <td className="py-3 px-4">가운데 바다, 주변 육지</td>
                    <td className="py-3 px-4">해상 전투 제한적, 중심 바다를 두고 경쟁 가능</td>
                  </tr>
                  <tr className="hover:bg-slate-800/70">
                    <td className="py-3 px-4 font-bold">Shuffle (셔플)</td>
                    <td className="py-3 px-4">무작위로 지도 유형 섞임</td>
                    <td className="py-3 px-4">전략 예측 어려움, 도전적인 플레이</td>
                  </tr>
                  <tr className="hover:bg-slate-800/70">
                    <td className="py-3 px-4 font-bold">Donut (도넛)</td>
                    <td className="py-3 px-4">가운데가 비어 있고 주변에 땅</td>
                    <td className="py-3 px-4">가운데 지역 장악이 핵심 전략</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 문명 특징별 안내 영역 (select-mode 스타일 참고) */}
          <section className="py-10">
            <h2 className="text-3xl font-bold mb-2 text-center">문명 특징별 대표 문명 안내</h2>
            <p className="text-center text-gray-300 mb-10">각 문명은 특정 분야에 강점을 가지고 있습니다.<br/>플레이 스타일에 맞는 특징을 골라 대표 문명을 참고해 보세요!</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-red-800 to-red-900 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-2 text-red-200">군사</h3>
                <p className="text-gray-300 text-sm mb-3">강력한 유닛과 전투 보너스로 정복에 유리합니다.</p>
                <ul className="text-gray-200 text-sm space-y-1 list-disc ml-5">
                  <li>로마</li>
                  <li>몽골</li>
                  <li>일본</li>
                  <li>독일</li>
                  <li>아즈텍</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-2 text-blue-200">과학</h3>
                <p className="text-gray-300 text-sm mb-3">기술 발전과 연구에 특화되어 빠른 성장과 승리를 노릴 수 있습니다.</p>
                <ul className="text-gray-200 text-sm space-y-1 list-disc ml-5">
                  <li>중국</li>
                  <li>한국</li>
                  <li>바빌론</li>
                  <li>마야</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-pink-800 to-pink-900 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-2 text-pink-200">문화</h3>
                <p className="text-gray-300 text-sm mb-3">문화력과 관광에 강점이 있어 문화 승리에 유리합니다.</p>
                <ul className="text-gray-200 text-sm space-y-1 list-disc ml-5">
                  <li>이집트</li>
                  <li>프랑스</li>
                  <li>브라질</li>
                  <li>페르시아</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-yellow-800 to-yellow-900 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-2 text-yellow-200">경제</h3>
                <p className="text-gray-300 text-sm mb-3">자원 수집과 생산, 상업에 특화되어 도시 발전이 빠릅니다.</p>
                <ul className="text-gray-200 text-sm space-y-1 list-disc ml-5">
                  <li>인도</li>
                  <li>아라비아</li>
                  <li>베네치아</li>
                  <li>아즈텍</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-green-800 to-green-900 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-2 text-green-200">확장/탐험</h3>
                <p className="text-gray-300 text-sm mb-3">도시 확장과 지도 탐험에 강점이 있습니다.</p>
                <ul className="text-gray-200 text-sm space-y-1 list-disc ml-5">
                  <li>잉글랜드</li>
                  <li>아메리카</li>
                  <li>쇼쇼니</li>
                  <li>잉카</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-indigo-800 to-indigo-900 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-2 text-indigo-200">외교/방어</h3>
                <p className="text-gray-300 text-sm mb-3">도시국가와의 외교, 방어적 플레이에 유리합니다.</p>
                <ul className="text-gray-200 text-sm space-y-1 list-disc ml-5">
                  <li>그리스</li>
                  <li>에티오피아</li>
                  <li>시암</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </section>
      {/* 승리 조건/게임 목표 영역 (select-mode 스타일 설명 차용) */}
      <section className="py-16 px-4 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">게임 목표와 승리 방식</h2>
          <p className="text-center text-gray-300 mb-10">
            <span className="text-blue-300 font-bold">문명</span>에서는 다양한 승리 조건이 존재합니다.<br />
            <span className="text-indigo-200">게임 모드</span>와 <span className="text-indigo-200">난이도</span>에 따라 도전과 전략이 달라집니다.<br />
            원하는 목표를 정하고, 그에 맞는 전략을 세워보세요!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-6 shadow-lg">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center mr-3">
                  <Wand2 size={20} />
                </div>
                <h3 className="text-xl font-bold">과학 승리</h3>
              </div>
              <p className="text-gray-300 text-sm">가장 발전된 기술을 연구하고 미래 시대를 선도하세요. 우주 개척이나 첨단 기술로 승리를 쟁취할 수 있습니다.</p>
            </div>
            <div className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-lg p-6 shadow-lg">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center mr-3">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-xl font-bold">문화 승리</h3>
              </div>
              <p className="text-gray-300 text-sm">예술과 문화의 중심지가 되어 전 세계에 영향력을 확장하세요. 문화적 우위를 통해 승리를 노릴 수 있습니다.</p>
            </div>
            <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-lg p-6 shadow-lg">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-red-700 flex items-center justify-center mr-3">
                  <Sword size={20} />
                </div>
                <h3 className="text-xl font-bold">정복 승리</h3>
              </div>
              <p className="text-gray-300 text-sm">강력한 군사력으로 적 문명의 수도를 점령하여 세계를 통일하세요. 공격적이고 전략적인 플레이가 요구됩니다.</p>
            </div>
            <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-lg p-6 shadow-lg">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center mr-3">
                  <Users size={20} />
                </div>
                <h3 className="text-xl font-bold">외교 승리</h3>
              </div>
              <p className="text-gray-300 text-sm">외교적 영향력을 키워 세계 의회에서 주도권을 잡아 평화로운 리더십을 보여주세요.</p>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-400 text-sm">
            <b>팁:</b> 게임 시작 시 <span className="text-indigo-200">게임 모드</span>와 <span className="text-indigo-200">난이도</span>를 선택하면, 목표와 승리 방식에 따라 전략을 달리할 수 있습니다.
          </div>
        </div>
      </section>

      {/* 푸터 영역 */}
      <footer className="py-8 px-4 text-center text-gray-400">
        <p>© 2025 문명 (Web Civilization)</p>
        <p className="mt-2 text-sm">육각형 타일 기반 웹 브라우저 턴제 전략 게임</p>
      </footer>
    </div>
  );
}