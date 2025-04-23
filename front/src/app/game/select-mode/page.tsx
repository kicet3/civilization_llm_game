"use client";

import React, { useState } from 'react';
import { CIV_TYPES, CIV_TYPE_MAP } from './civTypes';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowLeft, Clock, Calendar, Users, Globe, Wand2, Zap, Award, PlayCircle, Map, Star, User, Sword } from 'lucide-react';

export default function GameModeSelect() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [selectedCivilization, setSelectedCivilization] = useState(null);
  const [selectedMapType, setSelectedMapType] = useState(null);
  const [selectedCivCount, setSelectedCivCount] = useState<number | null>(null);
  const [step, setStep] = useState(1);

  // 문명 수 선택 (5~10, 6개)
  const civCounts: number[] = Array.from({ length: 6 }, (_, i) => i + 5); // [5,6,...,10]

  const gameModes = [
    { id: 'short', name: '짧은 게임', turns: 50, time: '약 30분~1시간', icon: <Zap size={28} /> },
    { id: 'medium', name: '표준 게임', turns: 100, time: '약 1-2시간', icon: <Clock size={28} /> },
    { id: 'long', name: '긴 게임', turns: 250, time: '약 3-5시간', icon: <Calendar size={28} /> }
  ];

  const difficulties = [
    { id: 'settler', name: '정착민', description: '입문: 전략 게임이 처음이거나 쉬운 난이도를 원하는 분께 추천' },
    { id: 'king', name: '왕', description: '중간: 적당한 도전과 재미를 원하는 분께 추천' },
    { id: 'emperor', name: '황제', description: '어려움: 전략 게임에 익숙하고 도전을 원하는 분께 추천' }
  ];

  const civilizations = [
    { id: 'korea', name: '한국', leader: '세종대왕', ability: '과학 관련 위대한 인물 생성 보너스', unit: '거북선', building: '학문소', color: 'from-blue-800 to-blue-900', icon: <Star size={28} /> },
    { id: 'japan', name: '일본', leader: '오다 노부나가', ability: '유닛 체력 1까지 피해 감소 없음', unit: '사무라이', building: '도조', color: 'from-rose-700 to-rose-900', icon: <Sword size={28} /> },
    { id: 'china', name: '중국', leader: '무측천', ability: '위대한 장군 생성 보너스', unit: '중기병', building: '장성', color: 'from-yellow-700 to-yellow-900', icon: <Star size={28} /> },
    { id: 'mongol', name: '몽골', leader: '칭기즈 칸', ability: '도시국가 공격에 보너스', unit: '카사르', building: '없음', color: 'from-green-700 to-green-900', icon: <Sword size={28} /> },
    { id: 'india', name: '인도', leader: '간디', ability: '인구가 많을수록 행복도에 패널티 감소', unit: '전사 코끼리', building: '없음', color: 'from-lime-700 to-lime-900', icon: <User size={28} /> },
    { id: 'aztec', name: '아즈텍', leader: '몬테수마', ability: '적 유닛 처치 시 문화 획득', unit: '재규어 전사', building: '없음', color: 'from-emerald-700 to-emerald-900', icon: <User size={28} /> },
    { id: 'egypt', name: '이집트', leader: '라메세스 2세', ability: '불가사의 생산 속도 증가', unit: '전차 궁수', building: '없음', color: 'from-amber-700 to-amber-900', icon: <Star size={28} /> },
    { id: 'france', name: '프랑스', leader: '나폴레옹', ability: '초반 문화력 보너스', unit: '무장 보병', building: '샤토', color: 'from-indigo-700 to-indigo-900', icon: <Users size={28} /> },
    { id: 'germany', name: '독일', leader: '비스마르크', ability: '야만인 유닛 채용 가능', unit: '판처', building: '없음', color: 'from-gray-700 to-gray-900', icon: <Sword size={28} /> },
    { id: 'rome', name: '로마', leader: '아우구스투스', ability: '건물 생산 속도 보너스', unit: '군단', building: '목욕탕', color: 'from-red-700 to-red-900', icon: <Sword size={28} /> },
    { id: 'greece', name: '그리스', leader: '알렉산더', ability: '도시국가 영향력 감소 속도 느림', unit: '컴패니언 기병', building: '없음', color: 'from-cyan-700 to-cyan-900', icon: <User size={28} /> },
    { id: 'america', name: '미국', leader: '워싱턴', ability: '타일 구매 비용 감소, 시야 증가', unit: '미니트맨', building: '없음', color: 'from-blue-500 to-blue-700', icon: <Users size={28} /> },
    { id: 'inca', name: '잉카', leader: '파차쿠텍', ability: '언덕 이동 페널티 없음, 도로 유지비 감소', unit: '전사정찰병', building: '테라스 농장', color: 'from-orange-700 to-orange-900', icon: <User size={28} /> },
    { id: 'russia', name: '러시아', leader: '예카테리나', ability: '전략 자원 생산량 증가', unit: '코사크', building: '시베리아 성채', color: 'from-yellow-800 to-yellow-900', icon: <Users size={28} /> },
    { id: 'ottoman', name: '오스만', leader: '술레이만', ability: '해상 야만인 유닛 채용 가능', unit: '자니세리', building: '없음', color: 'from-teal-700 to-teal-900', icon: <Globe size={28} /> },
    { id: 'england', name: '잉글랜드', leader: '엘리자베스', ability: '해상 유닛 이동력 +2', unit: '롱보우맨', building: '없음', color: 'from-blue-700 to-blue-900', icon: <Globe size={28} /> },
    { id: 'brazil', name: '브라질', leader: '페드루 2세', ability: '황금기 관광 및 위인 생성 보너스', unit: '프라시다', building: '없음', color: 'from-green-800 to-green-900', icon: <Star size={28} /> },
    { id: 'arabia', name: '아라비아', leader: '하룬 알 라시드', ability: '무역로 수익 증가', unit: '낙타 궁병', building: '바자르', color: 'from-yellow-500 to-yellow-700', icon: <Users size={28} /> },
    { id: 'persia', name: '페르시아', leader: '다리우스', ability: '황금기 지속 시간 증가', unit: '불사조 전사', building: '없음', color: 'from-pink-700 to-pink-900', icon: <Sword size={28} /> },
    { id: 'siam', name: '시암', leader: '라마 1세', ability: '도시국가 보너스 증가', unit: '나코에사르', building: '없음', color: 'from-amber-800 to-amber-900', icon: <User size={28} /> },
    { id: 'shoshone', name: '쇼쇼니', leader: '파코', ability: '개척자 생성 시 추가 타일 점유', unit: '파스탈라', building: '없음', color: 'from-green-500 to-green-700', icon: <Users size={28} /> },
    { id: 'venice', name: '베네치아', leader: '엔리코 단돌로', ability: '도시 1개만 직접 관리, 상업 특화', unit: '대상선', building: '없음', color: 'from-purple-700 to-purple-900', icon: <Users size={28} /> },
    { id: 'poland', name: '폴란드', leader: '카지미에시', ability: '사회 정책 추가 획득', unit: '윙드 후사르', building: '없음', color: 'from-red-800 to-red-900', icon: <Sword size={28} /> },
    { id: 'assyria', name: '아시리아', leader: '아슈르바니팔', ability: '도시 정복 시 기술 1개 훔침', unit: '시즈 타워', building: '없음', color: 'from-yellow-900 to-yellow-800', icon: <Sword size={28} /> },
    { id: 'ethiopia', name: '에티오피아', leader: '하일레 셀라시에', ability: '적보다 도시 수 적을 경우 방어력 보너스', unit: '메헬 사파리', building: '스테레', color: 'from-slate-700 to-slate-900', icon: <User size={28} /> },
    { id: 'maya', name: '마야', leader: '파칼', ability: '달력 연구 시 예언자 생성 보너스', unit: '볼런처', building: '피라미드', color: 'from-yellow-600 to-yellow-800', icon: <Star size={28} /> },
    { id: 'babylon', name: '바빌론', leader: '네부카드네자르 2세', ability: '과학 위인 보너스', unit: '바빌론 궁병', building: '과학 아카데미', color: 'from-blue-900 to-blue-700', icon: <Star size={28} /> },
  ];

  const mapTypes = [
    { id: 'Continents', name: 'Continents (대륙)', description: '2개 이상의 큰 대륙으로 나뉜 지도', impact: '중후반에 해상 탐사와 해군력 중요', icon: <Map size={28} /> },
    { id: 'Pangaea', name: 'Pangaea (팡게아)', description: '하나의 거대한 대륙으로 구성', impact: '육지 전쟁과 빠른 접촉이 핵심', icon: <Map size={28} /> },
    { id: 'Archipelago', name: 'Archipelago (군도)', description: '섬이 많은 지도', impact: '해군 중심, 해양 탐험과 도시 확장 전략 유리', icon: <Map size={28} /> },
    { id: 'Fractal', name: 'Fractal (프랙탈)', description: '랜덤한 대륙/지형 생성', impact: '예측 불가, 리플레이성 높음', icon: <Map size={28} /> },
    { id: 'SmallContinents', name: 'Small Continents (작은 대륙)', description: '여러 개의 중간 규모 대륙', impact: '해군과 육군 모두 균형 있게 사용 가능', icon: <Map size={28} /> },
    { id: 'Terra', name: 'Terra (테라)', description: '모두 같은 대륙에서 시작, 신대륙 존재', impact: '신대륙 탐험이 중요한 변수', icon: <Map size={28} /> },
    { id: 'TiltedAxis', name: 'Tilted Axis (기울어진 축)', description: '지도가 남북이 아닌 동서로 길게 배치됨', impact: '이상한 기후와 전략 요구', icon: <Map size={28} /> },
    { id: 'InlandSea', name: 'Inland Sea (내륙 바다)', description: '가운데 바다, 주변 육지', impact: '해상 전투 제한적, 중심 바다를 두고 경쟁 가능', icon: <Map size={28} /> },
    { id: 'Shuffle', name: 'Shuffle (셔플)', description: '무작위로 지도 유형 섞임', impact: '전략 예측 어려움, 도전적인 플레이', icon: <Map size={28} /> },
    { id: 'Donut', name: 'Donut (도넛)', description: '가운데가 비어 있고 주변에 땅', impact: '가운데 지역 장악이 핵심 전략', icon: <Map size={28} /> },
  ];

  const victoryTypes = [
    { id: 'all', name: '모든 승리 조건', icon: <Award size={24} /> },
    { id: 'domination', name: '정복 승리', icon: <Sword size={24} /> },
    { id: 'cultural', name: '문화 승리', icon: <Star size={24} /> },
    { id: 'scientific', name: '과학 승리', icon: <Wand2 size={24} /> },
    { id: 'diplomatic', name: '외교 승리', icon: <Users size={24} /> }
  ];

  const goToNextStep = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // 게임 시작 페이지로 이동 (선택값 전달)
      const params: Record<string, string> = {};
      if (selectedMode) params.mode = encodeURIComponent(selectedMode);
      if (selectedDifficulty) params.difficulty = encodeURIComponent(selectedDifficulty);
      if (selectedCivilization) params.civ = encodeURIComponent(selectedCivilization);
      if (selectedMapType) params.map = encodeURIComponent(selectedMapType);
      if (selectedCivCount) params.civCount = encodeURIComponent(String(selectedCivCount));
      const paramString = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
      router.push(`/game${paramString ? `?${paramString}` : ''}`);
    }
  };


  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      // 메인 페이지로 돌아가기
      router.push('/');
    }
  };

  // 현재 단계에 따른 버튼 텍스트
  const getNextButtonText = () => {
    if (step === 5) return '게임 시작';
    return '다음';
  };

  // 단계별 선택 여부 확인
  const isCurrentStepSelected = () => {
    switch (step) {
      case 1: return !!selectedMode;
      case 2: return !!selectedDifficulty;
      case 3: return !!selectedCivilization;
      case 4: return !!selectedMapType;
      case 5: return !!selectedCivCount;
      default: return false;
    }
  };

  // 육각형 아이템 스타일 생성 헬퍼 함수
  const getHexStyle = (index, total) => {
    // 원 위에 골고루 배치하기 위한 각도 계산
    const radius = 250; // 원의 반지름
    const angle = (Math.PI * 2 * index) / total;
    const centerX = 0;
    const centerY = 0;
    
    // x, y 좌표 계산
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    return {
    };
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="w-full max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">게임 모드 선택</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gameModes.map((gameMode) => (
                <div
                  key={gameMode.id}
                  className={cn(
                    "border-2 rounded-lg p-6 cursor-pointer transition-all hover:border-blue-500 hover:shadow-lg",
                    selectedMode === gameMode.id
                      ? "bg-blue-900 bg-opacity-20 border-blue-500"
                      : "border-gray-700"
                  )}
                  onClick={() => setSelectedMode(gameMode.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={gameMode.name + ' 선택'}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center">
                      {gameMode.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{gameMode.name}</h3>
                  <p className="text-gray-400 text-sm">{gameMode.time}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="w-full max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">난이도 선택</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {difficulties.map((difficulty) => (
                <div
                  key={difficulty.id}
                  className={cn(
                    "border-2 rounded-lg p-4 cursor-pointer transition-all",
                    selectedDifficulty === difficulty.id 
                      ? "border-blue-500 bg-blue-900 bg-opacity-20" 
                      : "border-gray-700 hover:border-gray-500"
                  )}
                  onClick={() => setSelectedDifficulty(difficulty.id)}
                >
                  <h3 className="text-lg font-bold">{difficulty.name}</h3>
                  <p className="text-gray-400 text-sm">{difficulty.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 3:
        // 타입별로 문명 그룹화
        const civsByType: Record<string, typeof civilizations> = {};
        civilizations.forEach(civ => {
          const type = CIV_TYPE_MAP[civ.id] || 'etc';
          if (!civsByType[type]) civsByType[type] = [];
          civsByType[type].push(civ);
        });
        return (
          <div className="w-full max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">문명 선택</h2>
            <div className="space-y-10">
              {CIV_TYPES.concat([{id: 'etc', name: '기타', color: 'from-gray-700 to-gray-900'}]).map(type => (
                civsByType[type.id] && civsByType[type.id].length > 0 && (
                  <div key={type.id}>
                    <h3 className={`text-2xl font-semibold mb-4 pl-2 text-left`}>{type.name} 문명</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {civsByType[type.id].map((civ) => (
                        <div
                          key={civ.id}
                          className={cn(
                            "border-2 rounded-lg p-6 cursor-pointer transition-all flex flex-col items-start",
                            selectedCivilization === civ.id
                              ? `border-blue-500 bg-blue-900 bg-opacity-20 ${civ.color}`
                              : `border-gray-700 hover:border-gray-500 ${civ.color}`
                          )}
                          onClick={() => setSelectedCivilization(civ.id)}
                          tabIndex={0}
                          role="button"
                          aria-label={civ.name + ' 선택'}
                        >
                          <div className="flex items-center justify-center mb-4 w-full">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center">
                              {civ.icon}
                            </div>
                          </div>
                          <h4 className="text-lg font-bold mb-2 text-left w-full">{civ.name}</h4>
                          <ul className="text-xs text-left w-full space-y-1">
                            <li><span className="font-semibold">지도자:</span> {civ.leader}</li>
                            <li><span className="font-semibold">부가 효과:</span> {civ.ability}</li>
                            <li><span className="font-semibold">특수 유닛:</span> {civ.unit}</li>
                            <li><span className="font-semibold">특수 건물/개선:</span> {civ.building}</li>
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        );
      case 4 :
        return (
          <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">지도 유형 선택</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center w-full">
              {mapTypes.map((mapType) => (
                <button
                  key={mapType.id}
                  type="button"
                  className={cn(
                    "w-full max-w-xs min-h-[190px] rounded-xl p-6 flex flex-col items-center border-2 shadow-md bg-slate-800 hover:bg-blue-900 hover:bg-opacity-60 transition-all",
                    selectedMapType === mapType.id
                      ? "border-blue-500 bg-blue-900 bg-opacity-70 scale-105 ring-2 ring-blue-400"
                      : "border-gray-700"
                  )}
                  onClick={() => setSelectedMapType(mapType.id)}
                  aria-label={mapType.name + ' 선택'}
                >
                  <div className="flex items-center justify-center mb-4 w-full">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center shadow">
                      {mapType.icon}
                    </div>
                  </div>
                  <h4 className="text-lg font-bold mb-2 text-center w-full whitespace-pre-line break-keep">{mapType.name}</h4>
                  <p className="text-xs text-center w-full text-gray-200 whitespace-pre-line break-keep">{mapType.description}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">문명 수 선택</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 justify-items-center">
              {civCounts.map((count: number) => (
                <button
                  key={count}
                  type="button"
                  className={cn(
                    "rounded-full w-14 h-14 flex items-center justify-center text-lg font-bold border-2 transition-all",
                    selectedCivCount === count
                      ? "bg-blue-600 text-white border-blue-400 scale-110 shadow-lg"
                      : "bg-slate-800 text-blue-200 border-gray-700 hover:border-blue-400 hover:bg-blue-900"
                  )}
                  onClick={() => setSelectedCivCount(count)}
                  aria-label={`${count}개 문명`}
                >
                  {count}
                </button>
              ))}
            </div>
            <p className="text-center text-gray-400 mt-3 text-sm">5~10개 문명 중 선택 (플레이어+AI 포함)</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* 헤더 영역 */}
      <header className="w-full p-4 flex items-center">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2" size={20} />
          {'메인으로 돌아가기'}
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold">텍스트 문명</h1>
        </div>
      </header>

      {/* 단계 표시 */}
      <div className="w-full max-w-4xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-8 relative">
          {[1, 2, 3, 4, 5].map((stepNumber) => (
            <div key={stepNumber} className="flex flex-col items-center z-10">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                step === stepNumber 
                  ? "bg-blue-600" 
                  : step > stepNumber 
                    ? "bg-green-600" 
                    : "bg-gray-700"
              )}>
                {stepNumber}
              </div>
              <span className="text-xs mt-1 text-gray-400">
                {stepNumber === 1 && '게임 모드'}
                {stepNumber === 2 && '난이도'}
                {stepNumber === 3 && '문명'}
                {stepNumber === 4 && '지도 유형'}
                {stepNumber === 5 && '문명 수'}
              </span>
            </div>
          ))}
          <div className="absolute left-0 right-0 h-0.5 bg-gray-700" style={{ top: '20px' }}></div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 p-4 flex flex-col items-center">
        {renderStepContent()}
        
        {/* 이전/다음 버튼 (같은 레벨) */}
        <div className="mt-12 mb-8 w-full max-w-4xl flex justify-between">
          <button
            onClick={goToPreviousStep}
            className="py-3 px-8 rounded-full font-bold flex items-center bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white transition-all"
          >
            <ArrowLeft className="mr-2" size={20} /> 이전
          </button>
          <button
            onClick={goToNextStep}
            disabled={!isCurrentStepSelected() || (step === 4 && !selectedMapType) }
            className={cn(
              "py-3 px-8 rounded-full font-bold flex items-center",
              isCurrentStepSelected()
                ? "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                : "bg-gray-700 cursor-not-allowed opacity-50"
            )}
          >
            {getNextButtonText()}
            {step === 5 ? (
              <PlayCircle className="ml-2" size={20} />
            ) : (
              <ArrowLeft className="ml-2 rotate-180" size={20} />
            )}
          </button>
        </div>
      </main>
    </div>
  );
}