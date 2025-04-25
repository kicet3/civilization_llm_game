from typing import Dict, List, Any, Optional, Tuple
from models.game import GameSpeed, GamePhase, TurnPhaseInfo, ScenarioObjective, GameScenario
import random

# 25턴 게임 시나리오 템플릿
QUICK_SCENARIO = [
    {
        "phase": GamePhase.EARLY,
        "turn_range": [1, 5],
        "main_goal": "탐험·초기 정착",
        "keywords": ["탐험", "초기 정착", "자원 확보"],
        "objectives": [
            {
                "id": "explore_12_tiles",
                "description": "수도 주변 12칸 내 자원 탐색",
                "category": "exploration",
                "reward": {"science": 10}
            },
            {
                "id": "found_second_city",
                "description": "두 번째 도시 정착 (food/production 집중)",
                "category": "expansion",
                "reward": {"gold": 50}
            }
        ]
    },
    {
        "phase": GamePhase.MID,
        "turn_range": [6, 15],
        "main_goal": "확장·생산 가속",
        "keywords": ["확장", "생산 가속", "연구 우선순위"],
        "objectives": [
            {
                "id": "research_theology",
                "description": "Theology 연구 완료",
                "category": "research",
                "reward": {"faith": 15}
            },
            {
                "id": "research_masonry",
                "description": "Masonry 연구 완료",
                "category": "research",
                "reward": {"production": 5}
            },
            {
                "id": "found_three_cities",
                "description": "최소 3개 도시 확보",
                "category": "expansion",
                "reward": {"culture": 20}
            },
            {
                "id": "build_market_monastery",
                "description": "시장·수도원 건설",
                "category": "economy",
                "reward": {"gold": 30, "faith": 15}
            }
        ]
    },
    {
        "phase": GamePhase.LATE,
        "turn_range": [16, 25],
        "main_goal": "결정적 행보·승리 준비",
        "keywords": ["군사력", "승리 준비", "문명 견제"],
        "objectives": [
            {
                "id": "train_knights",
                "description": "기사 유닛 2개 생산",
                "category": "military",
                "reward": {"production": 10}
            },
            {
                "id": "train_crossbowmen",
                "description": "석궁병 유닛 3개 생산",
                "category": "military",
                "reward": {"gold": 30}
            },
            {
                "id": "select_victory_path",
                "description": "승리 전략 선택 (정복/문화/과학)",
                "category": "strategy",
                "reward": {"science": 15, "culture": 15, "gold": 15}
            }
        ]
    }
]

# 50턴 게임 시나리오 템플릿
STANDARD_SCENARIO = [
    {
        "phase": GamePhase.EARLY,
        "turn_range": [1, 10],
        "main_goal": "탐험·다중 정착",
        "keywords": ["탐험", "다중 정착", "자원 발견"],
        "objectives": [
            {
                "id": "discover_continents",
                "description": "3개 외부 대륙 스팟 발견",
                "category": "exploration",
                "reward": {"science": 15}
            },
            {
                "id": "found_cities",
                "description": "수도 외 도시 2-3개 설립, 주변 자원 확보",
                "category": "expansion",
                "reward": {"gold": 75}
            }
        ]
    },
    {
        "phase": GamePhase.MID,
        "turn_range": [11, 30],
        "main_goal": "경제·연구 밸런스",
        "keywords": ["경제", "연구", "외교"],
        "objectives": [
            {
                "id": "research_trade",
                "description": "Trade 연구 완료",
                "category": "research",
                "reward": {"gold": 50}
            },
            {
                "id": "research_market",
                "description": "Market 연구 완료",
                "category": "research",
                "reward": {"gold": 30}
            },
            {
                "id": "research_horseback",
                "description": "Horseback Riding 연구 완료",
                "category": "research",
                "reward": {"production": 15}
            },
            {
                "id": "build_factory",
                "description": "공장(Factory) 건설 준비 및 자원 배치",
                "category": "economy",
                "reward": {"production": 20}
            },
            {
                "id": "establish_diplomacy",
                "description": "외교 루트 개척(과학·문화 조약 제안)",
                "category": "diplomacy",
                "reward": {"science": 20, "culture": 20}
            }
        ]
    },
    {
        "phase": GamePhase.LATE,
        "turn_range": [31, 50],
        "main_goal": "확장 또는 집중 육성",
        "keywords": ["군사력", "동맹", "승리 유형"],
        "objectives": [
            {
                "id": "mass_produce_units",
                "description": "머스킷병·대포 대량생산",
                "category": "military",
                "reward": {"production": 25}
            },
            {
                "id": "form_alliance",
                "description": "외교 동맹·제국 이익 조율 혹은 전면전",
                "category": "diplomacy",
                "reward": {"gold": 50, "science": 20}
            },
            {
                "id": "focus_victory",
                "description": "승리 유형 확정 후 해당 빌딩 강화",
                "category": "strategy",
                "reward": {"culture": 30, "science": 30, "gold": 30}
            }
        ]
    }
]

