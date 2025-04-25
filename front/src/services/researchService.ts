import { BASE_URL } from './config';
import { ApiResponse } from '@/types/game';

class ResearchService {
  /**
   * 연구 상태 조회
   */
  async getResearchState(gameId: string, playerId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${BASE_URL}/research/status/${gameId}/${playerId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`연구 상태 조회 실패: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('연구 상태 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 기술 목록 조회
   */
  async getTechs(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${BASE_URL}/research/tech-tree`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`기술 목록 조회 실패: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('기술 목록 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 연구 가능한 기술 목록 조회
   */
  async getAvailableTechs(gameId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${BASE_URL}/research/available/${gameId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`연구 가능한 기술 목록 조회 실패: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('연구 가능한 기술 목록 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 기술 상세 정보 조회
   */
  async getTechDetail(techId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${BASE_URL}/research/tech/${techId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`기술 상세 정보 조회 실패: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('기술 상세 정보 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 연구 시작
   */
  async startResearch(gameId: string, techId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${BASE_URL}/research/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId, techId }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`연구 시작 실패: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('연구 시작 중 오류:', error);
      throw error;
    }
  }

  /**
   * 연구 변경
   */
  async changeResearch(gameId: string, techId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${BASE_URL}/research/change`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId, techId }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`연구 변경 실패: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('연구 변경 중 오류:', error);
      throw error;
    }
  }

  /**
   * 시대별 기술 조회
   */
  async getTechsByEra(era: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${BASE_URL}/research/era/${era}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`시대별 기술 조회 실패: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('시대별 기술 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 기술 연구 예상 경로 조회
   */
  async getResearchPath(gameId: string, techId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${BASE_URL}/research/path/${gameId}/${techId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`기술 연구 예상 경로 조회 실패: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('기술 연구 예상 경로 조회 중 오류:', error);
      throw error;
    }
  }
}

const researchService = new ResearchService();
export default researchService; 