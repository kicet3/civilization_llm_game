'use client'

import React, { useState, useEffect } from 'react';
import { City } from '@/lib/types';
import { useGameStore } from '@/lib/store';

interface CityGrowthProps {
  city: City;
}

const CityGrowth: React.FC<CityGrowthProps> = ({ city }) => {
  const { updateCity } = useGameStore();
  
  // 성장 애니메이션 상태
  const [isGrowing, setIsGrowing] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [growthProgress, setGrowthProgress] = useState(0);
  
  // 이전 인구수와 영토 크기를 추적하여 변화 감지
  const [prevPopulation, setPrevPopulation] = useState(city.population);
  const [prevRadius, setPrevRadius] = useState(city.cityRadius || 1);
  
  // 도시 상태가 변경될 때마다 성장 체크
  useEffect(() => {
    // 인구 증가 체크
    if (city.population > prevPopulation) {
      setIsGrowing(true);
      setTimeout(() => setIsGrowing(false), 3000); // 3초 후 애니메이션 종료
      setPrevPopulation(city.population);
    }
    
    // 영토 확장 체크
    const currentRadius = city.cityRadius || 1;
    if (currentRadius > prevRadius) {
      setIsExpanding(true);
      setTimeout(() => setIsExpanding(false), 3000); // 3초 후 애니메이션 종료
      setPrevRadius(currentRadius);
    }
  }, [city.population, city.cityRadius, prevPopulation, prevRadius]);
  
  // 성장 진행도 업데이트
  useEffect(() => {
    if (!city.food || !city.foodToGrow) return;
    
    const progress = (city.food / city.foodToGrow) * 100;
    setGrowthProgress(progress);
  }, [city.food, city.foodToGrow]);
  
  // 식량 분배 조정
  const adjustFoodFocus = (increase: boolean) => {
    if (!city.workforce) return;
    
    const newWorkforce = { ...city.workforce };
    
    if (increase) {
      // 다른 분야의 시민을 식량 생산으로 이동
      if (newWorkforce.production && newWorkforce.production > 0) {
        newWorkforce.production -= 1;
        newWorkforce.food = (newWorkforce.food || 0) + 1;
      } else if (newWorkforce.science && newWorkforce.science > 0) {
        newWorkforce.science -= 1;
        newWorkforce.food = (newWorkforce.food || 0) + 1;
      } else if (newWorkforce.gold && newWorkforce.gold > 0) {
        newWorkforce.gold -= 1;
        newWorkforce.food = (newWorkforce.food || 0) + 1;
      }
    } else {
      // 식량 생산에서 생산으로 시민 이동
      if (newWorkforce.food && newWorkforce.food > 1) { // 최소 1명은 식량에 유지
        newWorkforce.food -= 1;
        newWorkforce.production = (newWorkforce.production || 0) + 1;
      }
    }
    
    updateCity(city.id, { workforce: newWorkforce });
  };
  
  // 성장 예상 시간 계산
  const calculateGrowthTime = () => {
    if (!city.food || !city.foodToGrow || !city.workforce?.food) return '알 수 없음';
    
    const remainingFood = city.foodToGrow - city.food;
    const foodPerTurn = city.foodProduction || 2 * (city.workforce.food || 1);
    
    if (foodPerTurn <= 0) return '성장 없음';
    
    const turnsToGrow = Math.ceil(remainingFood / foodPerTurn);
    return `${turnsToGrow}턴`;
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-4">도시 성장</h3>
      
      {/* 인구 표시 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">인구</span>
          <span className={`text-xl font-bold ${isGrowing ? 'animate-pulse text-green-400' : ''}`}>
            {city.population}
            {isGrowing && (
              <span className="ml-2 text-green-400 text-sm">+1</span>
            )}
          </span>
        </div>
        
        <div className="flex items-center mb-4">
          <button 
            className="p-1 bg-red-600 hover:bg-red-700 rounded"
            onClick={() => adjustFoodFocus(false)}
            title="식량 생산 감소 (생산량 증가)"
          >
            -
          </button>
          <div className="flex-grow mx-2">
            <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-600 transition-all duration-500" 
                style={{ width: `${growthProgress}%` }}
              ></div>
            </div>
          </div>
          <button 
            className="p-1 bg-green-600 hover:bg-green-700 rounded"
            onClick={() => adjustFoodFocus(true)}
            title="식량 생산 증가 (성장 가속화)"
          >
            +
          </button>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>식량: {city.food || 0}/{city.foodToGrow || 0}</span>
          <span>예상 성장: {calculateGrowthTime()}</span>
        </div>
      </div>
      
      {/* 영토 표시 */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">도시 영역</h4>
        <div className="flex flex-col items-center">
          <div 
            className={`relative w-40 h-40 mb-3 ${isExpanding ? 'animate-pulse' : ''}`}
            style={{ 
              transition: 'transform 0.3s ease-out',
              transform: isExpanding ? 'scale(1.1)' : 'scale(1)' 
            }}
          >
            {/* 도시 영토 시각화 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-6 h-6 bg-yellow-500 rounded-full z-10 ${isGrowing ? 'animate-ping' : ''}`}></div>
              
              {/* 영토 반경 1 */}
              <div className="absolute w-16 h-16 border-2 border-yellow-500 rounded-full opacity-80"></div>
              
              {/* 영토 반경 2 */}
              {(city.cityRadius || 1) >= 2 && (
                <div className={`absolute w-28 h-28 border-2 border-yellow-500 rounded-full opacity-60 ${isExpanding && prevRadius < 2 ? 'animate-ping' : ''}`}></div>
              )}
              
              {/* 영토 반경 3 */}
              {(city.cityRadius || 1) >= 3 && (
                <div className={`absolute w-36 h-36 border-2 border-yellow-500 rounded-full opacity-40 ${isExpanding && prevRadius < 3 ? 'animate-ping' : ''}`}></div>
              )}
            </div>
          </div>
          
          <div className="text-center">
            <p>영토 크기: {city.cityRadius || 1}</p>
            <p className="text-sm text-gray-400">
              {city.workingTiles ? `활성 타일: ${city.workingTiles.length}` : ''}
            </p>
          </div>
        </div>
      </div>
      
      {/* 건강 및 행복도 상태 */}
      <div className="mt-6">
        <h4 className="font-semibold mb-2">도시 상태</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-1">건강도</p>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${city.health > 70 ? 'bg-green-600' : city.health > 40 ? 'bg-yellow-600' : 'bg-red-600'}`}
                style={{ width: `${city.health || 100}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-1">행복도</p>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${city.happiness > 70 ? 'bg-green-600' : city.happiness > 40 ? 'bg-yellow-600' : 'bg-red-600'}`}
                style={{ width: `${city.happiness || 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* 건강/행복 상태 메시지 */}
        {(city.health < 40 || city.happiness < 40) && (
          <div className="mt-3 p-2 bg-red-900 bg-opacity-30 rounded text-sm">
            {city.health < 40 && (
              <p className="text-red-400">⚠️ 건강 문제: 도시에 질병이 확산되고 있습니다. 의약품이나 병원이 필요합니다.</p>
            )}
            {city.happiness < 40 && (
              <p className="text-red-400">⚠️ 불만 증가: 시민들이 불만을 품고 있습니다. 오락 시설이나 사치품을 제공하세요.</p>
            )}
          </div>
        )}
      </div>
      
      {/* 다음 확장 정보 */}
      <div className="mt-4">
        <h4 className="font-semibold mb-2">다음 영토 확장</h4>
        <div className="flex items-center">
          <div className="flex-grow">
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-600 transition-all duration-500"
                style={{ width: `${city.borderGrowth ? (city.borderGrowth / city.borderGrowthRequired * 100) : 0}%` }}
              ></div>
            </div>
          </div>
          <span className="ml-2 text-sm">
            {city.borderGrowth && city.borderGrowthRequired 
              ? `${city.borderGrowth}/${city.borderGrowthRequired}`
              : '0/100'
            }
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          문화 생산량을 늘리면 영토 확장 속도가 빨라집니다.
        </p>
      </div>
      
      {/* 성장 촉진 버튼 */}
      <div className="mt-6">
        <button
          className="w-full py-2 bg-green-600 hover:bg-green-700 rounded font-medium"
          onClick={() => {
            // 골드로 성장 촉진 (실제 구현은 스토어 함수 필요)
            if (city.food && city.foodToGrow) {
              const remainingFood = city.foodToGrow - city.food;
              // 예시: 남은 식량 1당 2골드 비용
              const cost = remainingFood * 2;
              
              // 여기서 스토어의 구매 함수 호출
              alert(`성장 촉진 비용: ${cost} 골드`);
            }
          }}
        >
          성장 촉진 (골드 소모)
        </button>
        <p className="text-xs text-gray-400 mt-1 text-center">
          골드를 사용하여 즉시 식량을 보충하고 성장을 가속화합니다.
        </p>
      </div>
    </div>
  );
};

export default CityGrowth;