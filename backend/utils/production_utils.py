from typing import Optional, List, Dict, Any
import logging
from core.config import prisma_client

logger = logging.getLogger(__name__)

async def process_production(session_id: str):
    """도시별 생산 진행 처리 함수
    
    매 턴마다 호출되어 모든 도시의 생산 큐를 처리합니다.
    """
    try:
        # 해당 게임의 모든 도시 조회
        cities = await prisma_client.city.find_many(
            where={
                "session_id": session_id
            },
            include={
                "production_queue": {
                    "orderBy": {
                        "queue_order": "asc"
                    }
                },
                "buildings": True
            }
        )
        
        for city in cities:
            # 생산 대기열이 비어있으면 처리하지 않음
            if not city.production_queue:
                continue
            
            # 도시의 생산력 계산
            production_yield = city.production
            
            # 건물 보너스 적용 (Factory 등의 생산력 증가 효과 처리)
            # TODO: 실제 건물 보너스 계산 로직 추가
            for building in city.buildings:
                if building.id == "factory":
                    production_yield += 2
                elif building.id == "workshop":
                    production_yield += 1
            
            # 가장 앞 항목 처리
            front_item = city.production_queue[0]
            
            # 생산력 적용
            updated_turns_left = front_item.turns_left - production_yield
            
            # 완성 체크
            if updated_turns_left <= 0:
                # 오버플로우 계산
                overflow = -updated_turns_left
                
                # 아이템 타입에 따라 처리
                if front_item.itemType == "unit":
                    # 유닛 생성
                    await create_unit(
                        session_id=session_id, 
                        city_id=city.id,
                        owner_player_id=city.owner_player_id,
                        unit_type_id=front_item.itemId,
                        loc_q=city.loc_q, 
                        loc_r=city.loc_r, 
                        loc_s=city.loc_s
                    )
                    logger.info(f"유닛 생산 완료: {front_item.itemId}, 도시: {city.name}")
                    
                elif front_item.itemType == "building":
                    # 건물 생성
                    await add_building_to_city(
                        city_id=city.id,
                        building_type_id=front_item.itemId
                    )
                    logger.info(f"건물 생산 완료: {front_item.itemId}, 도시: {city.name}")
                
                # 완료된 아이템 제거
                await prisma_client.productionQueue.delete(
                    where={"id": front_item.id}
                )
                
                # 큐 순서 재조정
                await update_queue_order(city.id)
                
                # 다음 아이템에 오버플로우 적용
                if len(city.production_queue) > 1:
                    next_item = city.production_queue[1]
                    await prisma_client.productionQueue.update(
                        where={"id": next_item.id},
                        data={
                            "turns_left": max(1, next_item.turns_left - overflow),
                            "queue_order": 0
                        }
                    )
            else:
                # 진행 중인 아이템 업데이트
                await prisma_client.productionQueue.update(
                    where={"id": front_item.id},
                    data={"turns_left": updated_turns_left}
                )
        
        return True
    
    except Exception as e:
        logger.error(f"생산 처리 중 오류 발생: {str(e)}")
        return False

async def create_unit(
    session_id: str, 
    city_id: int,
    owner_player_id: int, 
    unit_type_id: str, 
    loc_q: int, 
    loc_r: int, 
    loc_s: int
) -> Any:
    """유닛 생성 함수"""
    try:
        # 유닛 타입 정보 조회
        unit_type = await prisma_client.unitType.find_unique(
            where={"id": unit_type_id}
        )
        
        if not unit_type:
            logger.error(f"존재하지 않는 유닛 타입: {unit_type_id}")
            return None
        
        # 유닛 생성
        unit = await prisma_client.unit.create(
            data={
                "session_id": session_id,
                "owner_player_id": owner_player_id,
                "unit_type_id": unit_type_id,
                "hp": 100,
                "movement": unit_type.move or 2,
                "max_movement": unit_type.move or 2,
                "status": "대기",
                "loc_q": loc_q,
                "loc_r": loc_r,
                "loc_s": loc_s
            }
        )
        
        return unit
    
    except Exception as e:
        logger.error(f"유닛 생성 중 오류 발생: {str(e)}")
        return None

