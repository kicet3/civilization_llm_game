from typing import Dict, List, Any, Optional, Tuple
import random
from datetime import datetime
from models.game import GameTurnInfo, GamePhase, GameSpeed
from utils.scenario_manager import get_turn_info, calculate_turn_year, check_objective_completion
from core.config import prisma_client
from utils.production_utils import process_production

async def process_turn_end(game_id: str, player_id: str) -> Dict[str, Any]:
    """플레이어 턴 종료 처리"""
    # 1. 게임 세션 정보 조회
    game_session = await prisma_client.gamesession.find_unique(
        where={"id": game_id},
        include={"players": True}
    )
    
    if not game_session:
        raise ValueError(f"게임 세션을 찾을 수 없습니다: {game_id}")
    
    # 2. 현재 턴 정보 업데이트
    current_turn = game_session.current_turn
    next_turn = current_turn + 1
    
    # 3. 시나리오 정보 조회 (DB에서 조회 또는 생성)
    scenario = await get_or_create_scenario(game_id)
    
    # 4. 플레이어 자원 업데이트
    await update_player_resources(game_id, player_id)
    
    # 4.1. 유닛 이동력 회복 및 상태 리셋
    await reset_units(game_id)
    
    # 5. 연구 진행 업데이트
    research_events = await update_research_progress(game_id, player_id)
    
    # 6. AI 턴 처리
    ai_actions = await process_ai_turns(game_id, current_turn)
    
    # 7. 게임 이벤트 생성
    events = generate_game_events(game_id, current_turn, scenario.speed)
    
    # 연구 관련 이벤트 추가
    if research_events:
        events.extend(research_events)
    
    # 8. 다음 턴 정보 생성
    current_phase, objectives, recommended_actions = get_turn_info(scenario, next_turn)
    turn_year = calculate_turn_year(next_turn, scenario.speed)
    
    # 9. 게임 세션 턴 업데이트
    await prisma_client.gamesession.update(
        where={"id": game_id},
        data={
            "current_turn": next_turn,
            "updated_at": datetime.now()
        }
    )
    
    # 10. 턴 정보 반환
    turn_info = GameTurnInfo(
        turn=next_turn,
        phase=current_phase,
        year=turn_year,
        objectives=objectives,
        recommended_actions=recommended_actions
    )
    
    return {
        "game_id": game_id,
        "next_turn": next_turn,
        "turn_info": turn_info.dict(),
        "events": events,
        "ai_actions": ai_actions
    }

async def update_research_progress(game_id: str, player_id: str) -> List[Dict[str, Any]]:
    """플레이어 연구 진행 상태 업데이트"""
    # 연구 관련 이벤트를 저장할 리스트
    research_events = []
    
    # 현재 연구 중인 기술 확인
    current_research = await prisma_client.researchprogress.find_first(
        where={
            "game_id": game_id,
            "player_id": player_id,
            "completed": False
        },
        include={
            "tech": True
        }
    )
    
    if not current_research:
        return research_events  # 연구 중인 기술 없음
    
    # 플레이어 과학 생산량 계산 (도시 합계)
    cities = await prisma_client.city.find_many(
        where={
            "session_id": game_id,
            "owner_player_id": int(player_id)
        }
    )
    
    science_points = sum(city.science for city in cities) if cities else 3  # 기본 3점
    
    # 연구 진행도 업데이트
    new_progress = current_research.progress + science_points
    
    # 기술 연구 완료 여부 확인
    if new_progress >= current_research.tech.cost:
        # 연구 완료 처리
        await prisma_client.researchedtech.create(
            data={
                "game_id": game_id,
                "player_id": player_id,
                "tech_id": current_research.tech_id,
                "completed_at": datetime.now()
            }
        )
        
        # 연구 진행 정보 삭제
        await prisma_client.researchprogress.delete(
            where={"id": current_research.id}
        )
        
        # 연구 완료 이벤트 추가
        research_events.append({
            "type": "research_completed",
            "title": f"연구 완료: {current_research.tech.name}",
            "description": f"{current_research.tech.name} 기술 연구를 완료했습니다.",
            "severity": "success",
            "tech_id": current_research.tech_id,
            "tech_name": current_research.tech.name
        })
        
        # 새로 연구 가능해진 기술 확인
        newly_available = await check_newly_available_techs(game_id, player_id, current_research.tech_id)
        
        if newly_available:
            tech_names = [tech["name"] for tech in newly_available]
            research_events.append({
                "type": "techs_unlocked",
                "title": "새로운 연구 가능",
                "description": f"새롭게 연구 가능한 기술: {', '.join(tech_names)}",
                "severity": "info",
                "techs": newly_available
            })
    else:
        # 연구 진행 중 업데이트
        await prisma_client.researchprogress.update(
            where={"id": current_research.id},
            data={
                "progress": new_progress,
                "updated_at": datetime.now()
            }
        )
        
        # 연구 진행 이벤트 추가
        progress_percent = int((new_progress / current_research.tech.cost) * 100)
        turns_left = max(1, int((current_research.tech.cost - new_progress) / science_points))
        
        research_events.append({
            "type": "research_progress",
            "title": f"연구 진행: {current_research.tech.name}",
            "description": f"{current_research.tech.name} 연구 진행도: {progress_percent}% (예상 {turns_left}턴 남음)",
            "severity": "info",
            "tech_id": current_research.tech_id,
            "tech_name": current_research.tech.name,
            "progress": new_progress,
            "cost": current_research.tech.cost,
            "percent": progress_percent,
            "turns_left": turns_left
        })
    
    return research_events

