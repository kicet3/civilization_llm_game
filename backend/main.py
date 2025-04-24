from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import game, map
import uvicorn

app = FastAPI(title="문명 게임 API", description="텍스트 기반 문명 전략 게임 백엔드 API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포 시에는 허용된 도메인만 지정
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(game.router, prefix="/api/game", tags=["game"])
app.include_router(map.router, prefix="/api/map", tags=["map"])

@app.get("/")
async def root():
    return {"message": "문명 게임 API에 오신 것을 환영합니다!"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)