import os
from pydantic_settings import BaseSettings
from prisma import Prisma

class Settings(BaseSettings):
    """애플리케이션 설정"""
    APP_NAME: str = "텍스트 문명 (Text Civilization) API"
    APP_VERSION: str = "0.1.0"
    
    
    # 게임 설정
    DEFAULT_MAP_WIDTH: int = 20
    DEFAULT_MAP_HEIGHT: int = 15
    
    # API 설정
    API_PREFIX: str = "/api"
    
    # 기타 설정
    DEBUG: bool = os.getenv("DEBUG", "False") == "True"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# 설정 인스턴스 생성
settings = Settings()

# Prisma 클라이언트
prisma_client = Prisma()

async def setup_app():
    """애플리케이션 초기화"""
    # Prisma 클라이언트 연결
    await prisma_client.connect()
    
    # 추가 초기화 로직이 필요한 경우 여기에 작성
    
    if settings.DEBUG:
        print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} 시작됨")

async def close_app():
    """애플리케이션 종료"""
    await prisma_client.disconnect()