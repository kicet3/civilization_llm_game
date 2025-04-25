"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import websocketService, { ChatMessage } from '@/services/websocketService';

interface ChatPanelProps {
  gameId: string;
  playerId: string;
  isOpen: boolean;
  onClose: () => void;
  maxHeight?: string;
}

export default function ChatPanel({
  gameId,
  playerId,
  isOpen,
  onClose,
  maxHeight = "50vh"
}: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 웹소켓 연결 설정
  useEffect(() => {
    if (!isOpen || !gameId || !playerId) return;
    
    // 시스템 메시지 추가
    setChatMessages([
      {
        type: 'system',
        player_id: 'system',
        timestamp: new Date().toISOString(),
        content: {
          text: '어드바이저에게 게임 관련 질문이나 명령을 할 수 있습니다.'
        }
      }
    ]);
    
    // 웹소켓 연결 콜백 설정
    const callbacks = {
      onOpen: () => {
        setConnected(true);
        setError(null);
      },
      onMessage: (message: ChatMessage) => {
        console.log('수신된 메시지:', message);
        
        // 채팅 메시지 처리
        if (message.type === 'chat') {
          // AI가 응답 중일 때 타이핑 표시 제거
          if (message.player_id === 'ai_advisor' && message.content.is_ai) {
            setIsTyping(false);
          }
          
          setChatMessages(prev => [...prev, message]);
        } 
        // 메시지 히스토리 처리
        else if (message.type === 'message_history') {
          if (Array.isArray(message.messages)) {
            setChatMessages(prev => {
              // 시스템 메시지는 유지하고 히스토리 추가
              const systemMessages = prev.filter(msg => msg.type === 'system');
              return [...systemMessages, ...message.messages];
            });
          }
        }
        // 게임 이벤트 처리
        else if (message.type === 'game_action' || message.type === 'event') {
          setChatMessages(prev => [...prev, {
            type: 'event',
            player_id: message.player_id,
            timestamp: message.timestamp,
            content: {
              text: message.content.description || JSON.stringify(message.content)
            }
          }]);
        }
      },
      onClose: () => {
        setConnected(false);
        setError('채팅 연결이 종료되었습니다.');
      },
      onError: () => {
        setConnected(false);
        setError('채팅 연결 중 오류가 발생했습니다.');
      }
    };
    
    // 웹소켓 연결
    websocketService.connect(gameId, playerId, callbacks);
    
    // 컴포넌트 언마운트 시 웹소켓 연결 종료
    return () => {
      websocketService.disconnect();
    };
  }, [isOpen, gameId, playerId]);
  
  // 채팅 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  // 메시지 전송 함수
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !connected) return;
    
    // 메시지 전송
    const success = websocketService.sendChatMessage(message.trim());
    
    if (success) {
      // AI 타이핑 표시 활성화
      setIsTyping(true);
      // 메시지 입력창 초기화
      setMessage('');
    } else {
      setError('메시지를 전송할 수 없습니다. 연결 상태를 확인해주세요.');
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
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed bottom-0 right-0 w-full md:w-96 bg-slate-800 border-t border-l border-slate-700 flex flex-col z-50 drop-shadow-lg"
         style={{ maxHeight: maxHeight }}>
      {/* 헤더 */}
      <div className="p-2 bg-slate-900 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center">
          <MessageSquare size={16} className="mr-2 text-indigo-400" />
          <span className="font-semibold">게임 어드바이저</span>
          
          {/* 연결 상태 표시 */}
          <span className={cn(
            "ml-2 px-1.5 py-0.5 rounded-full text-xs",
            connected ? "bg-green-500" : "bg-red-500"
          )}>
            {connected ? "연결됨" : "연결 끊김"}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* 에러 메시지 */}
      {error && (
        <div className="p-2 bg-red-500 text-white text-sm">
          {error}
        </div>
      )}
      
      {/* 채팅 메시지 영역 */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {chatMessages.map((msg, index) => (
          <div 
            key={index} 
            className={cn(
              "p-2 rounded-lg max-w-[85%]",
              msg.player_id === playerId ? "ml-auto bg-indigo-600" :
              msg.player_id === 'ai_advisor' ? "bg-slate-700" :
              msg.type === 'system' ? "mx-auto bg-slate-600 text-center text-sm max-w-[90%]" :
              msg.type === 'event' ? "mx-auto bg-amber-800 text-center text-sm max-w-[90%]" :
              "bg-slate-700"
            )}
          >
            <div className="flex items-center mb-1">
              {msg.player_id === 'ai_advisor' ? (
                <Bot size={12} className="mr-1 text-blue-400" />
              ) : msg.player_id === playerId ? (
                <User size={12} className="mr-1" />
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
            
            <div className="message-text text-sm whitespace-pre-wrap">
              {msg.content.text}
            </div>
          </div>
        ))}
        
        {/* AI 타이핑 표시 */}
        {isTyping && (
          <div className="p-2 rounded-lg max-w-[85%] bg-slate-700">
            <div className="flex items-center mb-1">
              <Bot size={12} className="mr-1 text-blue-400" />
              <span className="text-xs opacity-70">어드바이저</span>
            </div>
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
            </div>
          </div>
        )}
        
        {/* 자동 스크롤을 위한 참조 엘리먼트 */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* 메시지 입력 영역 */}
      <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="명령이나 질문을 입력하세요..."
            disabled={!connected}
            className="flex-1 bg-slate-700 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!connected}
            className={cn(
              "p-2 rounded",
              connected ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-600 cursor-not-allowed"
            )}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}