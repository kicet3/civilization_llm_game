// src/services/authService.ts
import { BASE_URL } from './config';

export interface UserRegistrationData {
  username: string;
  password: string;
  email?: string;
  nickname?: string;
}

export interface UserLoginData {
  username: string;
  password: string;
}

export interface AuthResponse {
  userId: string;
  username: string;
  token: string;
}

class AuthService {
  /**
   * 새 사용자 등록
   */
  async registerUser(userData: UserRegistrationData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '사용자 등록 실패');
      }

      return await response.json();
    } catch (error) {
      console.error('사용자 등록 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자 로그인
   */
  async loginUser(loginData: UserLoginData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '로그인 실패');
      }

      return await response.json();
    } catch (error) {
      console.error('로그인 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자 토큰 저장
   */
  saveToken(token: string): void {
    localStorage.setItem('userToken', token);
  }

  /**
   * 저장된 사용자 토큰 가져오기
   */
  getToken(): string | null {
    return localStorage.getItem('userToken');
  }

  /**
   * 로그아웃 및 토큰 제거
   */
  logout(): void {
    localStorage.removeItem('userToken');
  }
}

const authService = new AuthService();
export default authService;