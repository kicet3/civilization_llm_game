from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import Dict, List, Any
from datetime import datetime
import json
from pydantic import BaseModel, Field
import uuid
from core.tools.vector_retrieval import vector_retrieval_tool
from core.tools.game_api import game_api_tool
router = APIRouter()

# 웹소켓 연결 관리자
class ConnectionManager:
    def __init__(self):
        # 활성화된 연결을 저장 {connection_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}
        # 메시지 히스토리 저장
        self.message_history: List[Dict[str, Any]] = []
        # 최대 히스토리 길이
        self.max_history_size = 100
        
    async def connect(self, websocket: WebSocket) -> str:
        """새로운 WebSocket 연결 추가"""
        await websocket.accept()
        
        # 고유한 연결 ID 생성
        connection_id = str(uuid.uuid4())
        
        # 연결 저장
        self.active_connections[connection_id] = websocket
        
        # 접속 메시지 생성
        connection_msg = {
            "type": "connected",
            "sender": "system",
            "timestamp": datetime.now().isoformat(),
            "content": {
                "text": "서버에 연결되었습니다.",
                "connection_id": connection_id
            }
        }
        
        # 접속 히스토리에 저장
        self.add_to_history(connection_msg)
        
        # 연결된 클라이언트에게 접속 알림 및 연결 ID 전송
        await self.send_personal_message(connection_msg, websocket)
        
        # 해당 클라이언트에게 이전 메시지 히스토리 전송
        await self.send_history(websocket)
        
        return connection_id
    
    async def disconnect(self, connection_id: str):
        """WebSocket 연결 제거"""
        if connection_id in self.active_connections:
            # 연결 종료 메시지 생성
            disconnect_msg = {
                "type": "disconnected",
                "sender": "system",
                "timestamp": datetime.now().isoformat(),
                "content": {
                    "text": "연결이 종료되었습니다.",
                    "connection_id": connection_id
                }
            }
            
            # 히스토리에 저장
            self.add_to_history(disconnect_msg)
            
            # 다른 모든 클라이언트에게 알림
            await self.broadcast_except_sender(connection_id, disconnect_msg)
            
            # 연결 삭제
            del self.active_connections[connection_id]
    
    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        """특정 웹소켓 연결에만 메시지 전송"""
        await websocket.send_text(json.dumps(message))
    
    async def broadcast(self, message: Dict[str, Any]):
        """모든 연결에 메시지 브로드캐스트"""
        for connection in self.active_connections.values():
            await connection.send_text(json.dumps(message))
    
    async def broadcast_except_sender(self, sender_id: str, message: Dict[str, Any]):
        """송신자를 제외한 모든 연결에 메시지 브로드캐스트"""
        for conn_id, websocket in self.active_connections.items():
            if conn_id != sender_id:
                await websocket.send_text(json.dumps(message))
    
    async def send_history(self, websocket: WebSocket):
        """연결된 클라이언트에게 메시지 히스토리 전송"""
        history_message = {
            "type": "message_history",
            "sender": "system",
            "timestamp": datetime.now().isoformat(),
            "content": {
                "messages": self.message_history
            }
        }
        await websocket.send_text(json.dumps(history_message))
    
    def add_to_history(self, message: Dict[str, Any]):
        """메시지를 히스토리에 추가하고 최대 크기 관리"""
        self.message_history.append(message)
        # 히스토리 사이즈 제한
        if len(self.message_history) > self.max_history_size:
            self.message_history = self.message_history[-self.max_history_size:]

# 웹소켓 연결 관리자 인스턴스 생성
manager = ConnectionManager()

# 메시지 타입 정의
class MessageType:
    CHAT = "chat"
    GAME_ACTION = "game_action"
    UNIT_MOVE = "unit_move"
    CITY_ACTION = "city_action"
    TECH_RESEARCH = "tech_research"
    TURN_END = "turn_end"
    SYSTEM = "system"

# 웹소켓 전송용 메시지 모델
class WebSocketMessage(BaseModel):
    type: str
    sender: str = "system"
    content: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.now)

# 메인 웹소켓 엔드포인트
@router.websocket("")
async def websocket_endpoint(websocket: WebSocket):
    """웹소켓 연결 엔드포인트"""
    connection_id = None
    
    try:
        # 연결 수락 및 고유 ID 생성
        connection_id = await manager.connect(websocket)
        
        while True:
            # 클라이언트로부터 메시지 수신
            data = await websocket.receive_text()
            
            # ping 메시지 처리
            if data == "ping":
                await websocket.send_text("pong")
                continue
                
            # JSON 파싱
            try:
                message_data = json.loads(data)
                # 타입, 내용 확인
                message_type = message_data.get("type", "")
                content = message_data.get("content", {})
                sender = message_data.get("sender", connection_id)
                
                # 메시지 객체 생성
                message = {
                    "type": message_type,
                    "sender": sender,
                    "timestamp": message_data.get("timestamp", datetime.now().isoformat()),
                    "content": content
                }
                
                # 메시지 히스토리에 저장
                manager.add_to_history(message)
                
                # 메시지 타입에 따라 다르게 처리
                if message_type == MessageType.CHAT:
                    # 채팅 메시지는 모든 연결에 전송
                    # AI 응답 생성
                    if sender == "user" or sender == connection_id:
                        # 먼저 타이핑 표시
                        typing_message = {
                            "type": "typing",
                            "sender": "ai_advisor",
                            "timestamp": datetime.now().isoformat(),
                            "content": {
                                "is_typing": True
                            }
                        }
                        await manager.broadcast(typing_message)
                        
                        # 사용자 입력 텍스트 추출
                        user_input = message["content"].get("text", "") if isinstance(message["content"], dict) else message["content"]
                        # AI 벡터 검색 처리
                        ai_json = vector_retrieval_tool.invoke(user_input)
                        try:
                            ai_content = json.loads(ai_json)
                        except json.JSONDecodeError:
                            ai_content = {"error": "AI 검색 결과 파싱 실패"}
                        ai_msg = {
                            "type": MessageType.CHAT,
                            "sender": "ai_advisor",
                            "timestamp": datetime.now().isoformat(),
                            "content": ai_content
                        }
                        manager.add_to_history(ai_msg)
                        await manager.broadcast(ai_msg)
                    else:
                        # 일반 채팅 메시지 브로드캐스트
                        await manager.broadcast(message)
                
                elif message_type in [MessageType.UNIT_MOVE, MessageType.TURN_END, MessageType.GAME_ACTION]:
                    # 게임 액션 브로드캐스트
                    await manager.broadcast(message)
                
                elif message_type == MessageType.TECH_RESEARCH:
                    # 기술 연구 요청 처리
                    user_input = message["content"].get("text", "") if isinstance(message["content"], dict) else message["content"]
                    tech_json = await game_api_tool._arun(user_input)
                    try:
                        tech_content = json.loads(tech_json)
                    except json.JSONDecodeError:
                        tech_content = {"error": "API 결과 파싱 실패"}
                    tech_msg = {
                        "type": MessageType.TECH_RESEARCH,
                        "sender": "game_api",
                        "timestamp": datetime.now().isoformat(),
                        "content": tech_content
                    }
                    manager.add_to_history(tech_msg)
                    await manager.broadcast(tech_msg)
                
                else:
                    # 기타 메시지 처리
                    await manager.broadcast(message)
                
            except json.JSONDecodeError:
                # JSON 형식이 아닌 경우 에러 메시지 전송 (ping은 제외)
                if data != "ping":
                    error_message = {
                        "type": "error",
                        "sender": "system",
                        "timestamp": datetime.now().isoformat(),
                        "content": {"error": "유효하지 않은 메시지 형식입니다. JSON이 필요합니다."}
                    }
                    await manager.send_personal_message(error_message, websocket)
                
    except WebSocketDisconnect:
        # 연결이 끊어진 경우 처리
        if connection_id and connection_id in manager.active_connections:
            await manager.disconnect(connection_id)
    
    except Exception as e:
        # 기타 예외 처리
        print(f"WebSocket 오류: {str(e)}")
        try:
            if connection_id and connection_id in manager.active_connections:
                await manager.disconnect(connection_id)
        except:
            pass

# 연결 정보 조회 엔드포인트
@router.get("/connections")
async def get_connections():
    """현재 웹소켓에 연결된 클라이언트 정보 조회"""
    connection_count = len(manager.active_connections)
    connection_ids = list(manager.active_connections.keys())
    
    return {
        "status": "success",
        "total_connections": connection_count,
        "connection_ids": connection_ids,
        "last_message_time": datetime.now().isoformat()
    }

# 이벤트 전송 엔드포인트
@router.post("/event")
async def send_event(event: WebSocketMessage):
    """웹소켓을 통해 이벤트 메시지 전송"""
    message = {
        "type": event.type,
        "sender": event.sender,
        "timestamp": event.timestamp.isoformat(),
        "content": event.content
    }
    
    # 메시지 히스토리에 저장
    manager.add_to_history(message)
    
    # 모든 클라이언트에게 브로드캐스트
    await manager.broadcast(message)
    
    return {
        "status": "success", 
        "message": "이벤트가 성공적으로 브로드캐스트되었습니다.",
        "recipients": len(manager.active_connections)
    }

