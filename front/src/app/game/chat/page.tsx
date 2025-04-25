"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Send, User, CornerDownLeft, AlertTriangle, Info, X, RefreshCw, Trash2, MessageCircle, PlayCircle, SplitSquareVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import websocketService, { ChatMessage } from '@/services/websocketService';
import llmService from '@/services/llmService';
import gameService from '@/services/gameService';

export default function GameChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL 파라미터에서 게임 ID 가져오기 (라우팅용)
  const gameId = searchParams.get('gameId') || '';
  
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  
  // 화면 분할 관련 상태
  const [splitView, setSplitView] = useState(true); // 기본값은 분할 화면
  const [activeTab, setActiveTab] = useState<'advice' | 'execution'>('advice'); // 모바일에서 활성화된 탭
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const adviceMessagesEndRef = useRef<HTMLDivElement>(null);
  const executionMessagesEndRef = useRef<HTMLDivElement>(null);
  
  // 웹소켓 연결 설정
  useEffect(() => {
    // 초기 환영 메시지
    setChatMessages([
      {
        type: 'system',
        sender: 'system',
        timestamp: new Date().toISOString(),
        content: {
          text: '채팅 게임 모드에 오신 것을 환영합니다. 어드바이저와 대화하며 게임을 진행할 수 있습니다.'
        }
      }
    ]);
    
    // LLM 서비스 초기화 (폴백용)
    initializeLLMService();
    
    // 웹소켓 메시지 핸들러
    const handleWebSocketMessage = (message: ChatMessage) => {
      console.log('수신된 메시지:', message);
      
      // 타이핑 메시지 처리
      if (message.type === 'typing') {
        setIsTyping(message.content.is_typing || false);
        return;
      }
      
      // AI가 응답 중일 때 타이핑 표시 제거
      if (message.sender === 'ai_advisor' && message.content.is_ai) {
        setIsTyping(false);
      }
      
      // 시스템 메시지 처리
      if (message.type === 'system') {
        // 오프라인 모드 관련 메시지인 경우 상태 업데이트
        if (message.content.text && typeof message.content.text === 'string' && 
            message.content.text.includes('오프라인 모드')) {
          setOfflineMode(true);
        }
      }
      
      // 메시지 목록에 추가
      if (message.type !== 'message_history') {
        setChatMessages(prev => [...prev, message]);
      } else if (message.content.messages && Array.isArray(message.content.messages)) {
        // 히스토리 메시지인 경우 모든 메시지를 추가
        setChatMessages(prev => {
          // 시스템 메시지만 유지
          const systemMessages = prev.filter(msg => msg.type === 'system' && msg.sender === 'system');
          return [...systemMessages, ...message.content.messages];
        });
      }
    };
    
    // 웹소켓 연결 성공 핸들러
    const handleWebSocketOpen = () => {
      console.log('웹소켓 연결 성공');
      setConnected(true);
      setOfflineMode(false);
      setError(null);
      
      // 연결 성공 메시지 추가
      setChatMessages(prev => [...prev, {
        type: 'system',
        sender: 'system',
        timestamp: new Date().toISOString(),
        content: {
          text: '채팅 서버에 연결되었습니다. 이제 명령을 입력할 수 있습니다.'
        }
      }]);
    };
    
    // 웹소켓 연결 종료 핸들러
    const handleWebSocketClose = (event: CloseEvent) => {
      console.log('웹소켓 연결 종료:', event.code, event.reason);
      setConnected(false);
      
      // 오프라인 모드가 아니면 에러 메시지 표시
      if (!offlineMode) {
        setError('채팅 서버와의 연결이 종료되었습니다. 오프라인 모드로 전환되었습니다.');
      }
    };
    
    // 웹소켓 에러 핸들러
    const handleWebSocketError = (event: Event) => {
      console.error('웹소켓 에러:', event);
      setConnected(false);
      
      // 오프라인 모드가 아니면 에러 메시지 표시
      if (!offlineMode) {
        setError('채팅 서버에 연결할 수 없습니다. 오프라인 모드로 전환되었습니다.');
      }
    };
    
    // 웹소켓 연결
    websocketService.connect(
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
      websocketService.disconnect();
    };
  }, []);
  
  // LLM 서비스 초기화
  const initializeLLMService = async () => {
    try {
      // 게임 상태 정보 가져오기 (게임 ID가 있는 경우)
      if (gameId) {
        const gameState = await gameService.getGameState().catch(() => null);
        
        // 게임 상태 정보가 있으면 LLM 서비스에 업데이트
        if (gameState) {
          llmService.updateGameContext(gameState);
        }
      }
    } catch (error) {
      console.error('LLM 서비스 초기화 오류:', error);
    }
  };
  
  // 채팅 메시지 자동 스크롤
  useEffect(() => {
    if (!splitView) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      adviceMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      executionMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, splitView]);
  
  // 메시지 전송 함수
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    try {
      // 사용자 메시지 설정
      const userMessage = message.trim();
      setMessage(''); // 입력창 초기화
      
      // 사용자 메시지 미리 추가
      const userMessageObj: ChatMessage = {
        type: 'chat',
        sender: 'user',
        timestamp: new Date().toISOString(),
        content: {
          text: userMessage
        }
      };
      
      setChatMessages(prev => [...prev, userMessageObj]);
      
      // 웹소켓 서비스를 통해 메시지 전송
      await websocketService.sendChatMessage(userMessage);
    } catch (error) {
      console.error('메시지 전송 중 오류:', error);
      
      // 오류 메시지 추가
      setChatMessages(prev => [
        ...prev,
        {
          type: 'error',
          sender: 'system',
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
    // 재연결 메시지 표시
    setChatMessages(prev => [
      ...prev,
      {
        type: 'system',
        sender: 'system',
        timestamp: new Date().toISOString(),
        content: {
          text: '서버에 재연결을 시도합니다...'
        }
      }
    ]);
    
    // 기존 연결 해제
    websocketService.disconnect();
    
    // 웹소켓 재연결
    websocketService.connect(
      {
        onOpen: () => {
          setConnected(true);
          setOfflineMode(false);
          setError(null);
          
          setChatMessages(prev => [...prev, {
            type: 'system',
            sender: 'system',
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
          
          if (message.sender === 'ai_advisor' && message.content.is_ai) {
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
  };
  
  // 채팅 내용 지우기
  const handleClearChat = () => {
    // 시스템 메시지만 남기고 모두 삭제
    const systemWelcomeMessage = {
      type: 'system',
      sender: 'system',
      timestamp: new Date().toISOString(),
      content: {
        text: '채팅 내용이 모두 삭제되었습니다.'
      }
    };
    
    setChatMessages([systemWelcomeMessage]);
  };
  
  // 화면 분할 토글
  const toggleSplitView = () => {
    setSplitView(!splitView);
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
  
  // 발신자 이름 표시
  const getSenderDisplayName = (sender: string) => {
    if (sender === 'system') return '시스템';
    if (sender === 'ai_advisor') return '어드바이저';
    if (sender === 'user') return '나';
    return sender || '알 수 없음';
  };
  
  // 메시지가 조언인지 실행인지 구분
  const isAdviceMessage = (message: ChatMessage) => {
    // AI가 보낸 메시지나 시스템 메시지는 조언으로 간주
    if (message.sender === 'ai_advisor' || message.type === 'system') return true;
    
    // 사용자가 보낸 메시지 중 !help, !turn, !unit 등의 명령이 없는 경우 조언으로 간주
    if (message.sender === 'user') {
      const text = message.content.text || '';
      if (!text.startsWith('!')) return true;
    }
    
    return false;
  };
  
  const isExecutionMessage = (message: ChatMessage) => {
    // 사용자가 보낸 명령어 메시지는 실행으로 간주
    if (message.sender === 'user') {
      const text = message.content.text || '';
      if (text.startsWith('!')) return true;
    }
    
    // 명령어 실행 결과(AI 응답 중 특정 형식)도 실행으로 간주
    if (message.sender === 'ai_advisor' && message.content.is_command_result) return true;
    
    // 이벤트 메시지는 실행으로 간주
    if (message.type === 'event') return true;
    
    return false;
  };
  
  // 메시지 필터링
  const adviceMessages = chatMessages.filter(isAdviceMessage);
  const executionMessages = chatMessages.filter(msg => 
    isExecutionMessage(msg) || msg.type === 'system' // 시스템 메시지는 양쪽에 모두 표시
  );
  
  // 응답형 UI를 위한 화면 너비 감지
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px 미만이면 모바일로 간주
    };
    
    // 초기 확인
    checkIfMobile();
    
    // 화면 크기 변경 시 확인
    window.addEventListener('resize', checkIfMobile);
    
    // 클린업
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // 메시지 렌더링 함수
  const renderMessage = (msg: ChatMessage, index: number) => (
    <div 
      key={index} 
      className={cn(
        "p-3 rounded-lg max-w-[90%]",
        msg.sender === 'user' ? "ml-auto bg-indigo-600" :
        msg.sender === 'ai_advisor' ? "bg-slate-700" :
        msg.type === 'system' ? "mx-auto bg-slate-600 text-center max-w-md" :
        msg.type === 'event' ? "mx-auto bg-amber-800 text-center max-w-md" :
        msg.type === 'error' ? "mx-auto bg-red-700 text-center max-w-md" :
        "bg-slate-700"
      )}
    >
      <div className="flex items-center mb-1">
        {msg.sender === 'ai_advisor' ? (
          <Info size={14} className="mr-1 text-blue-400" />
        ) : msg.sender === 'user' ? (
          <User size={14} className="mr-1" />
        ) : null}
        
        <span className="text-xs opacity-70">
          {getSenderDisplayName(msg.sender || '')}
        </span>
        
        <span className="text-xs opacity-50 ml-2">
          {formatTime(msg.timestamp)}
        </span>
      </div>
      
      <div className="message-text whitespace-pre-wrap">
        {msg.content.text}
      </div>
    </div>
  );
  
  // 타이핑 표시 컴포넌트
  const typingIndicator = (
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
  );
  
  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      {/* 헤더 */}
      <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center">
          <button 
            onClick={handleBack}
            className="mr-4 p-2 hover:bg-slate-700 rounded-full"
            title="게임으로 돌아가기"
          >
            <CornerDownLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">채팅 게임 모드</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleSplitView} 
            className="p-2 hover:bg-slate-700 rounded-full text-blue-400"
            title={splitView ? "분할 화면 해제" : "분할 화면 활성화"}
          >
            <SplitSquareVertical size={16} />
          </button>
          <button 
            onClick={handleClearChat} 
            className="p-2 hover:bg-slate-700 rounded-full text-red-400"
            title="채팅 내용 지우기"
          >
            <Trash2 size={16} />
          </button>
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
      
      {/* 모바일 탭 선택 (모바일에서만 표시) */}
      {isMobile && splitView && (
        <div className="flex border-b border-slate-700">
          <button 
            className={cn(
              "flex-1 py-2 text-center flex items-center justify-center",
              activeTab === 'advice' ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-300"
            )}
            onClick={() => setActiveTab('advice')}
          >
            <MessageCircle size={16} className="mr-2" />
            조언
          </button>
          <button 
            className={cn(
              "flex-1 py-2 text-center flex items-center justify-center",
              activeTab === 'execution' ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-300"
            )}
            onClick={() => setActiveTab('execution')}
          >
            <PlayCircle size={16} className="mr-2" />
            실행
          </button>
        </div>
      )}
      
      {/* 채팅 메시지 영역 */}
      {!splitView ? (
        // 분할되지 않은 단일 화면
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {chatMessages.map(renderMessage)}
          
          {/* 타이핑 표시 */}
          {isTyping && typingIndicator}
          
          {/* 자동 스크롤을 위한 참조 엘리먼트 */}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        // 분할 화면 (조언/실행)
        <div className={cn(
          "flex-1 flex overflow-hidden",
          isMobile ? "flex-col" : "flex-row" // 모바일에서는 위아래로, 데스크톱에서는 좌우로 분할
        )}>
          {/* 조언 패널 */}
          <div 
            className={cn(
              "flex-1 overflow-hidden p-4 space-y-4 border-r border-slate-700",
              isMobile && activeTab !== 'advice' && "hidden"
            )}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between mb-2 bg-slate-800 p-2 rounded-lg shadow-md">
              <h2 className="font-semibold flex items-center">
                <MessageCircle size={16} className="mr-2 text-blue-400" />
                조언
              </h2>
            </div>
            
            {adviceMessages.map(renderMessage)}
            
            {/* 타이핑 표시 (조언 패널에만 표시) */}
            {isTyping && typingIndicator}
            
            {/* 자동 스크롤을 위한 참조 엘리먼트 */}
            <div ref={adviceMessagesEndRef} />
          </div>
          
          {/* 실행 패널 */}
          <div 
            className={cn(
              "flex-1 overflow-auto p-4 space-y-4",
              isMobile && activeTab !== 'execution' && "hidden"
            )}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between mb-2 bg-slate-800 p-2 rounded-lg shadow-md">
              <h2 className="font-semibold flex items-center">
                <PlayCircle size={16} className="mr-2 text-green-400" />
                실행
              </h2>
            </div>
            
            {executionMessages.map(renderMessage)}
            
            {/* 자동 스크롤을 위한 참조 엘리먼트 */}
            <div ref={executionMessagesEndRef} />
          </div>
        </div>
      )}
      
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
            className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700"
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