from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import MessagesPlaceholder, ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage
from langchain.agents import AgentType, initialize_agent
from langchain.agents.format_scratchpad import format_to_openai_functions
from langchain.agents.output_parsers import OpenAIFunctionsAgentOutputParser
from typing import Dict, List, Any, Optional
import logging
import json
import os

from core.llm import llm, production_llm
from core.tools.vector_retrieval import VectorRetrievalTool
from core.memory.conversation_memory import ConversationMemoryManager

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """당신은 Mini Civ 게임의 AI 어드바이저입니다.
플레이어에게 전략, 유닛, 건물, 연구에 대한 조언을 제공합니다.
항상 친절하고 유익한 태도로 응답하세요.

게임 관련 지식이 필요하면 벡터 검색 도구를 사용할 수 있습니다.
도구를 통해 얻은 정보를 기반으로 플레이어에게 최선의 조언을 제공하세요.

플레이어는 다음과 같은 질문을 할 수 있습니다:
1. 특정 유닛이나 건물에 대한 정보
2. 전략 추천
3. 게임 메커니즘 설명
4. 특정 상황에서의 조언

게임 정보에 관한 질문이 아니라면, 일반적인 대화로 응답하세요.
"""

class ChatAgent:
    """게임 내 LLM 기반 채팅 에이전트"""
    
    def __init__(
        self,
        memory_manager: Optional[ConversationMemoryManager] = None,
        vector_tool_path: str = "./vector_data"
    ):
        """
        채팅 에이전트 초기화
        
        Args:
            memory_manager: 대화 메모리 관리자 (없으면 새로 생성)
            vector_tool_path: 벡터 DB 경로
        """
        # 벡터 검색 도구 초기화
        self.vector_tool = VectorRetrievalTool(index_path=vector_tool_path)
        self.tools = [self.vector_tool]
        
        # 메모리 관리자 설정
        self.memory_manager = memory_manager or ConversationMemoryManager()
        
        # LLM 인스턴스 설정 (production_llm 사용)
        self.llm = production_llm
        
        # 에이전트 초기화 (에이전트 생성은 get_agent 메서드로 필요시 수행)
        self.agent_executors: Dict[str, Dict[str, AgentExecutor]] = {}
    
    def get_agent(self, game_id: str, player_id: str) -> AgentExecutor:
        """게임과 플레이어 ID에 대한 에이전트 반환, 없으면 생성"""
        if game_id not in self.agent_executors:
            self.agent_executors[game_id] = {}
        
        if player_id not in self.agent_executors[game_id]:
            # 메모리 가져오기
            memory = self.memory_manager.get_or_create_memory(game_id, player_id)
            
            # Gemini 모델을 위한 간단한 에이전트 생성
            # Gemini는 OpenAI와 다르게 CHAT_CONVERSATIONAL_REACT_DESCRIPTION 사용
            agent = initialize_agent(
                llm=self.llm,
                tools=self.tools,
                agent=AgentType.CHAT_CONVERSATIONAL_REACT_DESCRIPTION,
                verbose=True,
                memory=memory,
                handle_parsing_errors=True,
                agent_kwargs={
                    "system_message": SYSTEM_PROMPT
                },
                max_iterations=3
            )
            
            self.agent_executors[game_id][player_id] = agent
        
        return self.agent_executors[game_id][player_id]
    
    async def process_chat(self, game_id: str, player_id: str, message: str) -> str:
        """
        채팅 메시지 처리 및 응답 생성
        
        Args:
            game_id: 게임 ID
            player_id: 플레이어 ID
            message: 사용자 메시지
            
        Returns:
            AI 응답 메시지
        """
        try:
            # 에이전트 가져오기
            agent_executor = self.get_agent(game_id, player_id)
            
            # 에이전트 실행
            response = await agent_executor.ainvoke({"input": message})
            ai_response = response.get("output", "답변을 생성하는 중 오류가 발생했습니다.")
            
            logger.info(f"Generated response for game {game_id}, player {player_id}")
            return ai_response
            
        except Exception as e:
            logger.error(f"Error processing chat: {str(e)}")
            return f"죄송합니다, 메시지 처리 중 오류가 발생했습니다: {str(e)}"
    
    def clear_memory(self, game_id: str, player_id: str) -> None:
        """메모리 초기화"""
        self.memory_manager.clear_memory(game_id, player_id)
        # 에이전트도 재생성 되도록 제거
        if game_id in self.agent_executors and player_id in self.agent_executors[game_id]:
            del self.agent_executors[game_id][player_id]
            logger.info(f"Cleared agent for game {game_id}, player {player_id}")
    
    def clear_game(self, game_id: str) -> None:
        """게임 관련 모든 메모리 및 에이전트 초기화"""
        self.memory_manager.clear_game_memories(game_id)
        if game_id in self.agent_executors:
            del self.agent_executors[game_id]
            logger.info(f"Cleared all agents for game {game_id}")

# 싱글톤 인스턴스 생성
chat_agent = ChatAgent() 