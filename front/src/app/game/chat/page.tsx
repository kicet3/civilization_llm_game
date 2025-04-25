"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Send, User, CornerDownLeft, AlertTriangle, Info, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import websocketService, { ChatMessage } from '@/services/websocketService';
import llmService from '@/services/llmService';
import gameService from '@/services/gameService';

export default function GameChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL 파라미터에서 게임 ID와 플레이어 ID 가져오기
  const gameId = searchParams.get('gameId') || '';
  const playerId = searchParams.get('playerId') || '';
  
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false); // 오프라인 모드 상태
  
  const ws = useRef<typeof websocketService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 웹소켓 연결 설정
  useEffect(() => {
    if (!gameId || !playerId) {
      setError('게임 ID와 플레이어 ID가 필요합니다.');
      return;
    }
    
    // 초기 시스템 메시지 추가
    setChatMessages([
      {
        type: 'system',
        player_id: 'system',
        timestamp: new Date().toISOString(),
        content: {
          text: '채팅 게임 모드에 오신 것을 환영합니다. 어드바이저와 대화하며 게임을 진행할 수 있습니다.'
        }
      }
    ]);
    
    // LLM 서비스 초기화 (폴백용)
    initializeLLMService();
    
    // 웹소켓 연결
    const handleWebSocketMessage = (message: ChatMessage) => {
      console.log('수신된 메시지:', message);
      
      // 타이핑 메시지 처리
      if (message.type === 'typing') {
        setIsTyping(message.content.is_typing || false);
        return;
      }
      
      // AI가 응답 중일 때 타이핑 표시 제거
      if (message.player_id === 'ai_advisor' && message.content.is_ai) {
        setIsTyping(false);
      }
      
      // 시스템 메시지 처리
      if (message.type === 'system') {
        // 오프라인 모드 관련 메시지인 경우 상태 업데이트
        if (message.content.text.includes('오프라인 모드')) {
          setOfflineMode(true);
        }
      }
      
      // 메시지 목록에 추가
      setChatMessages(prev => [...prev, message]);
    };
    
    // 웹소켓 연결 성공 처리
    const handleWebSocketOpen = () => {
      console.log('웹소켓 연결 성공');
      setConnected(true);
      setOfflineMode(false);
      setError(null);
      
      // 연결 성공 메시지 추가
      setChatMessages(prev => [...prev, {
        type: 'system',
        player_id: 'system',
        timestamp: new Date().toISOString(),
        content: {
          text: '채팅 서버에 연결되었습니다. 이제 명령을 입력할 수 있습니다.'
        }
      }]);
    };
    
    // 웹소켓 연결 종료 처리
    const handleWebSocketClose = (event: CloseEvent) => {
      console.log('웹소켓 연결 종료:', event.code, event.reason);
      setConnected(false);
      
      // 오프라인 모드가 아니면 에러 메시지 표시
      if (!offlineMode) {
        setError('채팅 서버와의 연결이 종료되었습니다. 오프라인 모드로 전환되었습니다.');
      }
    };
    
    // 웹소켓 에러 처리
    const handleWebSocketError = (event: Event) => {
      console.error('웹소켓 에러:', event);
      setConnected(false);
      
      // 오프라인 모드가 아니면 에러 메시지 표시
      if (!offlineMode) {
        setError('채팅 서버에 연결할 수 없습니다. 오프라인 모드로 전환되었습니다.');
      }
    };
    
    // 웹소켓 서비스 초기화 및 연결
    ws.current = websocketService.connect(
      gameId,
      playerId,
      {
        onOpen: handleWebSocketOpen,
        onMessage: handleWebSocketMessage,
        onClose: handleWebSocketClose,
        onError: handleWebSocketError
      },
      true // LLM 폴백 사용
    );
    
    // 컴포넌트 언마운트 시 웹소켓 연결 종료
    return () => {
      if (ws.current) {
        websocketService.disconnect();
      }
    };
  }, [gameId, playerId]);
  
  // LLM 서비스 초기화
  const initializeLLMService = async () => {
    try {
      // 게임 상태 정보 가져오기
      const gameState = await gameService.getGameState().catch(() => null);
      
      // 게임 상태 정보가 있으면 LLM 서비스에 업데이트
      if (gameState) {
        llmService.updateGameContext(gameState);
      }
    } catch (error) {
      console.error('LLM 서비스 초기화 오류:', error);
    }
  };
  
  // 채팅 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  // 메시지 전송 함수
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    try {
      // 사용자 메시지 설정
      const userMessage = message.trim();
      setMessage(''); // 입력창 초기화
      
      // 웹소켓 서비스를 통해 메시지 전송
      await websocketService.sendChatMessage(userMessage);
    } catch (error) {
      console.error('메시지 전송 중 오류:', error);
      
      // 오류 메시지 추가
      setChatMessages(prev => [
        ...prev,
        {
          type: 'error',
          player_id: 'system',
          timestamp: new Date().toISOString(),
          content: {
            text: '메시지 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
          }
        }
      ]);
    }
  };
  
  // 서버 재연결 시도
  const handleReconnect = () => {
    if (ws.current && gameId && playerId) {
      // 기존 연결 해제 후 재연결
      websocketService.disconnect();
      
      // 재연결 메시지 표시
      setChatMessages(prev => [
        ...prev,
        {
          type: 'system',
          player_id: 'system',
          timestamp: new Date().toISOString(),
          content: {
            text: '서버에 재연결을 시도합니다...'
          }
        }
      ]);
      
      // 웹소켓 재연결
      websocketService.connect(
        gameId,
        playerId,
        {
          onOpen: () => {
            setConnected(true);
            setOfflineMode(false);
            setError(null);
            
            setChatMessages(prev => [...prev, {
              type: 'system',
              player_id: 'system',
              timestamp: new Date().toISOString(),
              content: {
                text: '채팅 서버에 성공적으로 재연결되었습니다.'
              }
            }]);
          },
          onMessage: (message) => {
            console.log('수신된 메시지:', message);
            
            if (message.type === 'typing') {
              setIsTyping(message.content.is_typing || false);
              return;
            }
            
            if (message.player_id === 'ai_advisor' && message.content.is_ai) {
              setIsTyping(false);
            }
            
            setChatMessages(prev => [...prev, message]);
          },
          onClose: () => {
            setConnected(false);
            setError('서버와의 연결이 종료되었습니다. 오프라인 모드로 전환되었습니다.');
          },
          onError: () => {
            setConnected(false);
            setError('서버 연결 중 오류가 발생했습니다. 오프라인 모드로 전환되었습니다.');
          }
        },
        true
      );
    }
  };
  
  // 시간 포맷팅 함수
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };
  
  // 게임 화면으로 돌아가기
  const handleBack = () => {
    router.push(`/game?gameId=${gameId}`);
  };
  
  // 에러 알림 닫기
  const closeError = () => {
    setError(null);
  };
  
  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      {/* 헤더 */}
      <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center">
          <button 
            onClick={handleBack}
            className="mr-4 p-2 hover:bg-slate-700 rounded-full"
          >
            <CornerDownLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">채팅 게임 모드</h1>
        </div>
        <div className="flex items-center gap-2">
          {!connected && (
            <button 
              onClick={handleReconnect} 
              className="p-2 hover:bg-slate-700 rounded-full text-blue-400"
              title="서버에 재연결"
            >
              <RefreshCw size={16} />
            </button>
          )}
          <span className={cn(
            "px-2 py-1 rounded-full text-xs",
            connected ? "bg-green-500" : offlineMode ? "bg-yellow-500" : "bg-red-500"
          )}>
            {connected ? "연결됨" : offlineMode ? "오프라인 모드" : "연결 끊김"}
          </span>
        </div>
      </header>
      
      {/* 에러 알림 */}
      {error && (
        <div className="bg-red-500 text-white p-2 flex justify-between items-center">
          <div className="flex items-center">
            <AlertTriangle size={16} className="mr-2" />
            <span>{error}</span>
          </div>
          <button onClick={closeError} className="p-1 hover:bg-red-600 rounded">
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* 채팅 메시지 영역 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {chatMessages.map((msg, index) => (
          <div 
            key={index} 
            className={cn(
              "p-3 rounded-lg max-w-[80%]",
              msg.player_id === playerId ? "ml-auto bg-indigo-600" :
              msg.player_id === 'ai_advisor' ? "bg-slate-700" :
              msg.type === 'system' ? "mx-auto bg-slate-600 text-center max-w-md" :
              msg.type === 'event' ? "mx-auto bg-amber-800 text-center max-w-md" :
              msg.type === 'error' ? "mx-auto bg-red-700 text-center max-w-md" :
              "bg-slate-700"
            )}
          >
            <div className="flex items-center mb-1">
              {msg.player_id === 'ai_advisor' ? (
                <Info size={14} className="mr-1 text-blue-400" />
              ) : msg.player_id === playerId ? (
                <User size={14} className="mr-1" />
              ) : null}
              
              <span className="text-xs opacity-70">
                {msg.player_id === 'ai_advisor' ? '어드바이저' : 
                 msg.player_id === 'system' ? '시스템' : 
                 msg.player_id === playerId ? '나' : msg.player_id}
              </span>
              
              <span className="text-xs opacity-50 ml-2">
                {formatTime(msg.timestamp)}
              </span>
            </div>
            
            <div className="message-text whitespace-pre-wrap">
              {msg.content.text}
            </div>
          </div>
        ))}
        
        {/* AI 타이핑 표시 */}
        {isTyping && (
          <div className="p-3 rounded-lg max-w-[80%] bg-slate-700">
            <div className="flex items-center mb-1">
              <Info size={14} className="mr-1 text-blue-400" />
              <span className="text-xs opacity-70">어드바이저</span>
            </div>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
            </div>
          </div>
        )}
        
        {/* 자동 스크롤을 위한 참조 엘리먼트 */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* 메시지 입력 영역 */}
      <form onSubmit={handleSendMessage} className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={offlineMode ? "오프라인 모드: LLM과 대화할 수 있습니다..." : "명령이나 질문을 입력하세요..."}
            className="flex-1 bg-slate-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className={cn(
              "p-2 rounded-lg",
              "bg-indigo-600 hover:bg-indigo-700"
            )}
          >
            <Send size={20} />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-slate-400">
          <span>사용 가능한 명령어: </span>
          <span className="text-indigo-400">!help</span>,{' '}
          <span className="text-indigo-400">!turn</span>,{' '}
          <span className="text-indigo-400">!unit</span>,{' '}
          <span className="text-indigo-400">!city</span>,{' '}
          <span className="text-indigo-400">!research</span>
          {offlineMode && (
            <span className="ml-2 text-yellow-400">
              (오프라인 모드: 일부 게임 기능이 제한됩니다)
            </span>
          )}
        </div>
      </form>
    </div>
  );
}