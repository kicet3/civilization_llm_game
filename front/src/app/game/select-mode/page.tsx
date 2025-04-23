"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowLeft, Clock, Calendar, Users, Globe, Wand2, Zap, Award, PlayCircle } from 'lucide-react';

export default function GameModeSelect() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [selectedCivilization, setSelectedCivilization] = useState(null);
  const [step, setStep] = useState(1);

  const gameModes = [
    { id: 'quick', name: '빠른 게임', turns: 100, time: '약 1-2시간', icon: <Zap size={28} /> },
    { id: 'standard', name: '일반 게임', turns: 250, time: '약 3-5시간', icon: <Clock size={28} /> },
    { id: 'marathon', name: '장기 게임', turns: 500, time: '약 8-12시간', icon: <Calendar size={28} /> }
  ];

  const difficulties = [
    { id: 'settler', name: '정착민', description: '게임을 처음 접하는 플레이어를 위한 난이도' },
    { id: 'chieftain', name: '족장', description: '전략 게임에 익숙하지 않은 플레이어를 위한 난이도' },
    { id: 'warlord', name: '장군', description: '균형 잡힌 도전을 원하는 플레이어를 위한 난이도' },
    { id: 'prince', name: '왕자', description: '공정한 경쟁을 원하는 플레이어를 위한 난이도' },
    { id: 'king', name: '왕', description: '도전적인 경험을 원하는 베테랑 플레이어를 위한 난이도' },
    { id: 'emperor', name: '황제', description: '어려운 도전을 원하는 전문가를 위한 난이도' },
    { id: 'immortal', name: '불멸자', description: '극도로 어려운 도전을 원하는 플레이어를 위한 난이도' },
    { id: 'deity', name: '신', description: '거의 불가능한 도전을 원하는 마스터를 위한 난이도' }
  ];

  const civilizations = [
    { id: 'rome', name: '로마', specialty: '군사 확장에 특화', color: 'from-red-700 to-red-900' },
    { id: 'china', name: '중국', specialty: '과학과 경이 건설에 보너스', color: 'from-yellow-700 to-yellow-900' },
    { id: 'egypt', name: '이집트', specialty: '문화와 경이 건설에 특화', color: 'from-amber-700 to-amber-900' },
    { id: 'mongol', name: '몽골', specialty: '기병 유닛과 정복에 강점', color: 'from-green-700 to-green-900' },
    { id: 'england', name: '영국', specialty: '해군과 식민지 확장에 보너스', color: 'from-blue-700 to-blue-900' },
    { id: 'france', name: '프랑스', specialty: '문화와 외교에 특화', color: 'from-indigo-700 to-indigo-900' },
    { id: 'japan', name: '일본', specialty: '군사와 생산에 균형된 능력', color: 'from-rose-700 to-rose-900' },
    { id: 'aztec', name: '아즈텍', specialty: '종교와 인적 자원 활용에 특화', color: 'from-emerald-700 to-emerald-900' }
  ];

  const mapSizes = [
    { id: 'tiny', name: '작은 지도', size: '16x12 타일', players: '최대 4개 문명' },
    { id: 'small', name: '소형 지도', size: '20x15 타일', players: '최대 6개 문명' },
    { id: 'standard', name: '표준 지도', size: '24x18 타일', players: '최대 8개 문명' },
    { id: 'large', name: '대형 지도', size: '30x22 타일', players: '최대 10개 문명' },
    { id: 'huge', name: '거대 지도', size: '36x26 타일', players: '최대 12개 문명' }
  ];

  const victoryTypes = [
    { id: 'all', name: '모든 승리 조건', icon: <Award size={24} /> },
    { id: 'domination', name: '정복 승리', icon: <Award size={24} /> },
    { id: 'cultural', name: '문화 승리', icon: <Award size={24} /> },
    { id: 'scientific', name: '과학 승리', icon: <Award size={24} /> },
    { id: 'diplomatic', name: '외교 승리', icon: <Award size={24} /> }
  ];

  const goToNextStep = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // 게임 시작 페이지로 이동
      router.push('/game');
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
      case 4: return true; // 맵 크기는 기본값이 있으므로 항상 true
      case 5: return true; // 승리 조건도 기본값이 있으므로 항상 true
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">게임 모드 선택</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {gameModes.map((mode) => (
                <div
                  key={mode.id}
                  className={cn(
                    "border-2 rounded-lg p-6 cursor-pointer transition-all transform hover:scale-105",
                    selectedMode === mode.id 
                      ? "border-blue-500 bg-blue-900 bg-opacity-20" 
                      : "border-gray-700 hover:border-gray-500"
                  )}
                  onClick={() => setSelectedMode(mode.id)}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center">
                      {mode.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-center mb-2">{mode.name}</h3>
                  <p className="text-gray-300 text-center mb-1">{mode.turns}턴</p>
                  <p className="text-gray-400 text-center text-sm">{mode.time}</p>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">난이도 선택</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        return (
          <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">문명 선택</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {civilizations.map((civ) => (
                <div
                  key={civ.id}
                  className={cn(
                    "bg-gradient-to-br p-0.5 rounded-lg cursor-pointer transform transition-all hover:scale-105",
                    selectedCivilization === civ.id 
                      ? civ.color 
                      : "from-gray-700 to-gray-900"
                  )}
                  onClick={() => setSelectedCivilization(civ.id)}
                >
                  <div className="bg-gray-800 h-full rounded-lg p-6 flex flex-col items-center justify-center">
                    <h3 className="text-xl font-bold mb-2">{civ.name}</h3>
                    <p className="text-gray-300 text-center text-sm">{civ.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">지도 크기 선택</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mapSizes.map((map, index) => (
                <div
                  key={map.id}
                  className={cn(
                    "border-2 rounded-lg p-6 cursor-pointer transition-all",
                    index === 2  // 기본값으로 표준 지도 선택
                      ? "border-blue-500 bg-blue-900 bg-opacity-20" 
                      : "border-gray-700 hover:border-gray-500"
                  )}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center">
                      <Globe size={28} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-center mb-2">{map.name}</h3>
                  <p className="text-gray-300 text-center mb-1">{map.size}</p>
                  <p className="text-gray-400 text-center text-sm">{map.players}</p>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">승리 조건 선택</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {victoryTypes.map((victory, index) => (
                <div
                  key={victory.id}
                  className={cn(
                    "border-2 rounded-lg p-6 cursor-pointer transition-all",
                    index === 0  // 기본값으로 모든 승리 조건 선택
                      ? "border-blue-500 bg-blue-900 bg-opacity-20" 
                      : "border-gray-700 hover:border-gray-500"
                  )}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center">
                      {victory.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-center">{victory.name}</h3>
                </div>
              ))}
            </div>
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
          onClick={goToPreviousStep}
          className="flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2" size={20} />
          {step === 1 ? '메인으로 돌아가기' : '이전 단계'}
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
                {stepNumber === 4 && '지도'}
                {stepNumber === 5 && '승리 조건'}
              </span>
            </div>
          ))}
          <div className="absolute left-0 right-0 h-0.5 bg-gray-700" style={{ top: '20px' }}></div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 p-4 flex flex-col items-center">
        {renderStepContent()}
        
        {/* 다음 버튼 */}
        <div className="mt-12 mb-8 w-full max-w-4xl flex justify-end">
          <button
            onClick={goToNextStep}
            disabled={!isCurrentStepSelected()}
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