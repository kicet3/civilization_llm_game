'use client'

import React, { useState } from 'react';
import { useGameStore } from '@/lib/store';
import CityDetails from './CityDetails';

interface CityManagementProps {
  selectedCityId: number | null;
}

const CityManagement: React.FC<CityManagementProps> = ({ selectedCityId }) => {
  const { cities } = useGameStore();
  const [selectedTab, setSelectedTab] = useState<'manage' | 'list'>('manage');
  
  // 선택된 도시 찾기
  const selectedCity = selectedCityId ? cities.find(city => city.id === selectedCityId) : null;
  
  // 플레이어 소유 도시 필터링
  const playerCities = cities.filter(city => city.owner === 'player');
  
  return (
    <div className="h-full flex flex-col">
      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-700 mb-4">
        <button
          className={`flex-1 py-2 ${selectedTab === 'manage' ? 'bg-gray-700' : 'bg-gray-800'}`}
          onClick={() => setSelectedTab('manage')}
          disabled={!selectedCity}
        >
          도시 관리
        </button>
        <button
          className={`flex-1 py-2 ${selectedTab === 'list' ? 'bg-gray-700' : 'bg-gray-800'}`}
          onClick={() => setSelectedTab('list')}
        >
          도시 목록
        </button>
      </div>
      
      {/* 도시 관리 탭 */}
      {selectedTab === 'manage' && (
        <div className="flex-grow overflow-y-auto">
          {selectedCity ? (
            <CityDetails cityId={selectedCity.id} />
          ) : (
            <div className="text-center p-4">
              <p>도시를 선택하여 관리하세요.</p>
              <button 
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                onClick={() => setSelectedTab('list')}
              >
                도시 목록 보기
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* 도시 목록 탭 */}
      {selectedTab === 'list' && (
        <div className="flex-grow overflow-y-auto">
          <h3 className="text-xl font-bold mb-4">도시 목록</h3>
          
          {playerCities.length > 0 ? (
            <div className="space-y-3">
              {playerCities.map(city => (
                <div 
                  key={city.id} 
                  className={`
                    p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors
                    ${selectedCityId === city.id ? 'bg-gray-700 border border-blue-500' : 'bg-gray-800'}
                  `}
                  onClick={() => {
                    // 도시 선택 및 관리 탭으로 전환
                    // 여기서는 URL 파라미터로 선택된 도시 ID를 설정하는 방식을 가정
                    // 실제 구현에서는 Zustand 스토어의 selectCity 액션 등을 호출해야 함
                    setSelectedTab('manage');
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-lg">{city.name}</h4>
                      <p className="text-sm text-gray-400">인구: {city.population}</p>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className="text-sm">
                        식량: {city.foodProduction || '?'} 생산: {city.productionPoints || '?'}
                      </span>
                      
                      {/* 현재 생산 중인 항목 표시 */}
                      {city.currentProduction && (
                        <span className="text-sm bg-blue-900 px-2 py-1 rounded mt-1">
                          생산 중: {city.currentProduction}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* 생산 진행 상황 */}
                  {city.currentProduction && city.productionPoints && city.production?.total && (
                    <div className="mt-2">
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600" 
                          style={{ width: `${(city.productionPoints / city.production.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* 인구 성장 표시 */}
                  {city.food !== undefined && city.foodToGrow !== undefined && (
                    <div className="mt-1">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>인구 성장</span>
                        <span>{city.food}/{city.foodToGrow}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-600" 
                          style={{ width: `${(city.food / city.foodToGrow) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* 건물 간략 표시 */}
                  {city.buildings && city.buildings.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {city.buildings.slice(0, 3).map((building, index) => (
                        <span 
                          key={`${city.id}-${building}-${index}`}
                          className="text-xs bg-gray-700 px-1 py-0.5 rounded"
                        >
                          {building}
                        </span>
                      ))}
                      {city.buildings.length > 3 && (
                        <span className="text-xs bg-gray-700 px-1 py-0.5 rounded">
                          +{city.buildings.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <p>소유한 도시가 없습니다.</p>
              <p className="text-sm text-gray-400 mt-2">
                정착민을 생산하여 새로운 도시를 건설하세요.
              </p>
            </div>
          )}
          
          {/* 도시 건설 가이드 */}
          <div className="mt-6 p-4 bg-blue-900 bg-opacity-30 rounded-lg">
            <h4 className="font-semibold mb-2">도시 건설 가이드</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>정착민 유닛으로 새로운 도시를 건설할 수 있습니다.</li>
              <li>도시는 자원이 풍부한 곳에 건설하는 것이 유리합니다.</li>
              <li>물 근처에 도시를 건설하면 식량 생산이 증가합니다.</li>
              <li>다른 도시와 너무 가깝게 건설하면 영토가 겹칠 수 있습니다.</li>
            </ul>
          </div>
          
          {/* 도시 정렬 옵션 */}
          <div className="mt-4 flex justify-end">
            <div className="relative inline-block">
              <button className="px-3 py-1 bg-gray-700 rounded flex items-center">
                <span className="mr-1">정렬</span>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                </svg>
              </button>
              {/* 정렬 드롭다운 메뉴 (실제 구현 시 토글 로직 필요) */}
              <div className="hidden absolute right-0 mt-1 bg-gray-700 rounded shadow-lg z-10">
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-600">인구순</button>
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-600">생산량순</button>
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-600">식량순</button>
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-600">이름순</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 도시 관리 도움말 */}
      <div className="mt-auto pt-4 border-t border-gray-700">
        <details className="text-sm text-gray-400">
          <summary className="cursor-pointer hover:text-gray-300">도시 관리 도움말</summary>
          <div className="mt-2 pl-4 space-y-1">
            <p>• 도시는 제국의 핵심입니다. 인구와 건물을 통해 자원을 생산합니다.</p>
            <p>• 시민 배치를 통해 식량, 생산, 과학, 금화, 문화 생산량을 조절할 수 있습니다.</p>
            <p>• 식량이 충분히 쌓이면 인구가 성장하고, 문화가 쌓이면 영토가 확장됩니다.</p>
            <p>• 건물은 도시 생산력을 향상시키며, 특수 효과를 제공합니다.</p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default CityManagement;