from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from models.game import GameSessionCreate, GameSessionResponse, GameState
from core.config import prisma_client

# APIRouter 생성
router = APIRouter()

@router.post("/start", response_model=GameSessionResponse)
async def create_game_session(request: GameSessionCreate):
    """새로운 게임 세션 생성"""
    try:
        # 게임 세션 생성 로직 구현
        game_session = await prisma_client.gamesession.create(
            data={
                "host_user_id": 1,  # 임시 사용자 ID, 실제로는 인증된 사용자 ID 사용
                "map_type": request.mapType,
                "seed": int(time.time() * 1000),  # 랜덤 시드 생성
                "current_turn": 1,
                "status": "ongoing",
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
        )
        
        # 게임 세션 응답 생성
        return GameSessionResponse(
            id=game_session.id,
            playerName=request.playerName,
            mapType=game_session.map_type,
            difficulty=request.difficulty,
            currentTurn=game_session.current_turn,
            gameSpeed=request.gameSpeed,
            createdAt=game_session.created_at,
            updatedAt=game_session.updated_at
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"게임 세션 생성 중 오류 발생: {str(e)}"
        )

# 다른 게임 관련 엔드포인트들 추가 가능
@router.get("/state", response_model=GameState)
async def get_game_state(gameId: str):
    """게임 상태 조회"""
    try:
        game_session = await prisma_client.gamesession.find_unique(
            where={"id": gameId}
        )
        
        if not game_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="게임 세션을 찾을 수 없습니다"
            )
        
        # 게임 상태 응답 생성
        return GameState(
            gameId=game_session.id,
            currentTurn=game_session.current_turn,
            # 다른 필요한 상태 정보 추가
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"게임 상태 조회 중 오류 발생: {str(e)}"
        )