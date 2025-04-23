from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os

# 내부 모듈 임포트
from routers import game, map, city, unit, research
from core.config import setup_app

# 환경 변수 로드
load_dotenv()

# FastAPI 앱 생성
app = FastAPI(
    title="텍스트 문명 (Text Civilization) API",
    description="텍스트 기반 문명 시뮬레이션 게임을 위한 API",
    version="0.1.0"
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포 시 적절한 오리진 설정 필요
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(game.router, prefix="/api/game", tags=["게임 세션"])
app.include_router(map.router, prefix="/api/map", tags=["맵/타일"])
app.include_router(city.router, prefix="/api/city", tags=["도시"])
app.include_router(unit.router, prefix="/api/unit", tags=["유닛"])
app.include_router(research.router, prefix="/api/research", tags=["연구/기술"])
# app.include_router(policy.router, prefix="/api/policy", tags=["정책"])
# app.include_router(religion.router, prefix="/api/religion", tags=["종교"])
# app.include_router(diplomacy.router, prefix="/api/diplomacy", tags=["외교"])

@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 실행되는 이벤트 핸들러"""
    await setup_app()

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "name": "텍스트 문명 (Text Civilization) API",
        "version": "0.1.0",
        "status": "운영 중"
    }
