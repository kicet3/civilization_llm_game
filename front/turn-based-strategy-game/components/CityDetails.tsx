'use client'

import React, { useState } from 'react';
import { City } from '@/lib/types';
import { useGameStore } from '@/lib/store';
import CitizenAssignment from './CitizenAssignment';
import BuildingQueue from './BuildingQueue';
import CityGrowth from './CityGrowth';

interface CityDetailsProps {
  cityId: number;
}

const CityDetails: React.FC<CityDetailsProps> = ({ cityId }) => {
  const { cities, buildings } = useGameStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'citizens' | 'production' | 'growth'>('overview');
  
  // 현재 선택된 도시 찾기
  const city = cities.find(c => c.id === cityId);
  
  if (!city) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg text-center">
        <p>선택된 도시 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }
  
  // 도시 생산량 계산
  const calculateProduction = () => {
    let food = city.population * 2; // 기본 식량
    let gold = city.population * 2; // 기본 금화
    let science = city.population; // 기본 과학
    let production = city.population; // 기본 생산
    let culture = 0; // 기본 문화
    
    // 시민 배치에 따른 추가 생산량
    if (city.workforce) {
      food += city.workforce.food ? city.workforce.food * 2 : 0;
      production += city.workforce.production ? city.workforce.production * 2 : 0;
      science += city.workforce.science ? city.workforce.science * 3 : 0;
      gold += city.workforce.gold ? city.workforce.gold * 3 : 0;
      culture += city.workforce.culture ? city.workforce.culture * 2 : 0;
    }
    
    // 건물 추가 생산량
    city.buildings.forEach(buildingId => {
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
    const building = buildings.find(b => b.id === id);
    return building ? building.name : id;
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">{city.name}</h2>
        <p className="text-gray-400">인구: {city.population} | 소유자: {city.owner === 'player' ? '플레이어' : 'AI'}</p>
      </div>
      
      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-700 mb-4">
        <button
          className={`px-4 py-2 ${activeTab === 'overview' ? 'bg-gray-700 border-t border-l border-r border-gray-600' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          개요
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'citizens' ? 'bg-gray-700 border-t border-l border-r border-gray-600' : ''}`}
          onClick={() => setActiveTab('citizens')}
        >
          시민
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'production' ? 'bg-gray-700 border-t border-l border-r border-gray-600' : ''}`}
          onClick={() => setActiveTab('production')}
        >
          생산
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'growth' ? 'bg-gray-700 border-t border-l border-r border-gray-600' : ''}`}
          onClick={() => setActiveTab('growth')}
        >
          성장
        </button>
      </div>
      
      {/* 도시 개요 탭 */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-700 p-3 rounded-lg">
              <h3 className="font-bold mb-2">생산량</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="flex items-center">
                  <span className="text-xl mr-2">🍎</span>
                  <div>
                    <div className="font-medium">식량</div>
                    <div className="text-lg">{production.food}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xl mr-2">💰</span>
                  <div>
                    <div className="font-medium">금화</div>
                    <div className="text-lg">{production.gold}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xl mr-2">🧪</span>
                  <div>
                    <div className="font-medium">과학</div>
                    <div className="text-lg">{production.science}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xl mr-2">⚒️</span>
                  <div>
                    <div className="font-medium">생산</div>
                    <div className="text-lg">{production.production}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xl mr-2">🎭</span>
                  <div>
                    <div className="font-medium">문화</div>
                    <div className="text-lg">{production.culture}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700 p-3 rounded-lg">
              <h3 className="font-bold mb-2">건물</h3>
              {city.buildings.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {city.buildings.map(buildingId => (
                    <div 
                      key={buildingId} 
                      className="bg-gray-600 p-2 rounded flex items-center"
                    >
                      <span className="mr-2">🏗️</span>
                      <span>{getBuildingName(buildingId)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>건설된 건물이 없습니다.</p>
              )}
            </div>
          </div>
          
          {/* 현재 생산 상태 */}
          <div className="bg-gray-700 p-3 rounded-lg mb-4">
            <h3 className="font-bold mb-2">현재 생산</h3>
            {city.currentProduction ? (
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{getBuildingName(city.currentProduction)}</p>
                  <div className="w-48 h-3 bg-gray-600 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="h-full bg-blue-600" 
                      style={{ 
                        width: `${
                          city.productionPoints && city.production?.total
                            ? (city.productionPoints / city.production.total) * 100
                            : 0
                        }%` 
                      }}
                    ></div>
                  </div>
                </div>
                <button 
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded"
                  onClick={() => setActiveTab('production')}
                >
                  생산 변경
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <p>현재 생산 중인 항목이 없습니다.</p>
                <button 
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                  onClick={() => setActiveTab('production')}
                >
                  생산 시작
                </button>
              </div>
            )}
          </div>
          
          {/* 성장 상태 미리보기 */}
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">도시 성장</h3>
              <button 
                className="text-sm text-blue-400 hover:underline"
                onClick={() => setActiveTab('growth')}
              >
                상세 보기
              </button>
            </div>
            
            <div className="flex items-center">
              <span className="mr-3">인구 성장:</span>
              <div className="flex-grow h-3 bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600" 
                  style={{ 
                    width: `${
                      city.food && city.foodToGrow
                        ? (city.food / city.foodToGrow) * 100
                        : 0
                    }%` 
                  }}
                ></div>
              </div>
              <span className="ml-2 text-sm">
                {city.food && city.foodToGrow ? `${city.food}/${city.foodToGrow}` : '0/0'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* 시민 배치 탭 */}
      {activeTab === 'citizens' && (
        <CitizenAssignment city={city} />
      )}
      
      {/* 생산 탭 */}
      {activeTab === 'production' && (
        <BuildingQueue city={city} />
      )}
      
      {/* 성장 탭 */}
      {activeTab === 'growth' && (
        <CityGrowth city={city} />
      )}
      
      {/* 하단 작업 버튼 */}
      <div className="mt-6 flex justify-end space-x-3">
        <button 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          onClick={() => {
            // 도시 명칭 변경 처리
            const newName = prompt('새 도시 이름을 입력하세요:', city.name);
            if (newName && newName.trim() !== '') {
              // 도시 이름 변경 액션 호출 (updateCity 등)
              console.log(`도시 이름 변경: ${city.name} -> ${newName}`);
            }
          }}
        >
          이름 변경
        </button>
        
        {city.owner === 'player' && (
          <button 
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
            onClick={() => {
              // 도시 집중 관리 처리
              console.log(`도시 집중 관리: ${city.name}`);
              // 확대 및 도시 중심으로 이동하는 로직
            }}
          >
            집중 관리
          </button>
        )}
      </div>
    </div>
  );
};

export default CityDetails;