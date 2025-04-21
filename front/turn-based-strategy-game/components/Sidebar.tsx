'use client'

import React from 'react';
import { GameState, HexTile } from '@/lib/types';

interface SidebarProps {
  gameState: GameState;
  selectedTile: HexTile | null;
  onEndTurn: () => void;
  onShowNpcDialog: (npcId: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  gameState,
  selectedTile,
  onEndTurn,
  onShowNpcDialog
}) => {
  return (
    <div className="w-64 bg-gray-800 p-4 flex flex-col overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">{gameState.playerInfo.name}의 {gameState.playerInfo.nation}</h2>
      
      {/* 리소스 정보 */}
      <div className="mb-4 bg-gray-700 p-3 rounded">
        <h3 className="font-semibold mb-2">자원</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>💰 금화: {gameState.playerInfo.gold}</div>
          <div>🧪 과학: {gameState.playerInfo.science}</div>
          <div>🍎 식량: {gameState.playerInfo.resources.food}</div>
          <div>🪵 목재: {gameState.playerInfo.resources.wood}</div>
          <div>⚒️ 철광석: {gameState.playerInfo.resources.iron}</div>
          <div>🎭 문화: {gameState.playerInfo.culture}</div>
        </div>
      </div>
      
      {/* 행동 버튼 */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">행동</h3>
        <div className="flex flex-col gap-2">
          <button className="game-button-blue">도시 건설</button>
          <button className="game-button-green">외교</button>
          <button className="game-button-purple">연구</button>
          <button className="game-button-red" onClick={onEndTurn}>턴 종료</button>
        </div>
      </div>
      
      {/* 외교 관계 */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">외교 관계</h3>
        <div className="flex flex-col gap-2">
          {gameState.diplomacy.map(nation => (
            <div 
              key={nation.nationId} 
              className={`p-2 rounded cursor-pointer ${
                nation.status === "동맹" ? "bg-green-700" : 
                nation.status === "적대" ? "bg-red-700" : "bg-gray-600"
              }`}
              onClick={() => onShowNpcDialog(nation.nationId)}
            >
              <div className="flex justify-between items-center">
                <span>{nation.name}</span>
                <span>{nation.status}</span>
              </div>
              <div className="w-full bg-gray-500 h-2 rounded-full mt-1">
                <div 
                  className={`h-2 rounded-full ${
                    nation.relationship > 50 ? "bg-green-500" :
                    nation.relationship > 0 ? "bg-yellow-500" : "bg-red-500"
                  }`} 
                  style={{ width: `${Math.max(Math.abs(nation.relationship), 10)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 선택된 타일 정보 */}
      {selectedTile && (
        <div className="mt-auto bg-gray-700 p-3 rounded">
          <h3 className="font-semibold mb-2">선택된 지역</h3>
          <p>지형: {selectedTile.terrain}</p>
          {selectedTile.hasCity && <p>도시: 있음</p>}
          {selectedTile.hasUnit && <p>유닛: 있음</p>}
          <p>좌표: ({selectedTile.q}, {selectedTile.r})</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;