async def check_newly_available_techs(game_id: str, player_id: str, completed_tech_id: str) -> List[Dict[str, Any]]:
    """기술 연구 완료 후 새롭게 연구 가능해진 기술 목록 반환"""
    # 완료된 기술을 선행으로 하는 기술 목록 조회
    dependent_techs = await prisma_client.techprerequisite.find_many(
        where={
            "prereq_id": completed_tech_id
        },
        include={
            "tech": True
        }
    )
    
    if not dependent_techs:
        return []
    
    # 이미 연구한 기술 ID 목록
    researched = await prisma_client.researchedtech.find_many(
        where={
            "game_id": game_id,
            "player_id": player_id
        }
    )
    researched_tech_ids = [rt.tech_id for rt in researched]
    
    # 새롭게 연구 가능해진 기술 목록
    newly_available = []
    
    for dependent in dependent_techs:
        # 이미 연구한 기술은 제외
        if dependent.tech_id in researched_tech_ids:
            continue
        
        # 해당 기술의 모든 선행 기술 조회
        all_prereqs = await prisma_client.techprerequisite.find_many(
            where={
                "tech_id": dependent.tech_id
            }
        )
        
        # 모든 선행 기술이 연구되었는지 확인
        all_prereqs_researched = True
        
        for prereq in all_prereqs:
            if prereq.prereq_id not in researched_tech_ids and prereq.prereq_id != completed_tech_id:
                all_prereqs_researched = False
                break
        
        if all_prereqs_researched:
            newly_available.append({
                "id": dependent.tech_id,
                "name": dependent.tech.name,
                "era": dependent.tech.era,
                "cost": dependent.tech.cost
            })
    
    return newly_available

async def get_or_create_scenario(game_id: str):
    """게임 시나리오 조회 또는 생성"""
    # 실제 구현에서는 DB에서 시나리오 정보를 조회하고, 없으면 생성하는 로직 필요
    # 여기서는 메모리에 있는 시나리오 정보 반환 가정
    from utils.scenario_manager import create_game_scenario
    
    # 게임 세션 정보 조회
    game_session = await prisma_client.gamesession.find_unique(
        where={"id": game_id}
    )
    
    # 게임 속도에 따른 시나리오 생성
    from models.game import GameSpeed
    speed = GameSpeed(game_session.game_mode_id)
    
    # 시나리오 생성 또는 조회
    scenario = create_game_scenario(game_id, speed)
    return scenario

async def update_player_resources(game_id: str, player_id: str):
    """플레이어 자원 업데이트"""
    # 플레이어가 소유한 도시들 조회
    cities = await prisma_client.city.find_many(
        where={
            "session_id": game_id,
            "owner_player_id": int(player_id)
        }
    )
    
    # 플레이어 자원 업데이트
    total_food = sum(city.food for city in cities)
    total_production = sum(city.production for city in cities)
    total_gold = sum(city.gold for city in cities)
    total_science = sum(city.science for city in cities)
    total_culture = sum(city.culture for city in cities)
    
    # 실제 DB 업데이트는 필요한 테이블 구조에 맞게 구현해야 함
    # 여기서는 간략화된 예시만 제공
    
    # 도시 생산 진행 처리
    for city in cities:
        # 생산 진행 로직
        pass
    
    return {
        "food": total_food,
        "production": total_production,
        "gold": total_gold,
        "science": total_science,
        "culture": total_culture
    }

