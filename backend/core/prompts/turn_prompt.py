from langchain.prompts import PromptTemplate

ai_turn_prompt = PromptTemplate(
    input_variables=["current_game_state", "turn_number"],
    template="""
    현재 게임 상태와 턴 번호를 고려하여 각 AI 문명의 1턴 행동을 생성하세요:
    
    현재 게임 상태: {current_game_state}
    현재 턴: {turn_number}
    
    각 AI 문명에 대해 다음 사항을 고려하세요:
    - 도시 생산
    - 유닛 이동
    - 기술 연구
    - 자원 관리
    - 탐험 및 시야 확장
    
    JSON 형식으로 응답해야 합니다: 
    {제공된 JSON 구조와 동일}
    """
)