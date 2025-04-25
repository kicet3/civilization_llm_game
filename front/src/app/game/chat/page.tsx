"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Send, User, CornerDownLeft, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  type: 'chat' | 'system' | 'event' | 'error';
  player_id: string;
  timestamp: string;
  content: {
    text: string;
    is_ai?: boolean;
  };
}

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
  
  const ws = useRef<WebSocket | null>(null);
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
    
    // 웹소켓 연결
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/${gameId}/${playerId}`;
    console.log(`웹소켓 연결 시도: ${wsUrl}`);
    
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      console.log('웹소켓 연결 성공');
      setConnected(true);
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
      
      // 핑-퐁 메시지로 연결 유지
      const pingInterval = setInterval(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send('ping');
        }
      }, 30000); // 30초마다 핑
      
      return () => clearInterval(pingInterval);
    };
    
    ws.current.onmessage = (event) => {
      // 핑-퐁 메시지 처리
      if (event.data === 'pong') {
        console.log('pong 수신');
        return;
      }
      
      try {
        const data = JSON.parse(event.data);
        console.log('수신된 메시지:', data);
        
        // 채팅 메시지 처리
        if (data.type === 'chat') {
          // AI가 응답 중일 때 타이핑 표시 제거
          if (data.player_id === 'ai_advisor' && data.content.is_ai) {
            setIsTyping(false);
          }
          
          setChatMessages(prev => [...prev, data]);
        } 
        // 메시지 히스토리 처리
        else if (data.type === 'message_history') {
          if (Array.isArray(data.messages)) {
            setChatMessages(prev => {
              // 시스템 메시지는 유지하고 히스토리 추가
              const systemMessages = prev.filter(msg => msg.type === 'system');
              return [...systemMessages, ...data.messages];
            });
          }
        }
        // 게임 이벤트 처리
        else if (data.type === 'game_action' || data.type === 'event') {
          setChatMessages(prev => [...prev, {
            type: 'event',
            player_id: data.player_id,
            timestamp: data.timestamp,
            content: {
              text: data.content.description || JSON.stringify(data.content)
            }
          }]);
        }
      } catch (e) {
        console.error('메시지 파싱 오류:', e);
        console.log('원본 메시지:', event.data);
      }
    };
    
    ws.current.onclose = (event) => {
      console.log('웹소켓 연결 종료:', event.code, event.reason);
      setConnected(false);
      
      // 자동 재연결 시도하지 않음 - 에러 메시지만 표시
      setError('채팅 서버와의 연결이 종료되었습니다. 페이지를 새로고침하여 다시 연결해주세요.');
    };
    
    ws.current.onerror = (event) => {
      console.error('웹소켓 에러:', event);
      setConnected(false);
      setError('채팅 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    };
    
    // 컴포넌트 언마운트 시 웹소켓 연결 종료
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [gameId, playerId]);
  
  // 채팅 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  // 메시지 전송 함수
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !connected || !ws.current) return;
    
    // 메시지 객체 생성
    const chatMessage = {
      type: 'chat',
      content: {
        text: message.trim()
      }
    };
    
    // 웹소켓으로 메시지 전송
    ws.current.send(JSON.stringify(chatMessage));
    
    // AI 타이핑 표시 활성화
    setIsTyping(true);
    
    // 메시지 입력창 초기화
    setMessage('');
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
        <div className="flex items-center">
          <span className={cn(
            "px-2 py-1 rounded-full text-xs",
            connected ? "bg-green-500" : "bg-red-500"
          )}>
            {connected ? "연결됨" : "연결 끊김"}
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
            placeholder="명령이나 질문을 입력하세요..."
            disabled={!connected}
            className="flex-1 bg-slate-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!connected}
            className={cn(
              "p-2 rounded-lg",
              connected ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-600 cursor-not-allowed"
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
        </div>
      </form>
    </div>
  );
}