async def process_ai_turns(game_id: str, current_turn: int) -> List[Dict[str, Any]]:
    """AI 플레이어 턴 처리"""
    # AI 플레이어 조회
    ai_players = await prisma_client.player.find_many(
        where={
            "session_id": game_id,
            "is_ai": True
        }
    )
    
    ai_actions = []
    
    # 각 AI 플레이어에 대한 액션 처리
    for ai_player in ai_players:
        # AI 도시 및 유닛 조회
        ai_cities = await prisma_client.city.find_many(
            where={
                "session_id": game_id,
                "owner_player_id": ai_player.id
            }
        )
        
        ai_units = await prisma_client.unit.find_many(
            where={
                "session_id": game_id,
                "owner_player_id": ai_player.id
            }
        )
        
        # AI 로직 - 여기서는 간단한 예시
        actions = generate_ai_actions(ai_player, ai_cities, ai_units, current_turn)
        
        for action in actions:
            # 실제 게임 상태에 AI 액션 적용
            await apply_ai_action(game_id, ai_player.id, action)
            
            # 액션 기록
            ai_actions.append({
                "player_id": ai_player.id,
                "player_name": ai_player.civ_type,
                "action_type": action["type"],
                "description": action["description"],
                "details": action["details"]
            })
    
    return ai_actions

def generate_ai_actions(ai_player, cities, units, current_turn) -> List[Dict[str, Any]]:
    """AI 액션 생성"""
    actions = []
    
    # 간단한 AI 의사결정 로직
    # 턴 번호와 AI가 가진 자원에 따라 다른 결정
    
    # 도시 건설
    if current_turn < 10 and len(cities) < 3 and random.random() < 0.3:
        actions.append({
            "type": "found_city",
            "description": f"{ai_player.civ_type}이(가) 새로운 도시를 건설했습니다.",
            "details": {
                "city_name": f"{ai_player.civ_type} Colony {len(cities) + 1}"
            }
        })
    
    # 건물 건설
    if cities and random.random() < 0.4:
        city = random.choice(cities)
        buildings = ["Granary", "Library", "Market", "Barracks", "Walls"]
        building = random.choice(buildings)
        
        actions.append({
            "type": "build_building",
            "description": f"{ai_player.civ_type}이(가) {city.name}에 {building}을(를) 건설했습니다.",
            "details": {
                "city_id": city.id,
                "building": building
            }
        })
    
    # 유닛 생산
    if cities and random.random() < 0.3:
        city = random.choice(cities)
        unit_types = ["Warrior", "Archer", "Settler", "Worker", "Spearman"]
        unit_type = random.choice(unit_types)
        
        actions.append({
            "type": "train_unit",
            "description": f"{ai_player.civ_type}이(가) {city.name}에서 {unit_type}을(를) 생산했습니다.",
            "details": {
                "city_id": city.id,
                "unit_type": unit_type
            }
        })
    
    # 유닛 이동
    if units and random.random() < 0.5:
        unit = random.choice(units)
        directions = [(1, 0, -1), (1, -1, 0), (0, -1, 1), (-1, 0, 1), (-1, 1, 0), (0, 1, -1)]
        direction = random.choice(directions)
        
        actions.append({
            "type": "move_unit",
            "description": f"{ai_player.civ_type}의 유닛이 이동했습니다.",
            "details": {
                "unit_id": unit.id,
                "from": {"q": unit.loc_q, "r": unit.loc_r, "s": unit.loc_s},
                "to": {"q": unit.loc_q + direction[0], "r": unit.loc_r + direction[1], "s": unit.loc_s + direction[2]}
            }
        })
    
    # 연구 진행
    research_options = ["Agriculture", "Pottery", "Mining", "Sailing", "Writing"]
    research = random.choice(research_options)
    
    actions.append({
        "type": "research",
        "description": f"{ai_player.civ_type}이(가) {research} 기술을 연구하고 있습니다.",
        "details": {
            "technology": research
        }
    })
    
    return actions

async def apply_ai_action(game_id: str, ai_player_id: int, action: Dict[str, Any]):
    """AI 액션을 실제 게임 상태에 적용"""
    action_type = action["type"]
    details = action["details"]
    
    if action_type == "found_city":
        # 새 도시 위치 선택 로직
        # 실제로는 더 복잡한 로직 필요
        q, r = random.randint(5, 15), random.randint(5, 15)
        s = -q - r
        
        # 도시 생성
        await prisma_client.city.create(
            data={
                "session_id": game_id,
                "name": details["city_name"],
                "owner_player_id": ai_player_id,
                "population": 1,
                "loc_q": q,
                "loc_r": r,
                "loc_s": s,
                "hp": 100,
                "defense": 10,
                "food": 2,
                "production": 2,
                "gold": 2,
                "science": 1,
                "culture": 1,
                "faith": 1,
                "happiness": 10
            }
        )
    
    elif action_type == "move_unit":
        # 유닛 이동
        unit_id = details["unit_id"]
        to_q = details["to"]["q"]
        to_r = details["to"]["r"]
        to_s = details["to"]["s"]
        
        # 유닛 위치 업데이트
        await prisma_client.unit.update(
            where={"id": unit_id},
            data={
                "loc_q": to_q,
                "loc_r": to_r,
                "loc_s": to_s,
                "status": "이동 완료"
            }
        )
    
    # 다른 액션들도 유사하게 구현
    
    return True

