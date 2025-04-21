'use client'

import React, { useState } from 'react';
import { useGameStore } from '@/lib/store';
import UnitManagement from './UnitManagement';
import CityManagement from './CityManagement';
import TechnologyResearch from './TechnologyResearch';

const Sidebar: React.FC = () => {
  const { 
    playerInfo, 
    hexMap, 
    units, 
    cities,
    selectedTile,
    selectTile, 
    endTurn 
  } = useGameStore();
  
  const [activeTab, setActiveTab] = useState<'game' | 'unit' | 'city' | 'tech'>('game');
  
  // 선택된 타일에 있는 유닛과 도시 찾기
  const selectedUnitId = selectedTile ? 
    units.find(unit => 
      unit.position.q === selectedTile.q && 
      unit.position.r === selectedTile.r
    )?.id || null : null;
  
  const selectedCityId = selectedTile ? 
    cities.find(city => 
      city.position.q === selectedTile.q && 
      city.position.r === selectedTile.r
    )?.id || null : null;
  
  // 외교 관계 열기
  const handleOpenDiplomacy = (nationId: number) => {
    console.log('외교관계 열기:', nationId);
    // 향후 외교 관계 모달 추가
  };
  
  return (
    <div className="w-80 bg-gray-800 flex flex-col h-screen overflow-hidden">
      {/* 사이드바 상단 정보 */}
      <div className="p-4 bg-gray-900">
        <h2 className="text-xl font-bold mb-2">{playerInfo.name}의 {playerInfo.nation}</h2>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>💰 금화: {playerInfo.gold}</div>
          <div>🧪 과학: {playerInfo.science}</div>
          <div>🎭 문화: {playerInfo.culture}</div>
          <div>🍎 식량: {playerInfo.resources.food}</div>
          <div>🪵 목재: {playerInfo.resources.wood}</div>
          <div>⚒️ 철광석: {playerInfo.resources.iron}</div>
        </div>
      </div>
      
      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-700">
        <button
          className={`flex-1 py-2 ${activeTab === 'game' ? 'bg-gray-700' : 'bg-gray-800'}`}
          onClick={() => setActiveTab('game')}
        >
          게임
        </button>
        <button
          className={`flex-1 py-2 ${activeTab === 'unit' ? 'bg-gray-700' : 'bg-gray-800'}`}
          onClick={() => setActiveTab('unit')}
          disabled={!selectedUnitId}
        >
          유닛
        </button>
        <button
          className={`flex-1 py-2 ${activeTab === 'city' ? 'bg-gray-700' : 'bg-gray-800'}`}
          onClick={() => setActiveTab('city')}
          disabled={!selectedCityId}
        >
          도시
        </button>
        <button
          className={`flex-1 py-2 ${activeTab === 'tech' ? 'bg-gray-700' : 'bg-gray-800'}`}
          onClick={() => setActiveTab('tech')}
        >
          기술
        </button>
      </div>
      
      {/* 사이드바 내용 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 게임 탭 */}
        {activeTab === 'game' && (
          <div>
            {/* 행동 버튼 */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">행동</h3>
              <div className="flex flex-col gap-2">
                <button className="game-button-blue">도시 건설</button>
                <button className="game-button-green">외교</button>
                <button className="game-button-purple" onClick={() => setActiveTab('tech')}>연구</button>
                <button className="game-button-red" onClick={endTurn}>턴 종료</button>
              </div>
            </div>
            
            {/* 외교 관계 */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">외교 관계</h3>
              <div className="flex flex-col gap-2">
                {playerInfo.diplomacy?.map(nation => (
                  <div 
                    key={nation.nationId} 
                    className={`p-2 rounded cursor-pointer ${
                      nation.status === "동맹" ? "bg-green-700" : 
                      nation.status === "적대" ? "bg-red-700" : "bg-gray-600"
                    }`}
                    onClick={() => handleOpenDiplomacy(nation.nationId)}
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
              <div className="bg-gray-700 p-3 rounded">
                <h3 className="font-semibold mb-2">선택된 지역</h3>
                <p>지형: 
                  {selectedTile.terrain === 'plain' && ' 평지'}
                  {selectedTile.terrain === 'mountain' && ' 산'}
                  {selectedTile.terrain === 'forest' && ' 숲'}
                  {selectedTile.terrain === 'water' && ' 물'}
                  {selectedTile.terrain === 'desert' && ' 사막'}
                </p>
                {selectedTile.resource && (
                  <p>자원: 
                    {selectedTile.resource === 'iron' && ' 철광석'}
                    {selectedTile.resource === 'horses' && ' 말'}
                    {selectedTile.resource === 'oil' && ' 석유'}
                    {selectedTile.resource === 'uranium' && ' 우라늄'}
                    {selectedTile.resource === 'gems' && ' 보석'}
                  </p>
                )}
                {selectedTile.hasCity && <p>도시: 있음</p>}
                {selectedTile.hasUnit && <p>유닛: 있음</p>}
                <p>좌표: ({selectedTile.q}, {selectedTile.r})</p>
              </div>
            )}
          </div>
        )}
        
        {/* 유닛 탭 */}
        {activeTab === 'unit' && <UnitManagement selectedUnitId={selectedUnitId} />}
        
        {/* 도시 탭 */}
        {activeTab === 'city' && <CityManagement selectedCityId={selectedCityId} />}
        
        {/* 기술 탭 */}
        {activeTab === 'tech' && <TechnologyResearch />}
      </div>
    </div>
  );
};

export default Sidebar;