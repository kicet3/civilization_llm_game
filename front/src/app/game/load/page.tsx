"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Play, 
  Folder, 
  X, 
  Server, 
  Star 
} from 'lucide-react';

// 게임 저장 데이터 인터페이스
interface SavedGame {
  id: string;
  name: string;
  civilization: string;
  turn: number;
  timestamp: string;
}

export default function GameLoadPage() {
  const router = useRouter();
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // 저장된 게임 목록 불러오기
  useEffect(() => {
    const fetchSavedGames = async () => {
      try {
        // TODO: 실제 저장된 게임 API 연동
        const response = await fetch('/game/saved-games');
        if (response.ok) {
          const games: SavedGame[] = await response.json();
          setSavedGames(games);
        } else {
          console.error('저장된 게임 목록 불러오기 실패');
        }
      } catch (error) {
        console.error('게임 목록 로딩 중 오류:', error);
      }
    };

    fetchSavedGames();
  }, []);

  // 게임 불러오기 핸들러
  const handleLoadGame = async () => {
    if (!selectedGame) return;

    try {
      // TODO: 실제 게임 불러오기 API 연동
      const response = await fetch(`/game/load/${selectedGame}`, {
        method: 'POST',
      });

      if (response.ok) {
        // 게임 페이지로 이동
        router.push('/game');
      } else {
        alert('게임 불러오기 실패');
      }
    } catch (error) {
      console.error('게임 불러오기 오류:', error);
      alert('게임 불러오기 중 오류가 발생했습니다.');
    }
  };

  // 새 게임 시작하기
  const handleNewGame = () => {
    router.push('/game/select-mode');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
      <div className="w-full max-w-2xl p-8 space-y-8 bg-slate-800 rounded-xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">게임 선택</h1>
          <p className="text-gray-400">기존 게임을 불러오거나 새 게임을 시작하세요.</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 저장된 게임 목록 */}
          <div className="bg-slate-900 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-lg flex items-center">
                <Folder size={20} className="mr-2" /> 저장된 게임
              </h2>
              <span className="text-sm text-gray-400">총 {savedGames.length}개</span>
            </div>
            {savedGames.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                저장된 게임이 없습니다.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {savedGames.map((game) => (
                  <div
                    key={game.id}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer flex items-center justify-between transition-colors",
                      selectedGame === game.id 
                        ? "bg-blue-900 border border-blue-600" 
                        : "bg-slate-800 hover:bg-slate-700"
                    )}
                    onClick={() => setSelectedGame(game.id)}
                  >
                    <div>
                      <div className="font-bold flex items-center">
                        <Star size={16} className="mr-2 text-yellow-400" />
                        {game.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {game.civilization} | {game.turn}턴 | {game.timestamp}
                      </div>
                    </div>
                    {selectedGame === game.id && (
                      <X size={16} className="text-red-400" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 게임 선택 및 조작 패널 */}
          <div className="space-y-4">
            <button
              onClick={handleLoadGame}
              disabled={!selectedGame}
              className={cn(
                "w-full p-4 rounded-lg font-bold flex items-center justify-center space-x-2 transition-colors",
                selectedGame
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-slate-700 text-gray-500 cursor-not-allowed"
              )}
            >
              <Server size={20} />
              <span>선택한 게임 불러오기</span>
            </button>

            <div className="border-t border-slate-700 my-4"></div>

            <button
              onClick={handleNewGame}
              className="w-full p-4 rounded-lg bg-green-600 hover:bg-green-700 font-bold flex items-center justify-center space-x-2"
            >
              <Play size={20} />
              <span>새 게임 시작하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}