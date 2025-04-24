"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Play, 
  ArrowRight, 
  LogIn, 
  UserPlus, 
  Gaming, 
  Lock, 
  User 
} from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'login' | 'new'>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // 로그인 핸들러
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: 실제 로그인 API 연동
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        // 게임 로드 페이지로 이동
        router.push('/game/load');
      } else {
        // 로그인 실패 처리
        alert('로그인 실패: 아이디 또는 비밀번호를 확인해주세요.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  // 회원가입 핸들러
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: 실제 회원가입 API 연동
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        // 게임 선택 페이지로 이동
        router.push('/game/select-mode');
      } else {
        // 회원가입 실패 처리
        alert('회원가입 실패: 이미 존재하는 아이디이거나 입력 정보를 확인해주세요.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      alert('회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 rounded-xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">문명</h1>
          <p className="text-gray-400">게임을 시작하려면 로그인 또는 회원가입하세요.</p>
        </div>

        {/* 초기 선택 화면 */}
        {!authMode && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setAuthMode('login')}
              className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg flex flex-col items-center justify-center space-y-2 transition-colors"
            >
              <LogIn size={32} />
              <span className="font-bold">로그인</span>
              <span className="text-xs text-blue-200">기존 계정으로 게임 시작</span>
            </button>
            <button
              onClick={() => setAuthMode('new')}
              className="bg-green-600 hover:bg-green-700 p-4 rounded-lg flex flex-col items-center justify-center space-y-2 transition-colors"
            >
              <UserPlus size={32} />
              <span className="font-bold">회원가입</span>
              <span className="text-xs text-green-200">새 계정 생성</span>
            </button>
          </div>
        )}

        {/* 로그인 폼 */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex items-center border border-slate-700 rounded-lg px-3 py-2">
              <User size={20} className="mr-2 text-gray-400" />
              <input
                type="text"
                placeholder="아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-transparent outline-none"
              />
            </div>
            <div className="flex items-center border border-slate-700 rounded-lg px-3 py-2">
              <Lock size={20} className="mr-2 text-gray-400" />
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 p-3 rounded-lg font-bold flex items-center justify-center"
            >
              로그인 <ArrowRight size={20} className="ml-2" />
            </button>
            <button
              type="button"
              onClick={() => setAuthMode(null)}
              className="w-full bg-slate-700 hover:bg-slate-600 p-3 rounded-lg font-bold"
            >
              돌아가기
            </button>
          </form>
        )}

        {/* 회원가입 폼 */}
        {authMode === 'new' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="flex items-center border border-slate-700 rounded-lg px-3 py-2">
              <User size={20} className="mr-2 text-gray-400" />
              <input
                type="text"
                placeholder="새 아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={4}
                className="w-full bg-transparent outline-none"
              />
            </div>
            <div className="flex items-center border border-slate-700 rounded-lg px-3 py-2">
              <Lock size={20} className="mr-2 text-gray-400" />
              <input
                type="password"
                placeholder="새 비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-transparent outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 p-3 rounded-lg font-bold flex items-center justify-center"
            >
              회원가입 <ArrowRight size={20} className="ml-2" />
            </button>
            <button
              type="button"
              onClick={() => setAuthMode(null)}
              className="w-full bg-slate-700 hover:bg-slate-600 p-3 rounded-lg font-bold"
            >
              돌아가기
            </button>
          </form>
        )}
      </div>
    </div>
  );
}