from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from prisma.models import City, ProductionQueue
from models.city import CityResponse, CityProduceRequest, CitySpecializeRequest
from core.config import prisma_client

router = APIRouter()

@router.get("", response_model=Dict[str, Any])
async def get_cities(gameId: str):
    """특정 게임 세션의 모든 도시 정보 반환"""
    try:
        # 도시 정보 조회
        cities = await prisma_client.city.find_many(
            where={"session_id": gameId},
            include={
                "production_queue": {
                    "orderBy": {"queue_order": "asc"}
                }
            }
        )
        
        city_responses = []
        for city in cities:
            # 생산 대기열 변환
            production_queue = [
                {
                    "name": item.item_name,
                    "turnsLeft": item.turns_left
                }
                for item in city.production_queue
            ]
            
            city_responses.append({
                "id": city.id,
                "name": city.name,
                "population": city.population,
                "hp": city.hp or 100,
                "defense": city.defense or 0,
                "food": city.food or 0,
                "production": city.production or 0,
                "gold": city.gold or 0,
                "science": city.science or 0,
                "culture": city.culture or 0,
                "faith": city.faith or 0,
                "happiness": city.happiness or 0,
                "currentProduction": production_queue[0]["name"] if production_queue else None,
                "turnsLeft": production_queue[0]["turnsLeft"] if production_queue else None,
                "productionQueue": production_queue,
                "foodToNextPop": city.food_to_next_pop or 10,
                "cultureToNextBorder": city.culture_to_next_border or 10,
                # 도시 위치 정보 추가
                "location": {
                    "q": city.loc_q or 0,
                    "r": city.loc_r or 0,
                    "s": city.loc_s or 0
                }
            })
        
        return {"cities": city_responses}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"도시 정보 조회 중 오류 발생: {str(e)}"
        )

@router.post("/produce", response_model=Dict[str, Any])
async def city_produce(request: CityProduceRequest):
    """도시 생산 항목 추가"""
    try:
        # 도시 존재 여부 확인
        city = await prisma_client.city.find_unique(
            where={"id": int(request.cityId)},
            include={"production_queue": True}
        )
        
        if not city:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="해당 도시를 찾을 수 없습니다"
            )
        
        # 생산 타입에 따른 턴 소요량 계산 (실제로는 더 복잡한 계산 필요)
        turns_left = 0
        if request.type == "building":
            turns_left = 5  # 건물 생산 기본 턴
        elif request.type == "unit":
            turns_left = 3  # 유닛 생산 기본 턴
        elif request.type == "wonder":
            turns_left = 10  # 불가사의 생산 기본 턴
        else:
            turns_left = 4  # 기타 항목
        
        # 현재 생산 대기열의 마지막 순서 조회
        queue_order = 1
        if city.production_queue:
            queue_order = max([item.queue_order for item in city.production_queue]) + 1
        
        # 생산 대기열에 항목 추가
        new_queue_item = await prisma_client.productionqueue.create(
            data={
                "city_id": int(request.cityId),
                "item_name": request.item,
                "turns_left": turns_left,
                "queue_order": queue_order
            }
        )
        
        # 업데이트된 도시 정보 반환
        updated_city = await prisma_client.city.find_unique(
            where={"id": int(request.cityId)},
            include={"production_queue": {
                "orderBy": {"queue_order": "asc"}
            }}
        )
        
        # 생산 대기열 변환
        production_queue = [
            {
                "name": item.item_name,
                "turnsLeft": item.turns_left
            }
            for item in updated_city.production_queue
        ]
        
        return {
            "city": {
                "id": updated_city.id,
                "name": updated_city.name,
                "population": updated_city.population,
                "hp": updated_city.hp or 100,
                "defense": updated_city.defense or 0,
                "food": updated_city.food or 0,
                "production": updated_city.production or 0,
                "gold": updated_city.gold or 0,
                "science": updated_city.science or 0,
                "culture": updated_city.culture or 0,
                "faith": updated_city.faith or 0,
                "happiness": updated_city.happiness or 0,
                "currentProduction": production_queue[0]["name"] if production_queue else None,
                "turnsLeft": production_queue[0]["turnsLeft"] if production_queue else None,
                "productionQueue": production_queue,
                "foodToNextPop": updated_city.food_to_next_pop or 10,
                "cultureToNextBorder": updated_city.culture_to_next_border or 10,
                # 도시 위치 정보 추가
                "location": {
                    "q": updated_city.loc_q or 0,
                    "r": updated_city.loc_r or 0,
                    "s": updated_city.loc_s or 0
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"도시 생산 항목 추가 중 오류 발생: {str(e)}"
        )

@router.post("/specialize", response_model=Dict[str, Any])
async def city_specialize(request: CitySpecializeRequest):
    """도시 특화 방향 설정"""
    try:
        # 도시 존재 여부 확인
        city = await prisma_client.city.find_unique(
            where={"id": int(request.cityId)}
        )
        
        if not city:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="해당 도시를 찾을 수 없습니다"
            )
        
        # 도시 특화 방향 업데이트
        updated_city = await prisma_client.city.update(
            where={"id": int(request.cityId)},
            data={"specialization": request.specialization}
        )
        
        # 업데이트된 도시 정보와 생산 대기열 조회
        city_with_queue = await prisma_client.city.find_unique(
            where={"id": int(request.cityId)},
            include={"production_queue": {
                "orderBy": {"queue_order": "asc"}
            }}
        )
        
        # 생산 대기열 변환
        production_queue = [
            {
                "name": item.item_name,
                "turnsLeft": item.turns_left
            }
            for item in city_with_queue.production_queue
        ]
        
        # 특화에 따른 산출량 조정 (실제 게임 로직에서는 더 복잡한 계산 필요)
        food_bonus = 0
        production_bonus = 0
        gold_bonus = 0
        science_bonus = 0
        culture_bonus = 0
        faith_bonus = 0
        
        if request.specialization == "food":
            food_bonus = 2
        elif request.specialization == "production":
            production_bonus = 2
        elif request.specialization == "gold":
            gold_bonus = 2
        elif request.specialization == "science":
            science_bonus = 2
        elif request.specialization == "culture":
            culture_bonus = 2
        elif request.specialization == "faith":
            faith_bonus = 2
        
        return {
            "city": {
                "id": city_with_queue.id,
                "name": city_with_queue.name,
                "population": city_with_queue.population,
                "hp": city_with_queue.hp or 100,
                "defense": city_with_queue.defense or 0,
                "food": (city_with_queue.food or 0) + food_bonus,
                "production": (city_with_queue.production or 0) + production_bonus,
                "gold": (city_with_queue.gold or 0) + gold_bonus,
                "science": (city_with_queue.science or 0) + science_bonus,
                "culture": (city_with_queue.culture or 0) + culture_bonus,
                "faith": (city_with_queue.faith or 0) + faith_bonus,
                "happiness": city_with_queue.happiness or 0,
                "currentProduction": production_queue[0]["name"] if production_queue else None,
                "turnsLeft": production_queue[0]["turnsLeft"] if production_queue else None,
                "productionQueue": production_queue,
                "foodToNextPop": city_with_queue.food_to_next_pop or 10,
                "cultureToNextBorder": city_with_queue.culture_to_next_border or 10,
                "specialization": updated_city.specialization,
                # 도시 위치 정보 추가
                "location": {
                    "q": city_with_queue.loc_q or 0,
                    "r": city_with_queue.loc_r or 0,
                    "s": city_with_queue.loc_s or 0
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"도시 특화 설정 중 오류 발생: {str(e)}"
        )