# 100턴 게임 시나리오 템플릿
EPIC_SCENARIO = [
    {
        "phase": GamePhase.EARLY,
        "turn_range": [1, 20],
        "main_goal": "탐험·세분화된 정착",
        "keywords": ["탐험", "세분화된 정착", "바다 경로"],
        "objectives": [
            {
                "id": "explore_map",
                "description": "맵 20% 이상 탐색, 바다 경로 확보",
                "category": "exploration",
                "reward": {"science": 20}
            },
            {
                "id": "found_specialized_cities",
                "description": "전략 자원별 특화 도시 건설(iron, horse, wheat 스페셜티)",
                "category": "expansion",
                "reward": {"production": 30, "food": 30}
            }
        ]
    },
    {
        "phase": GamePhase.MID,
        "turn_range": [21, 60],
        "main_goal": "산업화·제국주의 초입",
        "keywords": ["산업화", "제국주의", "경제 발전"],
        "objectives": [
            {
                "id": "research_industrialization",
                "description": "Industrialization→Factory 연구 완료",
                "category": "research",
                "reward": {"production": 30}
            },
            {
                "id": "research_scientific",
                "description": "Scientific Method→Research Lab 연구 완료",
                "category": "research",
                "reward": {"science": 40}
            },
            {
                "id": "build_bank",
                "description": "은행(Bank) 설립으로 금고 축적",
                "category": "economy",
                "reward": {"gold": 75}
            },
            {
                "id": "mid_war",
                "description": "중간 전쟁 혹은 문화 동맹 체결",
                "category": "diplomacy",
                "reward": {"culture": 30, "military": 30}
            }
        ]
    },
    {
        "phase": GamePhase.FINAL,
        "turn_range": [61, 80],
        "main_goal": "현대로 이행 준비",
        "keywords": ["현대화", "과학 발전", "여론전"],
        "objectives": [
            {
                "id": "research_combustion",
                "description": "Combustion→Tank, Flight→Fighter 연구",
                "category": "research",
                "reward": {"science": 50}
            },
            {
                "id": "build_broadcast",
                "description": "방송국(Broadcast Tower)·Propaganda Center 건설",
                "category": "culture",
                "reward": {"culture": 40, "happiness": 10}
            },
            {
                "id": "start_propaganda",
                "description": "여론전 개시",
                "category": "diplomacy",
                "reward": {"influence": 30}
            }
        ]
    },
    {
        "phase": GamePhase.LATE,
        "turn_range": [81, 100],
        "main_goal": "최종 승리 경합",
        "keywords": ["최종 승리", "과학", "외교", "전면전"],
        "objectives": [
            {
                "id": "scientific_victory",
                "description": "과학 승리: Advanced Research Lab 집중 연구",
                "category": "science",
                "reward": {"science": 100}
            },
            {
                "id": "diplomatic_victory",
                "description": "외교 승리: 유엔 스타일 의회 소집 및 투표 공작",
                "category": "diplomacy",
                "reward": {"gold": 100, "influence": 50}
            },
            {
                "id": "domination_victory",
                "description": "전면전: 탱크·전투기 대량 생산 후 결전",
                "category": "military",
                "reward": {"production": 75, "military": 50}
            }
        ]
    }
]

def create_game_scenario(game_id: str, speed: GameSpeed) -> GameScenario:
    """게임 속도에 맞는 시나리오 템플릿 생성"""
    
    if speed == GameSpeed.QUICK:
        template = QUICK_SCENARIO
    elif speed == GameSpeed.STANDARD:
        template = STANDARD_SCENARIO
    else:  # GameSpeed.EPIC
        template = EPIC_SCENARIO
    
    # 템플릿을 TurnPhaseInfo 객체로 변환
    phases = []
    for phase_data in template:
        objectives = [
            ScenarioObjective(
                id=obj["id"],
                description=obj["description"],
                category=obj["category"],
                reward=obj["reward"]
            )
            for obj in phase_data["objectives"]
        ]
        
        phase_info = TurnPhaseInfo(
            phase=phase_data["phase"],
            turn_range=phase_data["turn_range"],
            main_goal=phase_data["main_goal"],
            keywords=phase_data["keywords"],
            objectives=objectives
        )
        phases.append(phase_info)
    
    # 게임 시나리오 생성
    return GameScenario(
        game_id=game_id,
        speed=speed,
        phases=phases,
        current_phase=GamePhase.EARLY
    )

