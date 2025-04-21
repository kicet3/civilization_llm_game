'use client'

import React, { useState } from 'react';
import { City, Building, UnitType, Position } from '@/lib/types';
import { useGameStore } from '@/lib/store';

interface CityManagementProps {
  selectedCityId: number | null;
}

const CityManagement: React.FC<CityManagementProps> = ({ selectedCityId }) => {
  const { 
    cities, 
    buildings, 
    unitTypes, 
    technologies, 
    playerInfo, 
    constructBuilding, 
    trainUnit 
  } = useGameStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'buildings' | 'units'>('overview');
  
  // 선택된 도시 찾기
  const selectedCity = selectedCityId ? cities.find(city => city.id === selectedCityId) : null;
  
  // 건설 가능한 건물 필터링
  const availableBuildings = buildings.filter(building => {
    // 이미 건설된 건물은 제외
    if (selectedCity?.buildings.includes(building.id)) return false;
    
    // 필요한 기술이 있는 경우 연구된 상태인지 확인
    if (building.requiredTech) {
      const tech = technologies.find(t => t.id === building.requiredTech);
      if (!tech || !tech.researched) return false;
    }
    
    return true;
  });
  
  // 훈련 가능한 유닛 필터링
  const availableUnits = unitTypes.filter(unitType => {
    // 필요한 기술이 있는 경우 연구된 상태인지 확인
    if (unitType.requiredTech) {
      const tech = technologies.find(t => t.id === unitType.requiredTech);
      if (!tech || !tech.researched) return false;
    }
    
    return true;
  });
  
  // 건물 건설 처리
  const handleConstructBuilding = (buildingId: string) => {
    if (selectedCityId) {
      constructBuilding(selectedCityId, buildingId);
    }
  };
  
  // 유닛 훈련 처리
  const handleTrainUnit = (unitTypeId: string) => {
    if (selectedCityId) {
      trainUnit(selectedCityId, unitTypeId);
    }
  };
  
  // 도시가 선택되지 않았다면 아무것도 보여주지 않음
  if (!selectedCity) {
    return null;
  }
  
  // 도시 생산량 계산
  const calculateProduction = () => {
    let food = selectedCity.population * 2;
    let gold = selectedCity.population * 2;
    let science = selectedCity.population;
    let production = selectedCity.population;
    let culture = 0;
    
    // 건물 추가 생산량
    selectedCity.buildings.forEach(buildingId => {
      const building = buildings.find(b => b.id === buildingId);
      if (building) {
        food += building.foodBonus || 0;
        gold += building.goldBonus || 0;
        science += building.scienceBonus || 0;
        production += building.productionBonus || 0;
        culture += building.cultureBonus || 0;
      }
    });
    
    return { food, gold, science, production, culture };
  };
  
  const production = calculateProduction();
  
  // 건물 이름 변환
  const getBuildingName = (id: string): string => {
    switch(id) {
      case 'granary': return '곡물 창고';
      case 'market': return '시장';
      case 'barracks': return '병영';
      case 'library': return '도서관';
      case 'workshop': return '작업장';
      case 'temple': return '신전';
      default: return id;
    }
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded">
      <h3 className="text-xl font-bold mb-2">{selectedCity.name}</h3>
      
      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-700 mb-4">
        <button
          className={`px-4 py-2 ${activeTab === 'overview' ? 'bg-gray-700 border-t border-l border-r border-gray-600' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          개요
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'buildings' ? 'bg-gray-700 border-t border-l border-r border-gray-600' : ''}`}
          onClick={() => setActiveTab('buildings')}
        >
          건물
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'units' ? 'bg-gray-700 border-t border-l border-r border-gray-600' : ''}`}
          onClick={() => setActiveTab('units')}
        >
          유닛
        </button>
      </div>
      
      {/* 도시 개요 탭 */}
      {activeTab === 'overview' && (
        <div>
          <div className="mb-4">
            <p><strong>인구:</strong> {selectedCity.population}</p>
            <p><strong>소유자:</strong> {selectedCity.owner === 'player' ? '플레이어' : 'AI'}</p>
            <p><strong>위치:</strong> ({selectedCity.position.q}, {selectedCity.position.r})</p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-semibold mb-2">생산량</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <p>🍎 식량: {production.food}</p>
              <p>💰 금화: {production.gold}</p>
              <p>🧪 과학: {production.science}</p>
              <p>⚒️ 생산: {production.production}</p>
              <p>🎭 문화: {production.culture}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-semibold mb-2">건물</h4>
            {selectedCity.buildings.length > 0 ? (
              <ul className="list-disc list-inside">
                {selectedCity.buildings.map(buildingId => (
                  <li key={buildingId}>{getBuildingName(buildingId)}</li>
                ))}
              </ul>
            ) : (
              <p>건설된 건물이 없습니다.</p>
            )}
          </div>
          
          {selectedCity.currentProduction && (
            <div>
              <h4 className="font-semibold">현재 생산 중:</h4>
              <p>{
                buildings.find(b => b.id === selectedCity.currentProduction)?.name ||
                unitTypes.find(u => u.id === selectedCity.currentProduction)?.name ||
                selectedCity.currentProduction
              }</p>
            </div>
          )}
        </div>
      )}
      
      {/* 건물 탭 */}
      {activeTab === 'buildings' && (
        <div>
          <h4 className="font-semibold mb-2">건설 가능한 건물</h4>
          {availableBuildings.length > 0 ? (
            <div className="grid gap-4">
              {availableBuildings.map(building => (
                <div 
                  key={building.id} 
                  className="bg-gray-700 p-3 rounded"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-bold">{building.name}</h5>
                    <div className="flex gap-2">
                      <span>💰 {building.goldCost}</span>
                      <span>🪵 {building.woodCost}</span>
                      {building.ironCost > 0 && <span>⚒️ {building.ironCost}</span>}
                    </div>
                  </div>
                  <p className="mb-2 text-sm">{building.description}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {building.foodBonus && <span className="px-2 py-1 bg-green-700 rounded-full text-xs">🍎 +{building.foodBonus}</span>}
                    {building.goldBonus && <span className="px-2 py-1 bg-yellow-700 rounded-full text-xs">💰 +{building.goldBonus}</span>}
                    {building.scienceBonus && <span className="px-2 py-1 bg-blue-700 rounded-full text-xs">🧪 +{building.scienceBonus}</span>}
                    {building.productionBonus && <span className="px-2 py-1 bg-red-700 rounded-full text-xs">⚒️ +{building.productionBonus}</span>}
                    {building.cultureBonus && <span className="px-2 py-1 bg-purple-700 rounded-full text-xs">🎭 +{building.cultureBonus}</span>}
                    {building.woodBonus && <span className="px-2 py-1 bg-brown-700 rounded-full text-xs">🪵 +{building.woodBonus}</span>}
                    {building.ironBonus && <span className="px-2 py-1 bg-gray-500 rounded-full text-xs">⚒️ +{building.ironBonus}</span>}
                  </div>
                  <button
                    className="game-button-blue w-full"
                    onClick={() => handleConstructBuilding(building.id)}
                    disabled={
                      playerInfo.gold < building.goldCost ||
                      playerInfo.resources.wood < building.woodCost ||
                      playerInfo.resources.iron < building.ironCost
                    }
                  >
                    건설
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>현재 건설 가능한 건물이 없습니다.</p>
          )}
        </div>
      )}
      
      {/* 유닛 탭 */}
      {activeTab === 'units' && (
        <div>
          <h4 className="font-semibold mb-2">훈련 가능한 유닛</h4>
          {availableUnits.length > 0 ? (
            <div className="grid gap-4">
              {availableUnits.map(unit => (
                <div 
                  key={unit.id} 
                  className="bg-gray-700 p-3 rounded"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-bold">{unit.name}</h5>
                    <div className="flex gap-2">
                      <span>💰 {unit.goldCost}</span>
                      {unit.ironCost > 0 && <span>⚒️ {unit.ironCost}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <p>
                      <strong>유형:</strong> {
                        unit.category === 'military' ? '군사' :
                        unit.category === 'civilian' ? '민간' : '특수'
                      }
                    </p>
                    {unit.strength && <p><strong>전투력:</strong> {unit.strength}</p>}
                    <p><strong>이동력:</strong> {unit.movement}</p>
                  </div>
                  <button
                    className="game-button-green w-full"
                    onClick={() => handleTrainUnit(unit.id)}
                    disabled={
                      playerInfo.gold < unit.goldCost ||
                      playerInfo.resources.iron < unit.ironCost
                    }
                  >
                    훈련
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>현재 훈련 가능한 유닛이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CityManagement;