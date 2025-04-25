// 웹소켓 연결 및 통신을 관리하는 서비스

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
    
    // 웹소켓 연결 생성
    connect(gameId: string, playerId: string, callbacks: WebSocketCallbacks = {}) {
      this.gameId = gameId;
      this.playerId = playerId;
      this.callbacks = callbacks;
      
      // 기존 연결 종료
      this.disconnect();
      
      // 새 웹소켓 연결 생성
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/${gameId}/${playerId}`;
      
      this.socket = new WebSocket(wsUrl);
      
      // 연결 이벤트 핸들러
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      
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
    sendMessage(type: string, content: any) {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.error('웹소켓이 연결되어 있지 않습니다.');
        return false;
      }
      
      const message = {
        type,
        content
      };
      
      this.socket.send(JSON.stringify(message));
      return true;
    }
    
    // 채팅 메시지 전송
    sendChatMessage(text: string) {
      return this.sendMessage('chat', { text });
    }
    
    // 게임 명령 전송
    sendGameAction(action: string, params: any) {
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
      
      // 재연결 시도
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        
        console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        setTimeout(() => {
          if (this.gameId && this.playerId) {
            this.connect(this.gameId, this.playerId, this.callbacks);
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
      
      // 콜백 호출
      if (this.callbacks.onError) {
        this.callbacks.onError(event);
      }
    }
  }
  
  // 싱글톤 인스턴스 생성
  const websocketService = new WebSocketService();
  
  export default websocketService;