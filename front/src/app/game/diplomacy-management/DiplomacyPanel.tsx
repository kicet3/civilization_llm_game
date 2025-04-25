import React, { useState, useEffect } from 'react';
import { HexTile, Civilization } from '@/types/game';

interface DiplomacyPanelProps {
  mapData?: HexTile[];
  playerCivId?: string;
}

export default function DiplomacyPanel({ mapData = [], playerCivId = 'korea' }: DiplomacyPanelProps) {
  const [selectedCiv, setSelectedCiv] = useState<string | null>(null);
  const [selectedCityState, setSelectedCityState] = useState<string | null>(null);
  
  // 발견된 문명과 도시국가 추출
  const [discoveredCivs, setDiscoveredCivs] = useState<any[]>([]);
  const [discoveredCityStates, setDiscoveredCityStates] = useState<any[]>([]);
  
  // 최대 표시할 문명 수
  const maxCivCount = 5;
  
  useEffect(() => {
    // 맵 데이터에서 발견된 문명과 도시국가 추출
    if (!mapData || !Array.isArray(mapData)) {
      console.log('맵 데이터가 없거나 배열이 아닙니다.');
      setDiscoveredCivs([]);
      setDiscoveredCityStates([]);
      return;
    }
    
    // 플레이어 문명이 발견한 타일에서 다른 문명 추출
    const civs = mapData
      .filter(tile => tile.visible && tile.city && tile.city.owner !== playerCivId)
      .map(tile => {
        // 이 타일의 도시 정보 사용
        const cityData = tile.city;
        return {
          id: cityData?.owner || 'unknown',
          name: cityData?.name || '미확인 도시',
          population: cityData?.population || 1,
          location: { q: tile.q, r: tile.r, s: tile.s }
        };
      })
      .filter((civ, index, self) => 
        // 중복 제거: 같은 owner를 가진 첫 번째 항목만 유지
        index === self.findIndex((t) => t.id === civ.id)
      );
    
    // 발견된 문명 설정
    setDiscoveredCivs(civs);
    
    // 도시국가 처리는 유사한 로직 (필요에 따라 구현)
    setDiscoveredCityStates([]);
  }, [mapData, playerCivId]);
  
  // 발견된 문명이 없거나 5개 미만인 경우 미확인 문명 슬롯 추가
  const civPlaceholders = Array(Math.max(0, maxCivCount - discoveredCivs.length))
    .fill(null)
    .map((_, index) => ({
      id: `placeholder-${index}`,
      name: '미확인 국가',
      isPlaceholder: true
    }));
  
  // 발견된 문명과 플레이스홀더 슬롯 합치기 (최대 5개)
  const civSlots = [...discoveredCivs, ...civPlaceholders].slice(0, maxCivCount);
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-slate-800 border-b border-slate-700">
        <h2 className="text-2xl font-bold">외교</h2>
      </div>
      
      <div className="p-4 flex-1 overflow-auto">
        {/* 문명 목록 */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">문명</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {civSlots.map((civ) => (
              <div
                key={civ.id}
                className={`p-4 rounded-lg border ${civ.isPlaceholder 
                  ? 'border-gray-700 bg-gray-800 opacity-50 cursor-not-allowed' 
                  : selectedCiv === civ.id 
                    ? 'border-blue-500 bg-blue-900 bg-opacity-20' 
                    : 'border-gray-700 hover:border-gray-500 cursor-pointer'
                }`}
                onClick={() => !civ.isPlaceholder && setSelectedCiv(civ.id === selectedCiv ? null : civ.id)}
              >
                <h4 className="font-bold">{civ.name}</h4>
                {!civ.isPlaceholder && (
                  <div className="mt-2 text-sm text-gray-400">
                    <p>인구: {civ.population || '?'}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* 도시국가 목록 (아직 발견한 도시국가가 없으면 비활성화) */}
        <div className="opacity-50">
          <h3 className="text-xl font-bold mb-4">도시국가</h3>
          <p className="text-gray-400">아직 발견한 도시국가가 없습니다.</p>
        </div>
        
        {/* 선택된 문명이 있을 경우 외교 옵션 표시 */}
        {selectedCiv && (
          <div className="mt-8 p-4 border border-gray-700 rounded-lg">
            <h3 className="text-xl font-bold mb-4">{discoveredCivs.find(c => c.id === selectedCiv)?.name}와의 외교</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg">
                평화 제안
              </button>
              <button className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg">
                통상 조약
              </button>
              <button className="p-3 bg-red-900 hover:bg-red-800 rounded-lg">
                전쟁 선포
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
