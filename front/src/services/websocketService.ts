// 웹소켓 연결 및 통신을 관리하는 서비스
import llmService from './llmService';

export interface ChatMessage {
  type: string;
  player_id: string;
  timestamp: string;
  content: any;
}

export interface WebSocketCallbacks {
  onOpen?: () => void;
  onMessage?: (message: ChatMessage) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private gameId: string | null = null;
  private playerId: string | null = null;
  private useLLMFallback = false; // LLM 폴백을 사용할지 여부
  
  // 웹소켓 연결 생성
  connect(gameId: string, playerId: string, callbacks: WebSocketCallbacks = {}, useLLMFallback = true) {
    this.gameId = gameId;
    this.playerId = playerId;
    this.callbacks = callbacks;
    this.useLLMFallback = useLLMFallback;
    
    // 기존 연결 종료
    this.disconnect();
    
    // 새 웹소켓 연결 생성
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/${gameId}/${playerId}`;
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      // 연결 이벤트 핸들러
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('웹소켓 연결 생성 오류:', error);
      this.handleConnectFail(error);
    }
    
    return this;
  }
  
  // 웹소켓 연결 해제
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    this.reconnectAttempts = 0;
  }
  
  // 메시지 전송
  async sendMessage(type: string, content: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('웹소켓이 연결되어 있지 않습니다. LLM 폴백을 시도합니다.');
      
      // 폴백 모드 활성화된 경우 LLM을 통해 처리
      if (this.useLLMFallback && type === 'chat') {
        await this.handleLLMFallback(content.text);
        return true;
      }
      
      console.error('웹소켓 연결이 되어있지 않고 LLM 폴백도 비활성화되었습니다.');
      return false;
    }
    
    const message = {
      type,
      content
    };
    
    this.socket.send(JSON.stringify(message));
    return true;
  }
  
  // LLM 폴백 처리
  private async handleLLMFallback(text: string) {
    console.log('LLM 폴백으로 메시지 처리:', text);
    
    try {
      // 사용자 메시지 생성
      const userMessage: ChatMessage = {
        type: 'chat',
        player_id: this.playerId || 'player',
        timestamp: new Date().toISOString(),
        content: {
          text: text
        }
      };
      
      // 사용자 메시지 콜백
      if (this.callbacks.onMessage) {
        this.callbacks.onMessage(userMessage);
      }
      
      // AI 응답 처리 중 표시
      const typingMessage: ChatMessage = {
        type: 'typing',
        player_id: 'ai_advisor',
        timestamp: new Date().toISOString(),
        content: {
          is_typing: true
        }
      };
      
      if (this.callbacks.onMessage) {
        this.callbacks.onMessage(typingMessage);
      }
      
      // LLM 서비스로 응답 생성
      let response;
      
      // 명령어인 경우 명령어 핸들러 사용
      if (text.startsWith('!')) {
        response = {
          text: llmService.handleCommand(text),
          id: 'command-response'
        };
      } else {
        // 일반 메시지는 LLM 서비스로 처리
        response = await llmService.chat(text);
      }
      
      // AI 응답 메시지 생성
      const aiMessage: ChatMessage = {
        type: 'chat',
        player_id: 'ai_advisor',
        timestamp: new Date().toISOString(),
        content: {
          text: response.text,
          is_ai: true
        }
      };
      
      // AI 응답 콜백
      if (this.callbacks.onMessage) {
        this.callbacks.onMessage(aiMessage);
      }
      
    } catch (error) {
      console.error('LLM 폴백 처리 중 오류:', error);
      
      // 오류 메시지 전송
      const errorMessage: ChatMessage = {
        type: 'error',
        player_id: 'system',
        timestamp: new Date().toISOString(),
        content: {
          text: '메시지 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        }
      };
      
      if (this.callbacks.onMessage) {
        this.callbacks.onMessage(errorMessage);
      }
    }
  }
  
  // 채팅 메시지 전송
  async sendChatMessage(text: string) {
    return this.sendMessage('chat', { text });
  }
  
  // 게임 명령 전송
  async sendGameAction(action: string, params: any) {
    return this.sendMessage('game_action', { action, params });
  }
  
  // 연결 상태 확인
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  // 연결 성공 핸들러
  private handleOpen(event: Event) {
    console.log('웹소켓 연결 성공');
    this.reconnectAttempts = 0;
    
    // 핑-퐁 메시지로 연결 유지
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send('ping');
      }
    }, 30000); // 30초마다 핑
    
    // 콜백 호출
    if (this.callbacks.onOpen) {
      this.callbacks.onOpen();
    }
  }
  
  // 메시지 수신 핸들러
  private handleMessage(event: MessageEvent) {
    // 핑-퐁 메시지 처리
    if (event.data === 'pong') {
      return;
    }
    
    try {
      const message = JSON.parse(event.data);
      
      // 콜백 호출
      if (this.callbacks.onMessage) {
        this.callbacks.onMessage(message);
      }
    } catch (e) {
      console.error('메시지 파싱 오류:', e);
    }
  }
  
  // 연결 종료 핸들러
  private handleClose(event: CloseEvent) {
    console.log('웹소켓 연결 종료:', event.code, event.reason);
    
    // 핑 인터벌 제거
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // 폴백 메시지를 보낼 수 있으므로 즉시 재연결 시도하지 않음
    if (this.useLLMFallback) {
      const systemMessage: ChatMessage = {
        type: 'system',
        player_id: 'system',
        timestamp: new Date().toISOString(),
        content: {
          text: '서버 연결이 끊겼습니다. 오프라인 모드에서 계속 대화할 수 있습니다.'
        }
      };
      
      if (this.callbacks.onMessage) {
        this.callbacks.onMessage(systemMessage);
      }
    }
    
    // 재연결 시도 (폴백을 사용하더라도 서버 연결 재시도)
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        if (this.gameId && this.playerId) {
          // 콜백은 유지하되 새로운 연결 시도
          const existingCallbacks = this.callbacks;
          this.connect(this.gameId, this.playerId, existingCallbacks, this.useLLMFallback);
        }
      }, this.reconnectInterval);
    }
    
    // 콜백 호출
    if (this.callbacks.onClose) {
      this.callbacks.onClose(event);
    }
  }
  
  // 에러 핸들러
  private handleError(event: Event) {
    console.error('웹소켓 에러:', event);
    
    // 폴백 모드를 사용하는 경우 시스템 메시지 표시
    if (this.useLLMFallback) {
      const systemMessage: ChatMessage = {
        type: 'system',
        player_id: 'system',
        timestamp: new Date().toISOString(),
        content: {
          text: '서버 연결에 문제가 발생했습니다. 오프라인 모드에서 계속 대화할 수 있습니다.'
        }
      };
      
      if (this.callbacks.onMessage) {
        this.callbacks.onMessage(systemMessage);
      }
    }
    
    // 콜백 호출
    if (this.callbacks.onError) {
      this.callbacks.onError(event);
    }
  }
  
  // 연결 실패 핸들러
  private handleConnectFail(error: any) {
    console.error('웹소켓 연결 실패:', error);
    
    // 폴백 모드를 사용하는 경우 시스템 메시지 표시
    if (this.useLLMFallback) {
      const systemMessage: ChatMessage = {
        type: 'system',
        player_id: 'system',
        timestamp: new Date().toISOString(),
        content: {
          text: '서버에 연결할 수 없습니다. 오프라인 모드에서 대화할 수 있습니다.'
        }
      };
      
      if (this.callbacks.onMessage) {
        this.callbacks.onMessage(systemMessage);
      }
    }
    
    // onError 콜백 호출 (연결 실패도 에러로 간주)
    if (this.callbacks.onError) {
      this.callbacks.onError(new Event('error'));
    }
  }
}

// 싱글톤 인스턴스 생성
const websocketService = new WebSocketService();

export default websocketService;