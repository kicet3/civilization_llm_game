"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, Menu, Map, Book, 
  Beaker, Users, Sword, ChevronDown, Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameNavigationProps {
  gameId: string;
  playerId: string;
  selectedTab: string;
  onSelectTab: (tab: string) => void;
  onToggleChat: () => void;
}

export default function GameNavigation({
  gameId,
  playerId,
  selectedTab,
  onSelectTab,
  onToggleChat
}: GameNavigationProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  
  // 모바일 메뉴 토글
  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };
  
  // 홈으로 이동
  const goToHome = () => {
    router.push('/');
  };
  
  // 채팅 페이지로 이동
  const goToChatPage = () => {
    router.push(`/game/chat?gameId=${gameId}&playerId=${playerId}`);
  };
  
  return (
    <>
      {/* 데스크톱 사이드바 */}
      <div className="hidden md:flex w-16 bg-slate-800 border-r border-slate-700 flex-col items-center py-4">
        <TabButton
          icon={<Map size={24} />}
          active={selectedTab === 'map'}
          onClick={() => onSelectTab('map')}
        />
        <TabButton
          icon={<Beaker size={24} />}
          active={selectedTab === 'research'}
          onClick={() => onSelectTab('research')}
        />
        <TabButton
          icon={<Sword size={24} />}
          active={selectedTab === 'units'}
          onClick={() => onSelectTab('units')}
        />
        <TabButton
          icon={<Users size={24} />}
          active={selectedTab === 'diplomacy'}
          onClick={() => onSelectTab('diplomacy')}
        />
        <TabButton
          icon={<ChevronDown size={24} />}
          active={selectedTab === 'turn'}
          onClick={() => onSelectTab('turn')}
        />
        <TabButton
          icon={<MessageSquare size={24} />}
          active={selectedTab === 'chat'}
          onClick={goToChatPage}
          title="채팅 게임 모드"
        />
      </div>
      
      {/* 모바일 메뉴 버튼 */}
      <button 
        onClick={toggleMenu}
        className="md:hidden fixed left-4 top-4 z-40 p-2 bg-slate-800 hover:bg-slate-700 rounded-full"
      >
        <Menu size={20} />
      </button>
      
      {/* 모바일 메뉴 오버레이 */}
      {menuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50" 
          onClick={toggleMenu}
        >
          <div 
            className="w-64 h-full bg-slate-800 p-4" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">게임 메뉴</h2>
              <button onClick={toggleMenu} className="p-1 rounded hover:bg-slate-700">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <MobileTabButton
                label="지도"
                icon={<Map size={20} />}
                active={selectedTab === 'map'}
                onClick={() => {
                  onSelectTab('map');
                  toggleMenu();
                }}
              />
              <MobileTabButton
                label="연구"
                icon={<Beaker size={20} />}
                active={selectedTab === 'research'}
                onClick={() => {
                  onSelectTab('research');
                  toggleMenu();
                }}
              />
              <MobileTabButton
                label="유닛"
                icon={<Sword size={20} />}
                active={selectedTab === 'units'}
                onClick={() => {
                  onSelectTab('units');
                  toggleMenu();
                }}
              />
              <MobileTabButton
                label="외교"
                icon={<Users size={20} />}
                active={selectedTab === 'diplomacy'}
                onClick={() => {
                  onSelectTab('diplomacy');
                  toggleMenu();
                }}
              />
              <MobileTabButton
                label="턴 종료"
                icon={<ChevronDown size={20} />}
                active={selectedTab === 'turn'}
                onClick={() => {
                  onSelectTab('turn');
                  toggleMenu();
                }}
              />
              <MobileTabButton
                label="채팅 게임 모드"
                icon={<MessageSquare size={20} />}
                active={selectedTab === 'chat'}
                onClick={() => {
                  goToChatPage();
                  toggleMenu();
                }}
              />
            </div>
            
            <div className="mt-8 space-y-4 border-t border-slate-700 pt-4">
              <button 
                onClick={onToggleChat}
                className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center"
              >
                <MessageSquare size={20} className="mr-2" />
                <span>어드바이저와 채팅</span>
              </button>
              
              <button 
                onClick={goToHome}
                className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center"
              >
                <Home size={20} className="mr-2" />
                <span>홈으로 이동</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 고정된 채팅 버튼 (모바일) */}
      <button 
        onClick={onToggleChat}
        className="md:hidden fixed right-4 bottom-4 z-40 p-3 bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-lg"
      >
        <MessageSquare size={24} />
      </button>
    </>
  );
}

/* 데스크톱 탭 버튼 컴포넌트 */
function TabButton({ 
  icon, 
  active, 
  onClick,
  title
}: { 
  icon: React.ReactNode, 
  active: boolean, 
  onClick: () => void,
  title?: string
}) {
  return (
    <button
      className={cn(
        "w-12 h-12 mb-4 rounded-lg flex items-center justify-center",
        active ? "bg-indigo-600" : "bg-slate-700 hover:bg-slate-600"
      )}
      onClick={onClick}
      title={title}
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