def get_turn_info(scenario: GameScenario, current_turn: int) -> Tuple[GamePhase, List[Dict[str, Any]], List[str]]:
    """현재 턴에 해당하는 게임 단계와 목표 반환"""
    current_phase = None
    current_objectives = []
    
    # 현재 턴에 해당하는 단계 찾기
    for phase in scenario.phases:
        if phase.turn_range[0] <= current_turn <= phase.turn_range[1]:
            current_phase = phase.phase
            current_objectives = [
                {
                    "id": obj.id,
                    "description": obj.description,
                    "completed": obj.completed,
                    "category": obj.category
                }
                for obj in phase.objectives
            ]
            break
    
    # 추천 액션 생성 (실제로는 더 복잡한 로직이 필요)
    recommended_actions = generate_recommended_actions(current_phase, current_turn, scenario.speed)
    
    return current_phase, current_objectives, recommended_actions

def generate_recommended_actions(phase: GamePhase, turn: int, speed: GameSpeed) -> List[str]:
    """현재 턴과 게임 단계에 맞는 추천 액션 생성"""
    # 기본 추천 액션
    actions = []
    
    # 단계별 기본 추천 액션
    if phase == GamePhase.EARLY:
        actions = [
            "주변 지역을 탐험하여 자원과 도시 위치를 파악하세요",
            "양질의 자원이 있는 곳에 새 도시를 건설하세요",
            "기본 건물(창고, 도서관)을 지어 성장 기반을 마련하세요"
        ]
    elif phase == GamePhase.MID:
        actions = [
            "핵심 연구에 집중하여 중요 유닛과 건물을 해금하세요",
            "외교 관계를 구축하고 유리한 무역 경로를 확보하세요",
            "도시 특성화를 통해 자원 생산 효율을 최적화하세요"
        ]
    elif phase == GamePhase.FINAL:
        actions = [
            "현대화를 위한 핵심 기술에 집중하세요",
            "문화적 영향력이나 군사력을 확장하세요",
            "미래 승리 조건을 위한 중요 건물을 준비하세요"
        ]
    elif phase == GamePhase.LATE:
        actions = [
            "선택한 승리 조건에 집중적으로 자원을 투자하세요",
            "경쟁 문명의 승리를 저지하기 위한 전략을 실행하세요",
            "최종 결전을 위한 군사력을 집중시키거나 문화/과학/외교에 모든 자원을 쏟으세요"
        ]
    
    # 게임 특수 상황 기반 추가 액션 (예시)
    special_actions = [
        "적대적인 문명과 국경을 맞대고 있다면 방어 시설을 강화하세요",
        "문화 승리를 노리는 경우 도시별 특화 전략을 고려하세요",
        "과학 승리를 위해서는 연구 시설에 중점을 두세요"
    ]
    
    # 무작위로 하나의 특수 액션 추가
    actions.append(random.choice(special_actions))
    
    return actions

def check_objective_completion(scenario: GameScenario, objective_id: str) -> bool:
    """목표 완료 여부 체크 및 업데이트"""
    for phase in scenario.phases:
        for objective in phase.objectives:
            if objective.id == objective_id:
                if not objective.completed:
                    objective.completed = True
                    return True
    return False

def calculate_turn_year(turn: int, speed: GameSpeed) -> int:
    """현재 턴에 해당하는 게임 내 연도 계산"""
    base_year = -4000  # 게임 시작 연도
    
    if speed == GameSpeed.QUICK:
        year_per_turn = 160  # 25턴 게임: 턴당 160년
    elif speed == GameSpeed.STANDARD:
        year_per_turn = 80   # 50턴 게임: 턴당 80년
    else:  # GameSpeed.EPIC
        year_per_turn = 40   # 100턴 게임: 턴당 40년
    
    current_year = base_year + (turn * year_per_turn)
    
    return current_year 