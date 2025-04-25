"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Menu, MessageSquare, Map, Book, 
  Beaker, Users, Sword, ChevronDown, Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatPanel from '../components/ChatPanel';

interface GameLayoutProps {
  children: React.ReactNode;
  gameId: string;
  playerId: string;
  turn: number;
  year: number;
  resources: any;
}

export default function GameLayout({
  children,
  gameId,
  playerId,
  turn,
  year,
  resources
}: GameLayoutProps) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<string>('map');
  const [chatPanelOpen, setChatPanelOpen] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  
  const handleSelectTab = (tab: string) => {
    setSelectedTab(tab);
    
    // 탭에 따라 라우팅 변경
    switch (tab) {
      case 'chat':
        router.push(`/game/chat?gameId=${gameId}&playerId=${playerId}`);
        break;
      case 'research':
        // research 탭으로 라우팅
        break;
      case 'units':
        // units 탭으로 라우팅
        break;
      case 'diplomacy':
        // diplomacy 탭으로 라우팅
        break;
      case 'turn':
        // turn 탭으로 라우팅
        break;
      case 'map':
      default:
        router.push(`/game?gameId=${gameId}`);
        break;
    }
  };
  
  // 모바일 메뉴 토글
  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };
  
  // 채팅 패널 토글
  const toggleChatPanel = () => {
    setChatPanelOpen(prev => !prev);
  };
  
  // 홈으로 이동
  const goToHome = () => {
    router.push('/');
  };
  
  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      {/* 상단 네비게이션 바 */}
      <nav className="h-[7vh] bg-slate-800 p-2 flex items-center justify-between border-b border-slate-700 overflow-hidden">
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleMenu}
            className="md:hidden p-2 hover:bg-slate-700 rounded-full"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-lg">문명</span>
        </div>
        
        <div className="flex space-x-4 max-w-[50vw] overflow-hidden">
          <div className="flex items-center">
            <span className="font-bold">턴: {turn}</span>
          </div>
          <div className="flex items-center">
            <span>{year < 0 ? `BC ${Math.abs(year)}` : `AD ${year}`}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 자원 표시 */}
          <div className="hidden md:flex items-center space-x-2 text-base overflow-x-auto">
            <div className="flex items-center">
              <div className="px-2 py-0.5 bg-green-400 text-white rounded-full mr-1 text-xs">식량</div>
              <span>{resources?.food || 0}</span>
            </div>
            <div className="flex items-center">
              <div className="px-2 py-0.5 bg-red-400 text-white rounded-full mr-1 text-xs">생산</div>
              <span>{resources?.production || 0}</span>
            </div>
            <div className="flex items-center">
              <div className="px-2 py-0.5 bg-yellow-400 text-white rounded-full mr-1 text-xs">골드</div>
              <span>{resources?.gold || 0}</span>
            </div>
          </div>
          
          {/* 채팅 버튼 */}
          <button 
            onClick={toggleChatPanel}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-full"
            title="게임 어드바이저와 채팅"
          >
            <MessageSquare size={18} />
          </button>
          
          {/* 홈 버튼 */}
          <button 
            onClick={goToHome}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full"
            title="홈으로 이동"
          >
            <Home size={18} />
          </button>
        </div>
      </nav>
      
      <div className="flex flex-1 overflow-hidden">
        {/* 사이드바 - 데스크톱 */}
        <div className="hidden md:flex w-16 bg-slate-800 border-r border-slate-700 flex-col items-center py-4">
          <TabButton
            icon={<Map size={24} />}
            active={selectedTab === 'map'}
            onClick={() => handleSelectTab('map')}
          />
          <TabButton
            icon={<Beaker size={24} />}
            active={selectedTab === 'research'}
            onClick={() => handleSelectTab('research')}
          />
          <TabButton
            icon={<Sword size={24} />}
            active={selectedTab === 'units'}
            onClick={() => handleSelectTab('units')}
          />
          <TabButton
            icon={<Users size={24} />}
            active={selectedTab === 'diplomacy'}
            onClick={() => handleSelectTab('diplomacy')}
          />
          <TabButton
            icon={<ChevronDown size={24} />}
            active={selectedTab === 'turn'}
            onClick={() => handleSelectTab('turn')}
          />
          <TabButton
            icon={<MessageSquare size={24} />}
            active={selectedTab === 'chat'}
            onClick={() => handleSelectTab('chat')}
          />
        </div>
        
        {/* 모바일 메뉴 오버레이 */}
        {menuOpen && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={toggleMenu}>
            <div className="w-64 h-full bg-slate-800 p-4" onClick={e => e.stopPropagation()}>
              <div className="space-y-4">
                <MobileTabButton
                  label="지도"
                  icon={<Map size={20} />}
                  active={selectedTab === 'map'}
                  onClick={() => {
                    handleSelectTab('map');
                    toggleMenu();
                  }}
                />
                <MobileTabButton
                  label="연구"
                  icon={<Beaker size={20} />}
                  active={selectedTab === 'research'}
                  onClick={() => {
                    handleSelectTab('research');
                    toggleMenu();
                  }}
                />
                <MobileTabButton
                  label="유닛"
                  icon={<Sword size={20} />}
                  active={selectedTab === 'units'}
                  onClick={() => {
                    handleSelectTab('units');
                    toggleMenu();
                  }}
                />
                <MobileTabButton
                  label="외교"
                  icon={<Users size={20} />}
                  active={selectedTab === 'diplomacy'}
                  onClick={() => {
                    handleSelectTab('diplomacy');
                    toggleMenu();
                  }}
                />
                <MobileTabButton
                  label="턴 종료"
                  icon={<ChevronDown size={20} />}
                  active={selectedTab === 'turn'}
                  onClick={() => {
                    handleSelectTab('turn');
                    toggleMenu();
                  }}
                />
                <MobileTabButton
                  label="채팅 게임"
                  icon={<MessageSquare size={20} />}
                  active={selectedTab === 'chat'}
                  onClick={() => {
                    handleSelectTab('chat');
                    toggleMenu();
                  }}
                />
              </div>
              
              {/* 모바일 자원 표시 */}
              <div className="mt-8 space-y-2 border-t border-slate-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-green-400">식량:</span>
                  <span>{resources?.food || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-400">생산:</span>
                  <span>{resources?.production || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-400">골드:</span>
                  <span>{resources?.gold || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-400">과학:</span>
                  <span>{resources?.science || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-400">문화:</span>
                  <span>{resources?.culture || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 메인 콘텐츠 */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
      
      {/* 채팅 패널 */}
      <ChatPanel
        gameId={gameId}
        playerId={playerId}
        isOpen={chatPanelOpen}
        onClose={toggleChatPanel}
      />
    </div>
  );
}

/* 데스크톱 탭 버튼 컴포넌트 */
function TabButton({ 
  icon, 
  active, 
  onClick 
}: { 
  icon: React.ReactNode, 
  active: boolean, 
  onClick: () => void 
}) {
  return (
    <button
      className={cn(
        "w-12 h-12 mb-4 rounded-lg flex items-center justify-center",
        active ? "bg-indigo-600" : "bg-slate-700 hover:bg-slate-600"
      )}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

/* 모바일 탭 버튼 컴포넌트 */
function MobileTabButton({ 
  label, 
  icon, 
  active, 
  onClick 
}: { 
  label: string, 
  icon: React.ReactNode, 
  active: boolean, 
  onClick: () => void 
}) {
  return (
    <button
      className={cn(
        "w-full p-3 rounded-lg flex items-center",
        active ? "bg-indigo-600" : "bg-slate-700 hover:bg-slate-600"
      )}
      onClick={onClick}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </button>
  );
}