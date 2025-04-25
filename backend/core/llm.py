from langchain_community.chat_models import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
import os

# 환경변수에서 API 키 가져오기
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "your-api-key-here")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-pro")
GEMINI_API_URL = os.getenv("GEMINI_API_URL", None)

# LLM 인스턴스 초기화 (Gemini 사용)
llm = ChatGoogleGenerativeAI(
    api_key=GOOGLE_API_KEY,
    model=GEMINI_MODEL,
    temperature=0.7,
    max_tokens=512,
    convert_system_message_to_human=True
)

# 프로덕션용 설정 (더 낮은 temperature)
production_llm = ChatGoogleGenerativeAI(
    api_key=GOOGLE_API_KEY,
    model=GEMINI_MODEL,
    temperature=0.2,
    max_tokens=1024,
    convert_system_message_to_human=True
)

# 경제적인 설정 (필요한 경우 더 작은 모델 사용)
economy_llm = ChatGoogleGenerativeAI(
    api_key=GOOGLE_API_KEY,
    model=GEMINI_MODEL,
    temperature=0.5,
    max_tokens=512,
    convert_system_message_to_human=True
) 