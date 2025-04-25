// src/services/llmService.ts
import { BASE_URL } from './config';

export interface LLMResponse {
  text: string;
  id: string;
}

export interface ChatHistory {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class LLMService {
  private systemPrompt = `당신은 텍스트 기반 문명 게임의 AI 어드바이저입니다. 
당신의 역할은 플레이어가 게임을 진행하는 동안 도움과 조언을 제공하는 것입니다.
플레이어가 명령어를 입력하면 적절한 게임 액션을 설명하거나 수행해주세요.
다음 명령어들을 처리할 수 있습니다:
- !help: 도움말 및 사용 가능한 명령어 목록을 표시합니다.
- !turn: 현재 턴 정보와 다음 턴으로 넘어가기 위한 안내를 제공합니다.
- !unit: 사용 가능한 유닛 목록과 각 유닛의 상태를 보여줍니다.
- !city: 도시 관리 및 건설 관련 정보를 제공합니다.
- !research: 현재 연구 중인 기술과 사용 가능한 기술 목록을 보여줍니다.

플레이어가 일반 질문을 할 경우 게임과 관련된 지식을 바탕으로 친절하고 유용한 답변을 제공해 주세요.
실제 명령을 수행하기 위해서는 게임 엔진과 통신해야 하므로, 해당 명령에 대한 설명과 어떻게 처리되는지 알려주세요.`;

  private chatHistory: ChatHistory[] = [];

  constructor() {
    // 시스템 프롬프트로 채팅 기록 초기화
    this.resetChatHistory();
  }

  /**
   * 챗봇과 대화하기
   */
  async chat(message: string): Promise<LLMResponse> {
    try {
      // 사용자 메시지를 채팅 기록에 추가
      this.chatHistory.push({
        role: 'user',
        content: message
      });

      const response = await fetch(`${BASE_URL}/api/llm/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: this.chatHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'LLM 통신 오류');
      }

      const result = await response.json();
      
      // 어시스턴트 응답을 채팅 기록에 추가
      this.chatHistory.push({
        role: 'assistant',
        content: result.text
      });

      // 채팅 히스토리가 너무 길어지면 가장 오래된 사용자/어시스턴트 메시지 쌍을 제거
      // 시스템 메시지는 유지
      if (this.chatHistory.length > 20) {
        // 첫 번째 시스템 메시지 이후부터 2개 항목 제거 (사용자 + 어시스턴트)
        this.chatHistory.splice(1, 2);
      }

      return result;
    } catch (error) {
      console.error('LLM 서비스 오류:', error);
      
      // 오류 발생 시 폴백 응답 제공
      const fallbackResponse = {
        text: "죄송합니다. 현재 서버와 통신하는 데 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        id: "error-fallback"
      };
      
      return fallbackResponse;
    }
  }

  /**
   * 명령어 처리 (클라이언트 측에서 LLM 서버가 없을 때 폴백으로 사용)
   */
  handleCommand(command: string): string {
    const normalizedCommand = command.toLowerCase().trim();
    
    if (normalizedCommand === '!help') {
      return `사용 가능한 명령어 목록:
- !help: 이 도움말을 표시합니다.
- !turn: 현재 턴 정보를 확인하고 턴을 종료합니다.
- !unit: 소유한 유닛의 목록과 상태를 확인합니다.
- !city: 도시 관리 메뉴를 엽니다.
- !research: 현재 연구 중인 기술과 사용 가능한 기술을 확인합니다.

일반 텍스트를 입력하여 어드바이저에게 게임에 대한 조언이나 전략을 물어볼 수도 있습니다.`;
    }
    
    if (normalizedCommand === '!turn') {
      return `현재 턴: 10
현재 골드: 125
현재 행복도: 12 (좋음)

턴을 종료하려면 "턴 종료"라고 입력하거나 "!turn end" 명령어를 사용하세요.`;
    }
    
    if (normalizedCommand === '!unit') {
      return `현재 소유한 유닛:
1. 전사 (10, 5) - 이동력: 2/2, 상태: 대기 중
2. 정착민 (8, 7) - 이동력: 0/2, 상태: 대기 중
3. 궁수 (11, 6) - 이동력: 1/2, 상태: 대기 중

유닛을 선택하려면 "유닛 1 선택" 또는 "궁수 선택"과 같이 입력하세요.`;
    }
    
    if (normalizedCommand === '!city') {
      return `도시 목록:
1. 서울 - 인구: 6, 생산: 8, 식량: 10
2. 부산 - 인구: 3, 생산: 5, 식량: 7

도시를 관리하려면 "도시 서울 관리" 또는 "도시 1 관리"와 같이 입력하세요.`;
    }
    
    if (normalizedCommand === '!research') {
      return `현재 연구 중: 농업 (5턴 남음)

다음 연구 가능한 기술:
- 도자기 (30 과학력 필요)
- 동물 사육 (35 과학력 필요)
- 광학 (45 과학력 필요)

연구를 변경하려면 "연구 도자기"와 같이 입력하세요.`;
    }
    
    return `명령어를 인식할 수 없습니다. 도움말을 보려면 !help를 입력하세요.`;
  }

  /**
   * 채팅 기록 초기화
   */
  resetChatHistory(): void {
    this.chatHistory = [
      {
        role: 'system',
        content: this.systemPrompt
      }
    ];
  }

  /**
   * 게임 상태 정보를 LLM에 제공
   */
  updateGameContext(gameState: any): void {
    // 게임 상태를 문자열로 변환하여 시스템 메시지로 추가
    const gameContext = `
현재 게임 상태:
턴: ${gameState.turn || '알 수 없음'}
플레이어: ${gameState.playerName || '알 수 없음'} (${gameState.playerCiv || '알 수 없음'})
금: ${gameState.gold || 0}
과학력: ${gameState.science || 0}
행복도: ${gameState.happiness || 0}
    `;
    
    // 기존 시스템 프롬프트와 게임 상태를 결합
    this.chatHistory[0] = {
      role: 'system',
      content: this.systemPrompt + "\n\n" + gameContext
    };
  }
}

const llmService = new LLMService();
export default llmService;