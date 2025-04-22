'use client'

import React, { useState, useEffect } from 'react';
import { City } from '@/lib/types';
import { useGameStore } from '@/lib/store';

interface CitizenAssignmentProps {
  city: City;
}

interface CitizenAllocation {
  food: number;
  production: number;
  science: number;
  gold: number;
  culture: number;
  unassigned: number;
}

const CitizenAssignment: React.FC<CitizenAssignmentProps> = ({ city }) => {
  // 시민 배치 상태 관리
  const [allocation, setAllocation] = useState<CitizenAllocation>({
    food: 0,
    production: 0,
    science: 0,
    gold: 0,
    culture: 0,
    unassigned: 0
  });
  
  const { updateCityWorkforce } = useGameStore();
  
  // 초기 상태로 시민 배치 설정
  useEffect(() => {
    // 기존 저장된 할당이 있으면 그대로 사용, 없으면 기본값 계산
    if (city.workforce) {
      setAllocation({
        food: city.workforce.food || 0,
        production: city.workforce.production || 0,
        science: city.workforce.science || 0,
        gold: city.workforce.gold || 0,
        culture: city.workforce.culture || 0,
        unassigned: city.population - (
          (city.workforce.food || 0) + 
          (city.workforce.production || 0) + 
          (city.workforce.science || 0) + 
          (city.workforce.gold || 0) + 
          (city.workforce.culture || 0)
        )
      });
    } else {
      // 기본 배치 (전체 인구의 40%는 식량, 30%는 생산, 나머지는 분배)
      const foodWorkers = Math.floor(city.population * 0.4);
      const productionWorkers = Math.floor(city.population * 0.3);
      const scienceWorkers = Math.floor(city.population * 0.1);
      const goldWorkers = Math.floor(city.population * 0.1);
      const cultureWorkers = Math.floor(city.population * 0.05);
      const unassigned = city.population - (foodWorkers + productionWorkers + scienceWorkers + goldWorkers + cultureWorkers);
      
      setAllocation({
        food: foodWorkers,
        production: productionWorkers,
        science: scienceWorkers,
        gold: goldWorkers,
        culture: cultureWorkers,
        unassigned
      });
    }
  }, [city.id, city.population, city.workforce]);
  
  // 배치 변경 시 스토어 업데이트
  useEffect(() => {
    if (allocation.unassigned >= 0) {
      updateCityWorkforce(city.id, {
        food: allocation.food,
        production: allocation.production,
        science: allocation.science,
        gold: allocation.gold,
        culture: allocation.culture
      });
    }
  }, [allocation, city.id, updateCityWorkforce]);
  
  // 시민 수 증가 함수
  const increaseCitizen = (type: keyof Omit<CitizenAllocation, 'unassigned'>) => {
    if (allocation.unassigned > 0) {
      setAllocation(prev => ({
        ...prev,
        [type]: prev[type] + 1,
        unassigned: prev.unassigned - 1
      }));
    }
  };
  
  // 시민 수 감소 함수
  const decreaseCitizen = (type: keyof Omit<CitizenAllocation, 'unassigned'>) => {
    if (allocation[type] > 0) {
      setAllocation(prev => ({
        ...prev,
        [type]: prev[type] - 1,
        unassigned: prev.unassigned + 1
      }));
    }
  };
  
  // 시민 작업 슬롯 컴포넌트
  const CitizenSlot: React.FC<{
    type: keyof Omit<CitizenAllocation, 'unassigned'>;
    icon: string;
    label: string;
    color: string;
  }> = ({ type, icon, label, color }) => (
    <div className="flex flex-col items-center mb-3">
      <div className="flex justify-between items-center w-full mb-1">
        <span className="text-sm font-medium">{icon} {label}</span>
        <div className="flex items-center">
          <button
            className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
            onClick={() => decreaseCitizen(type)}
            disabled={allocation[type] <= 0}
          >
            -
          </button>
          <span className="mx-2 text-sm font-bold">{allocation[type]}</span>
          <button
            className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
            onClick={() => increaseCitizen(type)}
            disabled={allocation.unassigned <= 0}
          >
            +
          </button>
        </div>
      </div>
      <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color}`} 
          style={{ width: `${(allocation[type] / city.population) * 100}%` }}
        ></div>
      </div>
    </div>
  );
  
  // 드래그 앤 드롭 이벤트 핸들러
  const [draggedFrom, setDraggedFrom] = useState<string | null>(null);
  
  const handleDragStart = (type: string) => {
    if (allocation[type as keyof CitizenAllocation] > 0) {
      setDraggedFrom(type);
    }
  };
  
  const handleDrop = (type: string) => {
    if (draggedFrom && draggedFrom !== type) {
      // 드래그 시작 유형에서 1명 감소, 드롭 유형에 1명 증가
      setAllocation(prev => ({
        ...prev,
        [draggedFrom]: prev[draggedFrom as keyof CitizenAllocation] - 1,
        [type]: prev[type as keyof CitizenAllocation] + 1
      }));
    }
    setDraggedFrom(null);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // 시민 배치 영역 렌더링
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-4">시민 배치</h3>
      
      <div className="mb-4">
        <p>인구: {city.population} (미배치: {allocation.unassigned})</p>
        {allocation.unassigned > 0 && (
          <p className="text-yellow-400 text-sm">미배치 시민이 있습니다! 효율적인 성장을 위해 시민을 배치하세요.</p>
        )}
      </div>
      
      <div className="space-y-3">
        <CitizenSlot 
          type="food" 
          icon="🍎" 
          label="식량" 
          color="bg-green-600" 
        />
        <CitizenSlot 
          type="production" 
          icon="⚒️" 
          label="생산" 
          color="bg-red-600" 
        />
        <CitizenSlot 
          type="science" 
          icon="🧪" 
          label="과학" 
          color="bg-blue-600" 
        />
        <CitizenSlot 
          type="gold" 
          icon="💰" 
          label="금화" 
          color="bg-yellow-600" 
        />
        <CitizenSlot 
          type="culture" 
          icon="🎭" 
          label="문화" 
          color="bg-purple-600" 
        />
      </div>
      
      {/* 드래그 앤 드롭 영역 */}
      <div className="mt-6 grid grid-cols-5 gap-2">
        {['food', 'production', 'science', 'gold', 'culture'].map((type) => (
          <div
            key={type}
            className="aspect-square bg-gray-700 rounded flex items-center justify-center cursor-move relative overflow-hidden"
            draggable={allocation[type as keyof CitizenAllocation] > 0}
            onDragStart={() => handleDragStart(type)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(type)}
          >
            <div className="text-xl">
              {type === 'food' && '🍎'}
              {type === 'production' && '⚒️'}
              {type === 'science' && '🧪'}
              {type === 'gold' && '💰'}
              {type === 'culture' && '🎭'}
            </div>
            
            {allocation[type as keyof CitizenAllocation] > 0 && (
              <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 px-1 rounded-tl text-xs font-bold">
                {allocation[type as keyof CitizenAllocation]}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4">
        <p className="text-sm text-gray-400">드래그 앤 드롭으로 시민을 재배치할 수 있습니다.</p>
      </div>
    </div>
  );
};

export default CitizenAssignment;