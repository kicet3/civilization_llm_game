"use client";

import React, { useState, useEffect } from "react";
import Toast from "./ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronRight, Clock, AlertTriangle, Calendar, Crown, Star, Zap } from "lucide-react";

// 턴 단계 타입
export type TurnPhase = "player" | "ai" | "resolve";

// 이벤트 타입
interface TurnEvent {
  type: 'discovery' | 'combat' | 'diplomacy' | 'city' | 'research' | 'natural';
  content: string;
  importance: 'low' | 'medium' | 'high';
}

export interface TurnManagerProps {
  children?: React.ReactNode;
  turn: number;
  phase: TurnPhase;
  onEndTurn: () => Promise<void>;
  events: { type: string; content: string; turn: number }[];
  updateGameData?: () => Promise<void>;
}

export default function TurnManager({ 
  children, 
  turn, 
  phase, 
  onEndTurn,
  events = [],
  updateGameData
}: TurnManagerProps) {
  // 토스트 메시지 상태
  const [toast, setToast] = useState<{ message: string; show: boolean; type?: string }>({ message: '', show: false });
  
  // 이펙트 상태(간단한 예시: 도시 성장/유닛 진급 등)
  const [effect, setEffect] = useState<string | null>(null);
  
  // 로그 메시지
  const [log, setLog] = useState<string[]>([]);
  
  // 이벤트 처리
  useEffect(() => {
    // 새 이벤트가 발생하면 로그에 추가
    if (events.length > 0) {
      const newLogs = events.map(event => event.content);
      setLog(prev => [...prev, ...newLogs]);
      
      // 중요한 이벤트는 이펙트로 표시
      const importantEvent = events.find(event => 
        event.content.includes('도시') || 
        event.content.includes('전투') || 
        event.content.includes('발견')
      );
      
      if (importantEvent) {
        if (importantEvent.content.includes('도시')) {
          setEffect("city-growth");
          showToast(importantEvent.content);
        } else if (importantEvent.content.includes('전투')) {
          setEffect("combat");
          showToast(importantEvent.content);
        } else if (importantEvent.content.includes('발견')) {
          setEffect("discovery");
          showToast(importantEvent.content);
        }
        
        // 이펙트는 일정 시간 후 자동으로 사라짐
        setTimeout(() => setEffect(null), 2000);
      }
    }
  }, [events]);

  // 턴 변경 감지
  useEffect(() => {
    setLog(prev => [...prev, `턴 ${turn} 시작`]);
  }, [turn]);

  // Toast 메시지 노출 함수
  function showToast(message: string, duration = 3000) {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), duration);
  }

  // 턴 종료 핸들러
  const handleEndTurn = async () => {
    if (phase !== 'player') return;
    
    try {
      setToast({
        message: '턴 종료 중...',
        show: true,
        type: 'info'
      });
      
      // 턴 종료 전 게임 데이터 업데이트
      if (updateGameData) {
        try {
          await updateGameData();
        } catch (error) {
          console.error('턴 종료 전 데이터 업데이트 실패:', error);
        }
      }
      
      await onEndTurn();
      
      // 효과 애니메이션 표시
      setEffect('end-turn');
      setTimeout(() => setEffect(null), 2000);
      
      // 토스트 숨기기
      setToast({
        message: '',
        show: false
      });
    } catch (error) {
      console.error('턴 종료 처리 중 오류:', error);
      setToast({
        message: '턴 종료 처리 중 오류가 발생했습니다.',
        show: true,
        type: 'error'
      });
    }
  };

  // 턴 숫자에 따른 연도 계산
  const calculateYear = () => {
    if (turn <= 100) {
      // 고대: 턴당 40년
      return 4000 - (turn * 40);
    } else if (turn <= 200) {
      // 중세: 턴당 20년
      return 4000 - (100 * 40) - ((turn - 100) * 20);
    } else {
      // 산업/현대: 턴당 5년
      return 4000 - (100 * 40) - (100 * 20) - ((turn - 200) * 5);
    }
  };

  const year = calculateYear();
  const yearDisplay = year < 0 ? `BC ${Math.abs(year)}` : `AD ${year}`;

  return (
    <div className="relative w-full h-full flex flex-col p-4 bg-slate-900">
      {/* Toast 메시지 상단 노출 */}
      <Toast 
        message={toast.message} 
        show={toast.show} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
      
      {/* 턴 정보 헤더 */}
      <div className="flex justify-between items-center mb-6 bg-slate-800 p-3 rounded-lg">
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <Clock className="mr-2 text-blue-400" size={20} />
            <span className="font-bold">턴: {turn}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="mr-2 text-green-400" size={20} />
            <span>{yearDisplay}</span>
          </div>
        </div>
        
        {/* 턴 단계 표시 */}
        <div className="flex items-center px-3 py-1 rounded-full bg-slate-700">
          <span className={cn(
            "h-2 w-2 rounded-full mr-2",
            phase === "player" ? "bg-green-500" : 
            phase === "ai" ? "bg-yellow-500" : 
            "bg-blue-500"
          )}></span>
          <span className="text-sm">
            {phase === "player" ? "플레이어 차례" : 
             phase === "ai" ? "AI 진행 중" : 
             "턴 종료 처리 중"}
          </span>
        </div>
        
        {/* 턴 종료 버튼 */}
        <button 
          onClick={handleEndTurn} 
          disabled={phase !== "player"} 
          className={cn(
            "flex items-center px-4 py-2 rounded-lg transition-all",
            phase === "player" 
              ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
              : "bg-gray-600 text-gray-300 cursor-not-allowed"
          )}
        >
          <ChevronRight size={20} className="mr-1" />
          턴 종료
        </button>
      </div>
      
      {/* 액션 아이콘 단축키 */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        <div className="bg-slate-800 rounded-lg p-3 flex flex-col items-center cursor-pointer hover:bg-slate-700">
          <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center mb-2">
            <Star size={20} className="text-blue-300" />
          </div>
          <span className="text-xs">과학 관리</span>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 flex flex-col items-center cursor-pointer hover:bg-slate-700">
          <div className="w-10 h-10 rounded-full bg-red-900 flex items-center justify-center mb-2">
            <Zap size={20} className="text-red-300" />
          </div>
          <span className="text-xs">생산 가속</span>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 flex flex-col items-center cursor-pointer hover:bg-slate-700">
          <div className="w-10 h-10 rounded-full bg-green-900 flex items-center justify-center mb-2">
            <Crown size={20} className="text-green-300" />
          </div>
          <span className="text-xs">황금기 선언</span>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 flex flex-col items-center cursor-pointer hover:bg-slate-700">
          <div className="w-10 h-10 rounded-full bg-yellow-900 flex items-center justify-center mb-2">
            <AlertTriangle size={20} className="text-yellow-300" />
          </div>
          <span className="text-xs">외교 선언</span>
        </div>
        <div className="bg-slate-800 rounded-lg p-3 flex flex-col items-center cursor-pointer hover:bg-slate-700">
          <div className="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center mb-2">
            <Star size={20} className="text-purple-300" />
          </div>
          <span className="text-xs">문화 투자</span>
        </div>
      </div>
      
      {/* 턴 이벤트 표시 영역 */}
      <div className="bg-slate-800 p-4 rounded-lg flex-1 mb-4 overflow-y-auto flex flex-col">
        <h3 className="text-lg font-bold mb-3 border-b border-slate-700 pb-2">최근 이벤트</h3>
        {log.length === 0 ? (
          <div className="text-gray-400 text-center py-10">아직 이벤트가 없습니다</div>
        ) : (
          <div className="space-y-2">
            {log.slice().reverse().map((entry, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "p-3 rounded-lg transition-all",
                  idx === 0 ? "bg-slate-700" : "bg-slate-800 hover:bg-slate-700"
                )}
              >
                <div className="flex items-start">
                  {entry.includes('도시') && (
                    <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center mr-3 flex-shrink-0">
                      <Crown size={18} className="text-green-300" />
                    </div>
                  )}
                  {entry.includes('발견') && (
                    <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center mr-3 flex-shrink-0">
                      <Star size={18} className="text-blue-300" />
                    </div>
                  )}
                  {entry.includes('전투') && (
                    <div className="w-8 h-8 rounded-full bg-red-900 flex items-center justify-center mr-3 flex-shrink-0">
                      <Zap size={18} className="text-red-300" />
                    </div>
                  )}
                  {!entry.includes('도시') && !entry.includes('발견') && !entry.includes('전투') && (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center mr-3 flex-shrink-0">
                      <Clock size={18} className="text-slate-300" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-300">{entry}</div>
                    <div className="text-xs text-gray-500 mt-1">턴 {turn}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 턴 통계 영역 */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <h3 className="text-lg font-bold mb-3 border-b border-slate-700 pb-2">턴 통계</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-700 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">식량 수입</div>
            <div className="text-lg font-bold">+12 / 턴</div>
          </div>
          <div className="bg-slate-700 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">생산 수입</div>
            <div className="text-lg font-bold">+8 / 턴</div>
          </div>
          <div className="bg-slate-700 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">과학 수입</div>
            <div className="text-lg font-bold">+6 / 턴</div>
          </div>
        </div>
      </div>
      
      {/* Framer Motion을 활용한 이펙트 효과 */}
      <AnimatePresence>
        {effect === "city-growth" && (
          <motion.div
            key="city-growth"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-200 text-5xl font-bold drop-shadow-lg z-[9998] pointer-events-none"
          >
            도시 성장!
          </motion.div>
        )}
        {effect === "combat" && (
          <motion.div
            key="combat"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-400 text-5xl font-bold drop-shadow-lg z-[9998] pointer-events-none"
          >
            전투 발생!
          </motion.div>
        )}
        {effect === "discovery" && (
          <motion.div
            key="discovery"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-300 text-5xl font-bold drop-shadow-lg z-[9998] pointer-events-none"
          >
            새로운 발견!
          </motion.div>
        )}
      </AnimatePresence>
      
      {children}
    </div>
  );
}