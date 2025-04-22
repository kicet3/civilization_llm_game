'use client'

import React from 'react';
import { City, Building, UnitType } from '@/lib/types';
import { useGameStore } from '@/lib/store';

interface BuildingQueueProps {
  city: City;
}

const BuildingQueue: React.FC<BuildingQueueProps> = ({ city }) => {
  const { 
    buildings, 
    unitTypes, 
    updateCityProduction, 
    cancelProduction 
  } = useGameStore();
  
  // 현재 생산 중인 아이템 정보
  const currentItem = city.currentProduction ? (
    buildings.find(b => b.id === city.currentProduction) || 
    unitTypes.find(u => u.id === city.currentProduction)
  ) : null;
  
  // 생산 진행률 계산
  const calculateProgress = () => {
    if (!city.productionPoints || !currentItem) return 0;
    
    // 건물이나 유닛의 총 생산 비용 계산
    const totalCost = 'goldCost' in currentItem 
      ? currentItem.goldCost // 유닛인 경우
      : currentItem.productionCost || 20; // 건물인 경우 (기본값 20)
    
    return Math.min(100, (city.productionPoints / totalCost) * 100);
  };
  
  // 남은 턴 수 계산
  const calculateRemainingTurns = () => {
    if (!city.productionPoints || !currentItem) return '?';
    
    const totalCost = 'goldCost' in currentItem 
      ? currentItem.goldCost 
      : currentItem.productionCost || 20;
    
    const remainingPoints = totalCost - city.productionPoints;
    const turnProduction = city.workforce?.production || 1; // 매 턴 생산 포인트
    
    if (turnProduction <= 0) return '∞'; // 생산력이 0이면 무한대
    
    return Math.ceil(remainingPoints / turnProduction);
  };
  
  // 생산 취소 처리
  const handleCancelProduction = () => {
    if (city.currentProduction) {
      cancelProduction(city.id);
    }
  };
  
  // 일람표에서 생산 아이템 선택 처리
  const handleSelectProduction = (id: string) => {
    updateCityProduction(city.id, id);
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-4">건설 대기열</h3>
      
      {/* 현재 생산 중인 아이템 */}
      {currentItem ? (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h4 className="font-semibold">{currentItem.name}</h4>
              <p className="text-sm text-gray-400">
                {buildings.find(b => b.id === city.currentProduction) 
                  ? '건물' 
                  : '유닛'
                }
              </p>
            </div>
            <button 
              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
              onClick={handleCancelProduction}
              title="생산 취소"
            >
              취소
            </button>
          </div>
          
          {/* 진행 상황 표시 */}
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span>진행률: {calculateProgress().toFixed(0)}%</span>
              <span>남은 턴: {calculateRemainingTurns()}</span>
            </div>
            <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300" 
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-700 rounded text-center">
          <p>현재 생산 중인 항목이 없습니다.</p>
          <p className="text-sm text-gray-400">아래 목록에서 건설할 항목을 선택하세요.</p>
        </div>
      )}
      
      {/* 생산 대기열 */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">생산 대기열</h4>
        {city.productionQueue && city.productionQueue.length > 0 ? (
          <div className="space-y-2">
            {city.productionQueue.map((itemId, index) => {
              const item = buildings.find(b => b.id === itemId) || 
                          unitTypes.find(u => u.id === itemId);
              
              return item ? (
                <div 
                  key={`queue-${index}`} 
                  className="flex justify-between items-center p-2 bg-gray-700 rounded"
                >
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-gray-400 ml-2">
                      {'goldCost' in item ? '유닛' : '건물'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      className="w-6 h-6 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center"
                      title="위로 이동"
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button 
                      className="w-6 h-6 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center"
                      title="아래로 이동"
                      disabled={index === city.productionQueue.length - 1}
                    >
                      ↓
                    </button>
                    <button 
                      className="w-6 h-6 bg-red-600 hover:bg-red-700 rounded flex items-center justify-center"
                      title="대기열에서 제거"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ) : null;
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">생산 대기 중인 항목이 없습니다.</p>
        )}
      </div>
      
      {/* 생산 가능 목록 */}
      <div>
        <h4 className="font-semibold mb-2">생산 가능 항목</h4>
        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
          {/* 건물 목록 */}
          <div className="mb-2">
            <h5 className="text-sm font-medium text-gray-400 mb-1">건물</h5>
            {buildings
              .filter(building => 
                // 이미 건설된 건물 제외
                !city.buildings.includes(building.id) &&
                // 이미 생산 중이거나 대기열에 있는 건물 제외
                city.currentProduction !== building.id &&
                !(city.productionQueue?.includes(building.id))
              )
              .map(building => (
                <div 
                  key={building.id}
                  className="p-2 bg-gray-700 rounded mb-1 cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSelectProduction(building.id)}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{building.name}</span>
                    <span>
                      {building.productionCost || 20} <span className="text-gray-400">⚒️</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{building.description}</p>
                </div>
              ))}
          </div>
          
          {/* 유닛 목록 */}
          <div>
            <h5 className="text-sm font-medium text-gray-400 mb-1">유닛</h5>
            {unitTypes
              .filter(unit => 
                // 이미 생산 중이거나 대기열에 있는 유닛 제외
                city.currentProduction !== unit.id &&
                !(city.productionQueue?.includes(unit.id))
              )
              .map(unit => (
                <div 
                  key={unit.id}
                  className="p-2 bg-gray-700 rounded mb-1 cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSelectProduction(unit.id)}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{unit.name}</span>
                    <span>
                      {unit.goldCost} <span className="text-gray-400">⚒️</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {unit.category === 'military' ? '군사 유닛' : 
                     unit.category === 'civilian' ? '민간 유닛' : '특수 유닛'}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingQueue;