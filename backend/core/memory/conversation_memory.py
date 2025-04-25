from langchain.memory import ConversationBufferMemory, ConversationBufferWindowMemory
from langchain_core.messages import HumanMessage, AIMessage
from typing import Dict, List, Optional, Any
import logging
import json

logger = logging.getLogger(__name__)

class ConversationMemoryManager:
    """게임 내 대화 메모리 관리 클래스"""
    
    def __init__(self, window_size: int = 5):
        """
        대화 메모리 관리자 초기화
        
        Args:
            window_size: 기억할 최근 대화 턴 수
        """
        self.memories: Dict[str, Dict[str, ConversationBufferWindowMemory]] = {}
        self.window_size = window_size
    
    def get_or_create_memory(self, game_id: str, player_id: str) -> ConversationBufferWindowMemory:
        """게임과 플레이어 ID에 해당하는 메모리 반환, 없으면 생성"""
        if game_id not in self.memories:
            self.memories[game_id] = {}
        
        if player_id not in self.memories[game_id]:
            # 새 메모리 생성
            memory = ConversationBufferWindowMemory(
                k=self.window_size,
                return_messages=True,
                memory_key="chat_history",
                input_key="input",
                output_key="output"
            )
            self.memories[game_id][player_id] = memory
        
        return self.memories[game_id][player_id]
    
    def add_user_message(self, game_id: str, player_id: str, message: str) -> None:
        """사용자 메시지 추가"""
        memory = self.get_or_create_memory(game_id, player_id)
        memory.chat_memory.add_user_message(message)
        logger.info(f"Added user message for game {game_id}, player {player_id}")
    
    def add_ai_message(self, game_id: str, player_id: str, message: str) -> None:
        """AI 메시지 추가"""
        memory = self.get_or_create_memory(game_id, player_id)
        memory.chat_memory.add_ai_message(message)
        logger.info(f"Added AI message for game {game_id}, player {player_id}")
    
    def get_chat_history(self, game_id: str, player_id: str) -> List[Dict[str, Any]]:
        """채팅 히스토리 반환"""
        memory = self.get_or_create_memory(game_id, player_id)
        messages = memory.chat_memory.messages
        
        # 메시지 포맷팅
        history = []
        for msg in messages:
            if isinstance(msg, HumanMessage):
                history.append({
                    "role": "user",
                    "content": msg.content
                })
            elif isinstance(msg, AIMessage):
                history.append({
                    "role": "assistant",
                    "content": msg.content
                })
        
        return history
    
    def clear_memory(self, game_id: str, player_id: str) -> None:
        """메모리 초기화"""
        if game_id in self.memories and player_id in self.memories[game_id]:
            memory = self.get_or_create_memory(game_id, player_id)
            memory.clear()
            logger.info(f"Cleared memory for game {game_id}, player {player_id}")
    
    def clear_game_memories(self, game_id: str) -> None:
        """게임의 모든 메모리 초기화"""
        if game_id in self.memories:
            del self.memories[game_id]
            logger.info(f"Cleared all memories for game {game_id}")
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """메모리 통계 반환"""
        stats = {
            "total_games": len(self.memories),
            "games": {}
        }
        
        for game_id, players in self.memories.items():
            stats["games"][game_id] = {
                "total_players": len(players),
                "players": list(players.keys())
            }
        
        return stats 