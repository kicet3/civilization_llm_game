"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import gameService from '@/services/gameService';
import { 
  ArrowLeft, Clock, Calendar, Users, Globe, Wand2, Zap, Award, PlayCircle, Map, Star, User, Sword 
} from 'lucide-react';

export default function GameModeSelect() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedCivilization, setSelectedCivilization] = useState<string | null>(null);
  const [selectedMapType, setSelectedMapType] = useState<string | null>(null);
  const [selectedCivCount, setSelectedCivCount] = useState<number | null>(null);
  const [step, setStep] = useState(1);

  // 게임 옵션 상태
  const [mapTypes, setMapTypes] = useState<{ id: string; name: string; description: string }[]>([]);
  const [difficulties, setDifficulties] = useState<{ id: string; name: string; description: string }[]>([]);

  // 문명 수 선택 (5~10, 6개)
  const civCounts: number[] = Array.from({ length: 6 }, (_, i) => i + 5); // [5,6,...,10]

  const gameModes = [
    { id: 'short', name: '짧은 게임', turns: 50, time: '약 30분~1시간', icon: <Zap size={28} /> },
    { id: 'medium', name: '표준 게임', turns: 100, time: '약 1-2시간', icon: <Clock size={28} /> },
    { id: 'long', name: '긴 게임', turns: 250, time: '약 3-5시간', icon: <Calendar size={28} /> }
  ];

  const civilizations = [
    { id: 'korea', name: '한국', leader: '세종대왕', ability: '과학 관련 위대한 인물 생성 보너스', unit: '거북선', building: '학문소', color: 'from-blue-800 to-blue-900', icon: <Star size={28} /> },
    { id: 'japan', name: '일본', leader: '오다 노부나가', ability: '유닛 체력 1까지 피해 감소 없음', unit: '사무라이', building: '도조', color: 'from-rose-700 to-rose-900', icon: <Sword size={28} /> },
    { id: 'china', name: '중국', leader: '무측천', ability: '위대한 장군 생성 보너스', unit: '중기병', building: '장성', color: 'from-yellow-700 to-yellow-900', icon: <Star size={28} /> },
    { id: 'mongol', name: '몽골', leader: '칭기즈 칸', ability: '도시국가 공격에 보너스', unit: '카사르', building: '없음', color: 'from-green-700 to-green-900', icon: <Sword size={28} /> },
    { id: 'india', name: '인도', leader: '간디', ability: '인구가 많을수록 행복도에 패널티 감소', unit: '전사 코끼리', building: '없음', color: 'from-lime-700 to-lime-900', icon: <User size={28} /> },
    { id: 'aztec', name: '아즈텍', leader: '몬테수마', ability: '적 유닛 처치 시 문화 획득', unit: '재규어 전사', building: '없음', color: 'from-emerald-700 to-emerald-900', icon: <User size={28} /> },
  ];

  const victoryTypes = [
    { id: 'all', name: '모든 승리 조건', icon: <Award size={24} /> },
    { id: 'domination', name: '정복 승리', icon: <Sword size={24} /> },
    { id: 'cultural', name: '문화 승리', icon: <Star size={24} /> },
    { id: 'scientific', name: '과학 승리', icon: <Wand2 size={24} /> },
    { id: 'diplomatic', name: '외교 승리', icon: <Users size={24} /> }
  ];

  // 게임 옵션 로드
  useEffect(() => {
    const loadGameOptions = async () => {
      try {
        const options = await gameService.getGameOptions();
        setMapTypes(options.mapTypes);
        setDifficulties(options.difficulties);
      } catch (error) {
        console.error('게임 옵션 로드 실패:', error);
      }
    };

    loadGameOptions();
  }, []);

  const goToNextStep = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // 게임 시작 페이지로 이동 (선택값 전달)
      const params: Record<string, string> = {};
      if (selectedMode) params.mode = selectedMode;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      if (selectedCivilization) params.civ = selectedCivilization;
      if (selectedMapType) params.map = selectedMapType;
      if (selectedCivCount) params.civCount = String(selectedCivCount);

      const paramString = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');

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
  const getHexStyle = (index: number, total: number) => {
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
          const type = 'asia'; // 예시 코드에서는 CIV_TYPE_MAP이 정의되지 않아 임시로 'asia'로 설정
          if (!civsByType[type]) civsByType[type] = [];
          civsByType[type].push(civ);
        });
        return (
          <div className="w-full max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">문명 선택</h2>
            <div className="space-y-10">
              {Object.keys(civsByType).map(type => (
                civsByType[type] && civsByType[type].length > 0 && (
                  <div key={type}>
                    <h3 className={`text-2xl font-semibold mb-4 pl-2 text-left`}>{type} 문명</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {civsByType[type].map((civ) => (
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
      case 4:
        return (
          <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-center">지도 유형 선택</h2>
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
                      <Map size={28} />
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