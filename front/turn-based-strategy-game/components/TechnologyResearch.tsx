'use client'

import React, { useState } from 'react';
import { Technology } from '@/lib/types';
import { useGameStore } from '@/lib/store';

const TechnologyResearch: React.FC = () => {
  const { technologies, playerInfo, researchTechnology } = useGameStore();
  const [showAllTechs, setShowAllTechs] = useState(false);
  
  // 현재 연구 가능한 기술만 필터링합니다.
  // 1. 이미 연구한 기술은 제외
  // 2. 모든 선행 기술(prerequisites)이 연구되었는지 확인
  const researchableTechs = technologies.filter((tech) => {
    if (tech.researched) return false; // 이미 연구한 기술 제외

    // 선행 기술이 없는 경우 바로 연구 가능
    if (!tech.prerequisites || tech.prerequisites.length === 0) return true;

    // 모든 선행 기술이 연구되었는지 확인
    const allPrerequisitesResearched = tech.prerequisites.every((prereqId) => {
      const prereqTech = technologies.find((t) => t.id === prereqId);
      return prereqTech && prereqTech.researched;
    });
    return allPrerequisitesResearched;
  });

  
  // 전체 기술 트리 구조
  const techTree = organizeByEra(technologies);
  
  // 기술 연구 처리
  const handleResearch = (techId: string) => {
    researchTechnology(techId);
  };
  
  // 기술을 시대별로 구분
  function organizeByEra(techs: Technology[]) {
    const eras = {
      'ancient': { name: '고대', techs: [] as Technology[] },
      'classical': { name: '고전', techs: [] as Technology[] },
      'medieval': { name: '중세', techs: [] as Technology[] },
      'renaissance': { name: '르네상스', techs: [] as Technology[] },
      'industrial': { name: '산업', techs: [] as Technology[] },
      'modern': { name: '현대', techs: [] as Technology[] }
    };
    
    techs.forEach(tech => {
      eras[tech.era].techs.push(tech);
    });
    
    return eras;
  }
  
  // 기술 아이콘 반환
  const getTechIcon = (tech: Technology) => {
    const { name } = tech;
    
    if (name.includes('농업')) return '🌾';
    if (name.includes('도예')) return '🏺';
    if (name.includes('목축')) return '🐑';
    if (name.includes('궁술')) return '🏹';
    if (name.includes('채광')) return '⛏️';
    if (name.includes('항해')) return '⛵';
    if (name.includes('청동')) return '🔨';
    if (name.includes('문자')) return '📜';
    if (name.includes('승마')) return '🐎';
    if (name.includes('철')) return '⚔️';
    
    return '🔬';
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">기술 연구</h3>
        <div>
          <span className="mr-2">🧪 과학: {playerInfo.science}</span>
          <button
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded"
            onClick={() => setShowAllTechs(!showAllTechs)}
          >
            {showAllTechs ? '연구 가능 기술만 보기' : '전체 기술 트리 보기'}
          </button>
        </div>
      </div>
      
      {/* 연구 가능한 기술 목록 (간소화 보기) */}
      {!showAllTechs && (
        <div>
          <h4 className="font-semibold mb-2">연구 가능한 기술</h4>
          {researchableTechs.length > 0 ? (
            <div className="grid gap-4">
              {researchableTechs.map(tech => (
                <div 
                  key={tech.id} 
                  className="bg-gray-700 p-3 rounded"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-bold flex items-center">
                      <span className="mr-2 text-xl">{getTechIcon(tech)}</span>
                      {tech.name}
                    </h5>
                    <span className="px-2 py-1 bg-blue-600 rounded">
                      🧪 {tech.cost}
                    </span>
                  </div>
                  <p className="mb-2 text-sm">{tech.description}</p>
                  
                  {/* 해금되는 항목들 */}
                  <div className="mb-3">
                    {tech.unlocksBuildings && tech.unlocksBuildings.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-1">
                        <span className="font-semibold">건물:</span>
                        {tech.unlocksBuildings.map(buildingId => (
                          <span key={buildingId} className="px-2 py-1 bg-yellow-700 rounded-full text-xs">
                            {buildingId === 'granary' && '곡물 창고'}
                            {buildingId === 'market' && '시장'}
                            {buildingId === 'barracks' && '병영'}
                            {buildingId === 'library' && '도서관'}
                            {buildingId === 'workshop' && '작업장'}
                            {buildingId === 'temple' && '신전'}
                            {buildingId === 'storage' && '저장고'}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {tech.unlocksUnits && tech.unlocksUnits.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        <span className="font-semibold">유닛:</span>
                        {tech.unlocksUnits.map(unitId => (
                          <span key={unitId} className="px-2 py-1 bg-green-700 rounded-full text-xs">
                            {unitId === 'archer' && '궁수'}
                            {unitId === 'spearman' && '창병'}
                            {unitId === 'horseman' && '기병'}
                            {unitId === 'swordsman' && '검병'}
                            {unitId === 'galley' && '갤리선'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    className="game-button-blue w-full"
                    onClick={() => handleResearch(tech.id)}
                    disabled={playerInfo.science < tech.cost}
                  >
                    연구 시작 (🧪 {tech.cost})
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>현재 연구 가능한 기술이 없습니다.</p>
          )}
        </div>
      )}
      
      {/* 전체 기술 트리 보기 */}
      {showAllTechs && (
        <div>
          {Object.entries(techTree).map(([eraKey, era]) => {
            // 해당 시대의 기술이 있는 경우에만 표시
            if (era.techs.length === 0) return null;
            
            return (
              <div key={eraKey} className="mb-6">
                <h4 className="font-semibold border-b border-gray-600 pb-1 mb-3">{era.name} 시대</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {era.techs.map(tech => {
                    // 연구 가능 여부 체크
                    const isResearchable = !tech.researched && tech.prerequisites.every(prereqId => {
                      const prereqTech = technologies.find(t => t.id === prereqId);
                      return prereqTech && prereqTech.researched;
                    });
                    
                    return (
                      <div 
                        key={tech.id} 
                        className={`p-3 rounded ${
                          tech.researched 
                            ? 'bg-green-800 bg-opacity-40' 
                            : isResearchable 
                              ? 'bg-gray-700'
                              : 'bg-gray-700 bg-opacity-50'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <h5 className="font-bold flex items-center">
                            <span className="mr-2 text-xl">{getTechIcon(tech)}</span>
                            {tech.name}
                          </h5>
                          <div className="flex items-center">
                            {tech.researched ? (
                              <span className="text-xs px-2 py-1 bg-green-600 rounded">연구됨</span>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-blue-600 rounded">🧪 {tech.cost}</span>
                            )}
                          </div>
                        </div>
                        
                        {/* 선행 연구 항목 */}
                        {tech.prerequisites.length > 0 && (
                          <div className="text-xs mb-1">
                            <span className="text-gray-400">필요 기술: </span>
                            {tech.prerequisites.map((prereqId, index) => {
                              const prereqTech = technologies.find(t => t.id === prereqId);
                              return (
                                <span 
                                  key={prereqId}
                                  className={prereqTech?.researched ? "text-green-400" : "text-red-400"}
                                >
                                  {prereqTech?.name}
                                  {index < tech.prerequisites.length - 1 ? ', ' : ''}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-300 mb-2">{tech.description}</p>
                        
                        {/* 연구 버튼 */}
                        {!tech.researched && isResearchable && (
                          <button
                            className="game-button-blue w-full text-sm py-1"
                            onClick={() => handleResearch(tech.id)}
                            disabled={playerInfo.science < tech.cost}
                          >
                            연구 시작
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TechnologyResearch;