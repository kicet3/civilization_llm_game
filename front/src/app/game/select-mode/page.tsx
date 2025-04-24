"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import gameService from '@/services/gameService';
import { 
  MapType, 
  Difficulty, 
  Civilization, 
  GameMode, 
  VictoryType
} from '@/types/game';
import { 
  ArrowLeft, Clock, Calendar, Users, Globe, Wand2, Zap, Award, PlayCircle, Map, Star, User, Sword,
  Save, Loader2, XCircle, CheckCircle, Lock, Database, School, Castle, BookOpen, Milestone, Mountain,
  Crown, GraduationCap, Library, Landmark, Shell, Ship, Sparkles
} from 'lucide-react';
import authService from '@/services/authService';
import crypto from 'crypto';

interface SavedGame {
  id: string;
  name: string;
  date: string;
  turn: number;
  civName?: string;
  mapType: string;
}

export default function GameModeSelect() {
  const router = useRouter();
  
  // 게임 선택 상태
  const [selectedMode, setSelectedMode] = useState<string | null>('short');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>('easy');
  const [selectedCivilization, setSelectedCivilization] = useState<string | null>('korea');
  const [selectedMapType, setSelectedMapType] = useState<string | null>('small_continents');
  const [selectedCivCount, setSelectedCivCount] = useState<number>(6);
  const [step, setStep] = useState(1);

  // 게임 옵션 상태
  const [mapTypes, setMapTypes] = useState<MapType[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [civilizations, setCivilizations] = useState<Civilization[]>([]);
  const [gameModes, setGameModes] = useState<GameMode[]>([]);
  const [victoryTypes, setVictoryTypes] = useState<VictoryType[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // 로드 게임 관련 상태
  const [showInitialChoice, setShowInitialChoice] = useState(true);
  const [loadGameMode, setLoadGameMode] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // 새로운 상태 - 사용자 이름
  const [playerName, setPlayerName] = useState('');

  // 문명 수 선택 옵션 (5~10, 6개)
  const civCounts: number[] = Array.from({ length: 6 }, (_, i) => i + 5); // [5,6,...,10]

  // 문명 타입 정의
  const civTypes = [
    { type: 'military', name: '군사', color: 'from-red-700 to-red-900', icon: <Sword size={24} /> },
    { type: 'culture', name: '문화', color: 'from-pink-700 to-pink-900', icon: <Library size={24} /> },
    { type: 'science', name: '과학', color: 'from-blue-700 to-blue-900', icon: <GraduationCap size={24} /> },
    { type: 'economic', name: '경제', color: 'from-yellow-700 to-yellow-900', icon: <Landmark size={24} /> },
    { type: 'expansion', name: '확장', color: 'from-green-700 to-green-900', icon: <Globe size={24} /> },
    { type: 'naval', name: '해상', color: 'from-cyan-700 to-cyan-900', icon: <Ship size={24} /> },
    { type: 'religious', name: '종교', color: 'from-purple-700 to-purple-900', icon: <Milestone size={24} /> },
    { type: 'defensive', name: '방어', color: 'from-indigo-700 to-indigo-900', icon: <Castle size={24} /> },
  ];

  // 각 문명에 타입 할당 (백엔드에서 제공하지 않는 경우)
  const civTypeMap: Record<string, string> = {
    'america': 'expansion',
    'arabia': 'economic',
    'assyria': 'military',
    'aztec': 'military',
    'babylon': 'science',
    'brazil': 'culture',
    'china': 'science',
    'egypt': 'culture',
    'england': 'naval',
    'ethiopia': 'defensive',
    'france': 'culture',
    'germany': 'military',
    'greece': 'military',
    'inca': 'expansion',
    'india': 'religious',
    'japan': 'military',
    'korea': 'science',
    'maya': 'science',
    'mongolia': 'military',
    'ottoman': 'naval',
    'persia': 'culture',
    'poland': 'expansion',
    'rome': 'military',
    'russia': 'expansion',
    'shoshone': 'expansion',
    'siam': 'economic',
    'venice': 'economic'
  };
  // 새 게임 시작하기
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [registrationType, setRegistrationType] = useState<'login' | 'register'>('login');
  const [userId, setUserId] = useState<string | null>(null);

  // 사용자 등록 또는 로그인 핸들러
  const handleUserAuth = async () => {
    // 입력 유효성 검사
    if (!userName.trim()) {
      setErrorMessage('사용자 이름을 입력해주세요.');
      return;
    }
    
    if (!password.trim()) {
      setErrorMessage('비밀번호를 입력해주세요.');
      return;
    }
    
    if (registrationType === 'register') {
      if (!email.trim()) {
        setErrorMessage('이메일을 입력해주세요.');
        return;
      }
      
      if (password.length < 6) {
        setErrorMessage('비밀번호는 최소 6자 이상이어야 합니다.');
        return;
      }
    }
  
    try {
      setIsLoading(true);
      setErrorMessage('');
  
      let authResponse;
  
      if (registrationType === 'register') {
        // 새 사용자 등록
        authResponse = await authService.registerUser({
          username: userName,
          password,
          email
        });
      } else {
        // 기존 사용자 로그인
        authResponse = await authService.loginUser({
          username: userName,
          password
        });
      }
  
      // 토큰 저장
      authService.saveToken(authResponse.token);
      
      // userId 상태 설정
      setUserId(authResponse.userId);
  
      // 성공 시 다음 단계로 이동
      setShowInitialChoice(false);
      setLoadGameMode(false);
      setStep(1);
    } catch (error) {
      // 에러 처리
      const errorMessage = error instanceof Error 
        ? error.message 
        : '인증 과정에서 오류가 발생했습니다.';
      
      setErrorMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 게임 시작
  const handleStartGame = () => {
    // 사용자 이름이 제공되었는지 확인
    if (!playerName.trim()) {
      setErrorMessage('사용자 이름을 입력해주세요.');
      return;
    }

    // SHA-256 해시 생성 
    const hashedUserId = crypto.createHash('sha256').update(playerName).digest('hex');

    // 게임 페이지로 이동 (해시화된 userId와 함께)
    const params: Record<string, string> = { userId: hashedUserId };
    if (selectedMode) params.mode = selectedMode;
    if (selectedDifficulty) params.difficulty = selectedDifficulty;
    if (selectedCivilization) params.civ = selectedCivilization;
    if (selectedMapType) params.map = selectedMapType;
    if (selectedCivCount) params.civCount = String(selectedCivCount);

    const paramString = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    router.push(`/game${paramString ? `?${paramString}` : ''}`);
  };


  // 문명에 색상 할당 (백엔드에서 제공하지 않는 경우)
  const civColorMap: Record<string, string> = {
    'korea': 'from-blue-700 to-blue-900',
    'japan': 'from-red-700 to-red-900',
    'china': 'from-yellow-700 to-yellow-900',
    'mongolia': 'from-green-700 to-green-900',
    'india': 'from-orange-700 to-orange-900',
    'persia': 'from-purple-700 to-purple-900',
    'arabia': 'from-emerald-700 to-emerald-900',
    'egypt': 'from-amber-700 to-amber-900',
    'greece': 'from-sky-700 to-sky-900',
    'rome': 'from-rose-700 to-rose-900',
    'america': 'from-indigo-700 to-indigo-900',
    'germany': 'from-gray-700 to-gray-900',
    'russia': 'from-red-700 to-red-900',
    'france': 'from-blue-700 to-blue-900',
    'england': 'from-red-600 to-blue-900',
    'aztec': 'from-emerald-700 to-emerald-900',
    'babylon': 'from-amber-700 to-amber-900',
    'assyria': 'from-orange-700 to-orange-900',
    'brazil': 'from-green-700 to-green-900',
    'ethiopia': 'from-lime-700 to-lime-900',
    'inca': 'from-yellow-700 to-yellow-900',
    'maya': 'from-teal-700 to-teal-900',
    'poland': 'from-red-700 to-white-900',
    'ottoman': 'from-red-700 to-red-900',
    'shoshone': 'from-amber-700 to-amber-900',
    'siam': 'from-yellow-700 to-red-900',
    'venice': 'from-indigo-700 to-indigo-900'
  };

  // 게임 옵션 로드
  useEffect(() => {
    const loadGameOptions = async () => {
      try {
        setIsLoadingOptions(true);
        setOptionsError(null);
        
        // 백엔드에서 게임 옵션 가져오기
        const options = await gameService.getGameOptions();
        
        // 백엔드 응답이 다른 형식으로 올 수 있으므로 파싱
        setGameModes(Array.isArray(options.gameModes) ? options.gameModes : []);
        setMapTypes(Array.isArray(options.mapTypes) ? options.mapTypes : []);
        setCivilizations(Array.isArray(options.civilizations) ? options.civilizations : []);
        setDifficulties(Array.isArray(options.difficulties) ? options.difficulties : []);
        setVictoryTypes(Array.isArray(options.victoryTypes) ? options.victoryTypes : []);
        
        // 백엔드에서 데이터를 모두 받아왔는지 확인
        if (options.gameModes?.length === 0 && options.civilizations?.length === 0) {
          console.warn("백엔드 API 응답에 일부 데이터가 비어있습니다.");
        }
        
        setIsLoadingOptions(false);
      } catch (error) {
        console.error('게임 옵션 로드 실패:', error);
        setOptionsError('게임 옵션을 불러오는 데 실패했습니다. 다시 시도해주세요.');
        setIsLoadingOptions(false);
      }
    };

    loadGameOptions();
  }, []);

  // 로드 게임 관련 함수
  const handleLoadGame = () => {
    setIsLoading(true);
    setErrorMessage("");
    
    // 저장된 게임들을 로컬 스토리지에서 가져오는 로직으로 변경
    try {
      // 로컬 스토리지에서 저장된 게임 불러오기
      const savedGamesStr = localStorage.getItem('savedGames') || '[]';
      const savedGamesData = JSON.parse(savedGamesStr);
      
      if (savedGamesData.length === 0) {
        setErrorMessage("저장된 게임이 없습니다.");
      } else {
        setSavedGames(savedGamesData);
      }
    } catch (error) {
      console.error("Failed to load saved games:", error);
      setErrorMessage("저장된 게임을 불러오는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 선택한 저장 게임 불러오기
  const handleLoadSelectedGame = () => {
    if (!selectedGameId) {
      setErrorMessage("먼저 저장된 게임을 선택해주세요.");
      return;
    }

    setIsLoading(true);
    
    try {
      // 로컬 스토리지에서 저장된 게임 ID 기반으로 게임 정보 불러오기
      // 실제 구현에서는 서버 API를 호출하여 저장된 게임을 불러올 수 있음
      router.push(`/game?loadGameId=${selectedGameId}`);
    } catch (error) {
      console.error("Failed to load selected game:", error);
      setErrorMessage("선택한 게임을 불러오는 데 실패했습니다.");
      setIsLoading(false);
    }
  };

  // 새 게임 시작하기
  const handleStartNewGame = () => {
    setShowInitialChoice(false);
    setLoadGameMode(false);
    setStep(1);
  };

  const handleShowLoadGame = () => {
    setShowInitialChoice(false);
    setLoadGameMode(true);
    setRegistrationType('login');
  };

  const goToNextStep = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      handleStartGame();
    }
  };

  const goToPreviousStep = () => {
    if (loadGameMode || (step === 1 && !showInitialChoice)) {
      // 로드 게임 모드이거나, 1단계에서 뒤로가면 초기 선택으로 돌아감
      setShowInitialChoice(true);
      setLoadGameMode(false);
      setErrorMessage("");
      setPlayerName("");
      setSavedGames([]);
      setSelectedGameId(null);
    } else if (step > 1) {
      setStep(step - 1);
    } else {
      // 메인 페이지로 돌아가기
      router.push('/');
    }
  };

  // 현재 단계에 따른 버튼 텍스트
  const getNextButtonText = () => {
    if (loadGameMode) return '선택한 게임 불러오기';
    if (step === 6) return '게임 시작';
    return '다음';
  };

  // 단계별 선택 여부 확인
  const isCurrentStepSelected = () => {
    if (loadGameMode) return selectedGameId !== null || (savedGames.length === 0 && playerName);
    
    switch (step) {
      case 1: return !!playerName;
      case 2: return !!selectedMode;
      case 3: return !!selectedDifficulty;
      case 4: return !!selectedCivilization;
      case 5: return !!selectedMapType;
      case 6: return !!selectedCivCount;
      default: return false;
    }
  };

  // 문명 타입에 따른 아이콘 반환
  const getCivTypeIcon = (civId: string) => {
    const type = civTypeMap[civId] || 'expansion';
    const civType = civTypes.find(ct => ct.type === type);
    return civType?.icon || <Star size={20} />;
  };

  // 문명 타입에 따른 색상 반환
  const getCivTypeColor = (civId: string) => {
    return civColorMap[civId] || 'from-gray-700 to-gray-900';
  };

  // 초기 선택 화면 렌더링
  const renderInitialChoice = () => {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-6">
        <h2 className="text-3xl font-bold mb-8 text-center">게임 모드를 선택하세요</h2>
        
        <div className="w-full max-w-xl grid grid-cols-1 gap-6">
          <button 
            onClick={handleStartNewGame}
            className="h-20 flex items-center justify-center bg-gradient-to-r from-blue-800 to-blue-600 rounded-xl shadow-lg border border-blue-500 hover:from-blue-700 hover:to-blue-500 transition-all"
          >
            <PlayCircle className="mr-3" size={24} />
            <span className="text-xl font-bold">새 게임 시작하기</span>
          </button>
          
          <button 
            onClick={() => {
              setShowInitialChoice(false);
              setLoadGameMode(true);
              handleLoadGame();
            }}
            className="h-20 flex items-center justify-center bg-gradient-to-r from-slate-800 to-slate-600 rounded-xl shadow-lg border border-slate-500 hover:from-slate-700 hover:to-slate-500 transition-all"
          >
            <Save className="mr-3" size={24} />
            <span className="text-xl font-bold">저장된 게임 불러오기</span>
          </button>
        </div>
      </div>
    );
  };

  // 게임 불러오기 화면 렌더링
  const renderLoadGame = () => {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">저장된 게임 불러오기</h2>
        
        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-500 rounded-md text-center text-red-300 flex items-center justify-center">
            <XCircle size={20} className="mr-2" />
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
            <p className="text-xl">저장된 게임을 불러오는 중...</p>
          </div>
        ) : savedGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-xl mb-6">저장된 게임이 없습니다.</p>
            
            <div className="max-w-md w-full">
              <div className="mb-6">
                <label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-1">플레이어 이름</label>
                <input 
                  type="text" 
                  id="playerName" 
                  value={playerName} 
                  onChange={(e) => setPlayerName(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-lg"
                  placeholder="게임에서 사용할 이름을 입력하세요"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {savedGames.map((game: SavedGame) => (
              <div
                key={game.id}
                className={cn(
                  "border-2 rounded-lg p-4 cursor-pointer transition-all",
                  selectedGameId === game.id 
                    ? "border-blue-500 bg-blue-900 bg-opacity-20" 
                    : "border-gray-700 hover:border-gray-500"
                )}
                onClick={() => setSelectedGameId(game.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">{game.name}</h3>
                    <p className="text-gray-400 text-sm">{game.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-300">턴 {game.turn}</p>
                    <p className="text-xs text-gray-400">{game.mapType}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    // 로딩 중일 때 스피너 표시
    if (isLoadingOptions && !optionsError) {
      return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
          <p className="text-xl">게임 옵션을 불러오는 중...</p>
        </div>
      );
    }
    
    // 초기 선택 화면
    if (showInitialChoice) {
      return renderInitialChoice();
    }
    
    // 게임 불러오기 화면
    if (loadGameMode) {
      return renderLoadGame();
    }
    
   // 새 게임 시작 화면 (6단계)
   switch (step) {
    case 1:
      return (
        <div className="w-full max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">사용자 이름 입력</h2>
          
          {/* 에러 메시지 */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-500 rounded-md text-center text-red-300 flex items-center justify-center">
              <XCircle size={20} className="mr-2" />
              {errorMessage}
            </div>
          )}
          
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-1">플레이어 이름</label>
              <input 
                type="text" 
                id="playerName" 
                value={playerName} 
                onChange={(e) => setPlayerName(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-lg"
                placeholder="게임에서 사용할 이름을 입력하세요"
              />
            </div>
            <p className="text-gray-400 text-sm text-center">
              입력한 이름은 게임 내에서 플레이어를 식별하는 데 사용됩니다.
            </p>
          </div>
        </div>
      );
    case 2:
      return (
        <div className="w-full max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">게임 모드 선택</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gameModes.filter(gameMode => gameMode.id === 'short').map((gameMode) => (
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
                    {gameMode.id === 'short' && <Zap size={28} />}
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{gameMode.name}</h3>
                <p className="text-gray-400 text-sm mb-2">{gameMode.estimatedTime}</p>
                <p className="text-xs text-gray-300">{gameMode.description}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case 3:
      return (
        <div className="w-full max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">난이도 선택</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {difficulties.filter(difficulty => difficulty.id === 'easy').map((difficulty) => (
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
    case 4:
      return (
        <div className="w-full max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">문명 선택</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {civilizations.filter(civ => civ.id === 'korea').map((civ) => (
              <div
                key={civ.id}
                className={cn(
                  "border-2 rounded-lg p-6 cursor-pointer transition-all flex flex-col items-start",
                  selectedCivilization === civ.id
                    ? "border-blue-500 bg-blue-900 bg-opacity-20"
                    : "border-gray-700 hover:border-gray-500"
                )}
                onClick={() => setSelectedCivilization(civ.id)}
                tabIndex={0}
                role="button"
                aria-label={civ.name + ' 선택'}
              >
                <div className="flex items-center justify-center mb-4 w-full">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getCivTypeColor(civ.id)} flex items-center justify-center`}>
                    {getCivTypeIcon(civ.id)}
                  </div>
                </div>
                <h4 className="text-lg font-bold mb-2 text-left w-full">{civ.name}</h4>
                <ul className="text-xs text-left w-full space-y-1">
                  <li><span className="font-semibold">지도자:</span> {civ.leader}</li>
                  <li><span className="font-semibold">부가 효과:</span> {civ.specialAbility}</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      );
    case 5:
      return (
        <div className="w-full max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">지도 유형 선택</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center w-full">
            {mapTypes.filter(mapType => mapType.id === 'small_continents').map((mapType) => (
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
    case 6:
      return (
        <div className="w-full max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">문명 수 선택</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 justify-items-center">
            {[6].map((count: number) => (
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
          <p className="text-center text-gray-400 mt-3 text-sm">현재 6개의 문명만 선택 가능 합니다.</p>
        </div>
      );
    default:
      return null;
  }
};

const handleNextButtonClick = () => {
  if (loadGameMode && savedGames.length > 0) {
    handleLoadSelectedGame();
  } else if (loadGameMode && savedGames.length === 0) {
    handleLoadGame();
  } else {
    goToNextStep();
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
        {showInitialChoice ? '메인으로 돌아가기' : '이전으로 돌아가기'}
      </button>
      <div className="flex-1 text-center">
        <h1 className="text-2xl font-bold">문명</h1>
      </div>
    </header>

    {/* 단계 표시 (로드 게임 모드이거나 초기 선택 화면에서는 표시 안함) */}
    {!loadGameMode && !showInitialChoice && (
      <div className="w-full max-w-4xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-8 relative">
          {[1, 2, 3, 4, 5, 6].map((stepNumber) => (
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
                {stepNumber === 1 && '플레이어 이름'}
                {stepNumber === 2 && '게임 모드'}
                {stepNumber === 3 && '난이도'}
                {stepNumber === 4 && '문명'}
                {stepNumber === 5 && '지도 유형'}
                {stepNumber === 6 && '문명 수'}
              </span>
            </div>
          ))}
          <div className="absolute left-0 right-0 h-0.5 bg-gray-700" style={{ top: '20px' }}></div>
        </div>
      </div>
    )}

    {/* 메인 콘텐츠 영역 */}
    <main className="flex-1 p-4 flex flex-col items-center">
      {renderStepContent()}
      
      {/* 이전/다음 버튼 */}
      <div className="mt-12 mb-8 w-full max-w-4xl flex justify-between">
        <button
          onClick={goToPreviousStep}
          className="py-3 px-8 rounded-full font-bold flex items-center bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white transition-all"
        >
          <ArrowLeft className="mr-2" size={20} /> 이전
        </button>
        
        {/* 다음 버튼 */}
        <button
          onClick={handleNextButtonClick}
          disabled={!isCurrentStepSelected() || isLoading || isLoadingOptions}
          className={cn(
            "py-3 px-8 rounded-full font-bold flex items-center",
            isCurrentStepSelected() && !isLoading && !isLoadingOptions
              ? "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
              : "bg-gray-700 cursor-not-allowed opacity-50"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 animate-spin" size={20} />
              처리 중...
            </>
          ) : (
            <>
              {getNextButtonText()}
              {loadGameMode || step === 6 ? (
                <PlayCircle className="ml-2" size={20} />
              ) : (
                <ArrowLeft className="ml-2 rotate-180" size={20} />
              )}
            </>
          )}
        </button>
      </div>
    </main>
  </div>
);
}