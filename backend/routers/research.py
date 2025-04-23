from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from prisma.models import GameResearch, ResearchedTech, ResearchProgress, Tech
from models.research import ResearchState, TechResponse, ResearchStartRequest
from core.config import prisma_client

router = APIRouter()

@router.get("/state", response_model=ResearchState)
async def get_research_state(gameId: str):
    """연구 상태 조회"""
    try:
        # 연구 상태 조회
        game_research = await prisma_client.gameresearch.find_unique(
            where={"session_id": gameId},
            include={
                "current_tech": True,
                "researched_techs": {
                    "include": {"tech": True}
                },
                "research_progress": {
                    "include": {"tech": True}
                }
            }
        )
        
        if not game_research:
            # 연구 상태가 없으면 새로 생성
            game_research = await prisma_client.gameresearch.create(
                data={
                    "session_id": gameId,
                    "current_tech_id": None
                }
            )
            
            return ResearchState(
                currentTechId=None,
                researchedTechIds=[],
                progress={}
            )
        
        # 연구된 기술 ID 목록
        researched_tech_ids = [rt.tech_id for rt in game_research.researched_techs]
        
        # 연구 진행도
        progress = {rp.tech_id: rp.progress for rp in game_research.research_progress}
        
        return ResearchState(
            currentTechId=game_research.current_tech_id,
            researchedTechIds=researched_tech_ids,
            progress=progress
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"연구 상태 조회 중 오류 발생: {str(e)}"
        )

@router.post("/start", response_model=ResearchState)
async def start_research(request: ResearchStartRequest):
    """연구 시작/변경"""
    try:
        # 기술 존재 여부 확인
        tech = await prisma_client.tech.find_unique(
            where={"id": request.techId}
        )
        
        if not tech:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="해당 기술을 찾을 수 없습니다"
            )
        
        # 이미 연구된 기술인지 확인
        researched = await prisma_client.researchedtech.find_unique(
            where={
                "session_id_tech_id": {
                    "session_id": request.gameId,
                    "tech_id": request.techId
                }
            }
        )
        
        if researched:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 연구된 기술입니다"
            )
        
        # 연구 상태 조회 또는 생성
        game_research = await prisma_client.gameresearch.find_unique(
            where={"session_id": request.gameId}
        )
        
        if not game_research:
            game_research = await prisma_client.gameresearch.create(
                data={
                    "session_id": request.gameId,
                    "current_tech_id": request.techId
                }
            )
        else:
            # 현재 연구 중인 기술 변경
            game_research = await prisma_client.gameresearch.update(
                where={"session_id": request.gameId},
                data={"current_tech_id": request.techId}
            )
        
        # 연구 진행도 조회 또는 생성
        research_progress = await prisma_client.researchprogress.find_unique(
            where={
                "session_id_tech_id": {
                    "session_id": request.gameId,
                    "tech_id": request.techId
                }
            }
        )
        
        if not research_progress:
            research_progress = await prisma_client.researchprogress.create(
                data={
                    "session_id": request.gameId,
                    "tech_id": request.techId,
                    "progress": 0
                }
            )
        
        # 연구 이벤트 기록
        await prisma_client.gameevent.create(
            data={
                "session_id": request.gameId,
                "event_type": "research_started",
                "event_data": {
                    "tech_id": request.techId,
                    "tech_name": tech.name
                }
            }
        )
        
        # 완전한 연구 상태 조회
        updated_research_state = await prisma_client.gameresearch.find_unique(
            where={"session_id": request.gameId},
            include={
                "researched_techs": True,
                "research_progress": True
            }
        )
        
        # 응답 데이터 구성
        researched_tech_ids = [rt.tech_id for rt in updated_research_state.researched_techs]
        progress = {rp.tech_id: rp.progress for rp in updated_research_state.research_progress}
        
        return ResearchState(
            currentTechId=updated_research_state.current_tech_id,
            researchedTechIds=researched_tech_ids,
            progress=progress
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"연구 시작 중 오류 발생: {str(e)}"
        )

@router.get("/techs", response_model=List[TechResponse])
async def get_techs():
    """전체 기술 목록 조회"""
    try:
        techs = await prisma_client.tech.find_many()
        
        tech_responses = []
        for tech in techs:
            # 실제 게임에서는 기술 트리 관계 정보 필요
            # 여기서는 간단히 구현
            tech_responses.append(
                TechResponse(
                    id=tech.id,
                    name=tech.name,
                    description=tech.description or "",
                    era=tech.era or "",
                    cost=tech.cost or 0,
                    prerequisites=[],  # 실제 구현시 선행 기술 정보 추가
                    unlocks=[]  # 실제 구현시 해금되는 기술/건물/유닛 정보 추가
                )
            )
        
        return tech_responses
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"기술 목록 조회 중 오류 발생: {str(e)}"
        )