async def add_building_to_city(city_id: int, building_type_id: str) -> bool:
    """도시에 건물 추가 함수"""
    try:
        # 도시 조회
        city = await prisma_client.city.findUnique(
            where={"id": city_id},
            include={"buildings": True}
        )
        
        if not city:
            logger.error(f"존재하지 않는 도시 ID: {city_id}")
            return False
        
        # 건물 타입 조회
        building_type = await prisma_client.buildingType.findUnique(
            where={"id": building_type_id}
        )
        
        if not building_type:
            logger.error(f"존재하지 않는 건물 타입: {building_type_id}")
            return False
        
        # 이미 같은 건물이 있는지 확인
        for building in city.buildings:
            if building.id == building_type_id:
                logger.warning(f"이미 건물이 존재합니다: {building_type_id}, 도시: {city.name}")
                return False
        
        # 도시에 건물 추가
        await prisma_client.city.update(
            where={"id": city_id},
            data={
                "buildings": {
                    "connect": {"id": building_type_id}
                }
            }
        )
        
        # 건물 효과 적용 (실제 구현에서는 더 복잡한 로직 필요)
        if building_type.effectJson:
            await apply_building_effects(city_id, building_type.effectJson)
        
        return True
    
    except Exception as e:
        logger.error(f"건물 추가 중 오류 발생: {str(e)}")
        return False

async def apply_building_effects(city_id: int, effect_json: Dict[str, Any]) -> bool:
    """건물 효과 적용 함수"""
    try:
        # 도시 조회
        city = await prisma_client.city.findUnique(
            where={"id": city_id}
        )
        
        if not city:
            return False
        
        # 건물 효과 적용 (예시)
        update_data = {}
        
        if "production" in effect_json:
            update_data["production"] = city.production + effect_json["production"]
        
        if "gold" in effect_json:
            update_data["gold"] = city.gold + effect_json["gold"]
        
        if "science" in effect_json:
            update_data["science"] = city.science + effect_json["science"]
        
        # 기타 효과 적용
        
        # 도시 업데이트
        if update_data:
            await prisma_client.city.update(
                where={"id": city_id},
                data=update_data
            )
        
        return True
    
    except Exception as e:
        logger.error(f"건물 효과 적용 중 오류 발생: {str(e)}")
        return False

async def update_queue_order(city_id: int) -> bool:
    """생산 큐 순서 재조정 함수"""
    try:
        # 도시의 생산 큐 조회
        queue_items = await prisma_client.productionQueue.findMany(
            where={"city_id": city_id},
            orderBy={"queue_order": "asc"}
        )
        
        # 순서 재조정
        for i, item in enumerate(queue_items):
            await prisma_client.productionQueue.update(
                where={"id": item.id},
                data={"queue_order": i}
            )
        
        return True
    
    except Exception as e:
        logger.error(f"생산 큐 순서 재조정 중 오류 발생: {str(e)}")
        return False

async def add_to_production_queue(
    city_id: int, 
    item_type: str, 
    item_id: str,
    queue_order: Optional[int] = None
) -> Any:
    """생산 큐에 아이템 추가 함수"""
    try:
        # 도시 정보 조회
        city = await prisma_client.city.findUnique(
            where={"id": city_id}
        )
        
        if not city:
            logger.error(f"존재하지 않는 도시 ID: {city_id}")
            return None
        
        # 생산 비용 계산
        production_cost = 0
        item_name = ""
        
        if item_type == "unit":
            # 유닛 타입 정보 조회
            unit_type = await prisma_client.unitType.findUnique(
                where={"id": item_id}
            )
            
            if not unit_type:
                logger.error(f"존재하지 않는 유닛 타입: {item_id}")
                return None
            
            production_cost = unit_type.productionCost
            item_name = unit_type.name
            
        elif item_type == "building":
            # 건물 타입 정보 조회
            building_type = await prisma_client.buildingType.findUnique(
                where={"id": item_id}
            )
            
            if not building_type:
                logger.error(f"존재하지 않는 건물 타입: {item_id}")
                return None
            
            production_cost = building_type.productionCost
            item_name = building_type.name
        
        # 현재 큐의 마지막 순서 조회
        last_order = 0
        queue_items = await prisma_client.productionQueue.findMany(
            where={"city_id": city_id},
            orderBy={"queue_order": "desc"},
            take=1
        )
        
        if queue_items:
            last_order = queue_items[0].queue_order + 1
        
        # 지정된 순서가 있으면 사용
        if queue_order is not None:
            # 해당 순서 이상의 아이템들 순서 조정
            await prisma_client.productionQueue.updateMany(
                where={
                    "city_id": city_id,
                    "queue_order": {"gte": queue_order}
                },
                data={
                    "queue_order": {"increment": 1}
                }
            )
            last_order = queue_order
        
        # 생산 큐에 아이템 추가
        queue_item = await prisma_client.productionQueue.create(
            data={
                "city_id": city_id,
                "itemType": item_type,
                "itemId": item_id,
                "turns_left": production_cost,
                "queue_order": last_order
            }
        )
        
        return queue_item
    
    except Exception as e:
        logger.error(f"생산 큐 아이템 추가 중 오류 발생: {str(e)}")
        return None 