def generate_game_events(game_id: str, current_turn: int, game_speed: GameSpeed) -> List[Dict[str, Any]]:
    """게임 이벤트 생성"""
    events = []
    
    # 기본 턴 이벤트
    events.append({
        "type": "turn_progress",
        "title": f"턴 {current_turn} 완료",
        "description": f"게임이 {current_turn}턴에서 {current_turn + 1}턴으로 진행합니다.",
        "severity": "info"
    })
    
    # 현재 연도 계산
    year = calculate_turn_year(current_turn + 1, game_speed)
    events.append({
        "type": "year_update",
        "title": f"게임 내 연도: {year}년",
        "description": f"게임 내 시간이 {year}년으로 진행되었습니다.",
        "severity": "info"
    })
    
    # 랜덤 이벤트 (15% 확률)
    if random.random() < 0.15:
        random_events = [
            {
                "type": "natural_disaster",
                "title": "자연재해",
                "description": "폭풍우가 지역을 강타했습니다. 일부 타일의 생산량이 감소했습니다.",
                "severity": "warning"
            },
            {
                "type": "resource_discovery",
                "title": "자원 발견",
                "description": "탐험가들이 새로운 자원 매장지를 발견했습니다!",
                "severity": "success"
            },
            {
                "type": "cultural_festival",
                "title": "문화 축제",
                "description": "문화 축제가 개최되어 문화 생산량이 일시적으로 증가합니다.",
                "severity": "success"
            },
            {
                "type": "barbarian_attack",
                "title": "야만인 습격",
                "description": "야만인들이 국경 지역을 습격했습니다. 방어가 필요합니다!",
                "severity": "danger"
            }
        ]
        events.append(random.choice(random_events))
    
    # 게임 단계 변화 이벤트
    turn_ranges = {
        GameSpeed.QUICK: [(1, 5), (6, 15), (16, 25)],
        GameSpeed.STANDARD: [(1, 10), (11, 30), (31, 50)],
        GameSpeed.EPIC: [(1, 20), (21, 60), (61, 80), (81, 100)]
    }
    
    phase_names = {
        GamePhase.EARLY: "개막기",
        GamePhase.MID: "중반기",
        GamePhase.FINAL: "후반 중기",
        GamePhase.LATE: "종반기"
    }
    
    # 다음 턴이 새로운 단계의 시작인지 확인
    next_turn = current_turn + 1
    for i, (start, end) in enumerate(turn_ranges[game_speed]):
        if next_turn == start:
            phase = list(GamePhase)[i]
            events.append({
                "type": "phase_change",
                "title": f"게임 단계 변화: {phase_names[phase]}",
                "description": f"게임이 새로운 단계로 진입했습니다. 새로운 목표와 기회가 기다리고 있습니다!",
                "severity": "important"
            })
            break
    
    return events

async def reset_units(game_id: str):
    """게임 내 모든 유닛의 이동력 회복 및 상태를 대기로 리셋합니다."""
    # 해당 게임 세션의 모든 유닛 조회
    units = await prisma_client.unit.find_many(
        where={"session_id": game_id}
    )
    from models.unit import UnitStatus
    # 각 유닛 이동력과 상태 초기화
    for unit in units:
        await prisma_client.unit.update(
            where={"id": unit.id},
            data={
                "movement": unit.max_movement,
                "status": UnitStatus.IDLE.value
            }
        )

async def process_turn(game_id: str):
    """턴 처리 함수"""
    try:
        # 턴 증가
        await increment_turn(game_id)
        
        # 도시 턴 처리 (인구, 식량, 생산력 등)
        await process_cities(game_id)
        
        # 생산 처리 (유닛 및 건물 생산)
        await process_production(game_id)
        
        # 유닛 턴 처리 (이동력 회복 등)
        await process_units(game_id)
        
        # 연구 진행
        await process_research(game_id)
        
        # AI 턴 처리
        await process_ai_turn(game_id)
        
        # 플레이어 상태 업데이트
        await update_player_status(game_id)
        
        # 이벤트 처리
        await check_events(game_id)
        
        return True
    
    except Exception as e:
        logger.error(f"턴 처리 중 오류 발생: {str(e)}")
        return False 