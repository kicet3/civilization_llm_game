// /api/llm/chat POST 엔드포인트
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // 구현 방법 1: 백엔드 서버로 요청 전달
    // 실제 백엔드 서버 URL로 변경 필요
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${backendUrl}/api/llm/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
      
      // 백엔드 서버 응답이 실패한 경우 기본 응답 사용
      console.warn('백엔드 LLM 서비스 응답 실패, 기본 응답으로 대체');
    } catch (error) {
      console.error('백엔드 LLM 서비스 통신 오류:', error);
      // 통신 오류 시 기본 응답 사용
    }
    
    // 구현 방법 2: 임시 응답 생성 (백엔드 연결 안 될 때 폴백)
    // 사용자 메시지 확인 (마지막 메시지)
    const userMessage = messages.find((msg: any) => msg.role === 'user')?.content || '';
    
    // 기본 응답
    let responseText = '죄송합니다. 지금은 답변을 제공할 수 없습니다. 잠시 후 다시 시도해 주세요.';
    
    // 명령어 처리
    if (userMessage.startsWith('!help') || userMessage.includes('도움말')) {
      responseText = `사용 가능한 명령어 목록:
- !help: 이 도움말을 표시합니다.
- !turn: 현재 턴 정보를 확인하고 턴을 종료합니다.
- !unit: 소유한 유닛의 목록과 상태를 확인합니다.
- !city: 도시 관리 메뉴를 엽니다.
- !research: 현재 연구 중인 기술과 사용 가능한 기술을 확인합니다.

일반 텍스트를 입력하여 어드바이저에게 게임에 대한 조언이나 전략을 물어볼 수도 있습니다.`;
    } else if (userMessage.startsWith('!turn')) {
      responseText = `현재 턴: 10
현재 골드: 125
현재 행복도: 12 (좋음)

턴을 종료하려면 "턴 종료"라고 입력하거나 "!turn end" 명령어를 사용하세요.`;
    } else if (userMessage.startsWith('!unit')) {
      responseText = `현재 소유한 유닛:
1. 전사 (10, 5) - 이동력: 2/2, 상태: 대기 중
2. 정착민 (8, 7) - 이동력: 0/2, 상태: 대기 중
3. 궁수 (11, 6) - 이동력: 1/2, 상태: 대기 중

유닛을 선택하려면 "유닛 1 선택" 또는 "궁수 선택"과 같이 입력하세요.`;
    } else if (userMessage.startsWith('!city')) {
      responseText = `도시 목록:
1. 서울 - 인구: 6, 생산: 8, 식량: 10
2. 부산 - 인구: 3, 생산: 5, 식량: 7

도시를 관리하려면 "도시 서울 관리" 또는 "도시 1 관리"와 같이 입력하세요.`;
    } else if (userMessage.startsWith('!research')) {
      responseText = `현재 연구 중: 농업 (5턴 남음)

다음 연구 가능한 기술:
- 도자기 (30 과학력 필요)
- 동물 사육 (35 과학력 필요)
- 광학 (45 과학력 필요)

연구를 변경하려면 "연구 도자기"와 같이 입력하세요.`;
    } else if (userMessage.includes('전략') || userMessage.includes('조언')) {
      responseText = `텍스트 문명 게임에서 초반 전략은 다음과 같습니다:

1. 첫 도시는 자원(특히 식량)이 풍부한 곳에 건설하세요.
2. 초반에는 정착민 1-2명을 빠르게 생산하여 새로운 도시를 건설하는 것이 유리합니다.
3. 과학 연구는 농업 → 도예 → 글쓰기 순서로 진행하는 것이 일반적입니다.
4. 다른 문명과의 만남에서는 초반에 우호적인 관계를 유지하는 것이 도움이 됩니다.

현재 상황에 맞는 더 구체적인 조언이 필요하시면 "!turn", "!unit", "!city" 등의 명령어로 게임 상태를 확인해 보세요.`;
    } else {
      // 일반 대화
      responseText = `안녕하세요! 텍스트 문명 게임의 어드바이저입니다. 게임에 관한 질문이나 명령어를 입력해 주세요. 명령어 목록을 보려면 "!help"를 입력하세요.`;
    }
    
    return NextResponse.json({
      text: responseText,
      id: `response-${Date.now()}`
    });
    
  } catch (error) {
    console.error('LLM API 처리 중 오류:', error);
    return NextResponse.json(
      { 
        error: '요청을 처리하는 중 오류가 발생했습니다.',
        text: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' 
      },
      { status: 500 }
    );
  }
}