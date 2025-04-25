import React, { useEffect } from "react";
import { Tech, ResearchStateResponse } from "@/types/game";

interface TechTreeProps {
  techTree: Tech[];
  researchState: ResearchStateResponse;
  onSelectTech: (tech: Tech) => void;
}

// 기술 트리 시각화 (간단한 그래프 구조, 실제 게임에서는 SVG/Canvas 등으로 확장 가능)
export default function TechTree({ techTree, researchState, onSelectTech }: TechTreeProps) {
  // 디버깅용 props 로그
  useEffect(() => {
    console.log("TechTree Props - techTree:", techTree);
    console.log("TechTree Props - researchState:", researchState);
  }, [techTree, researchState]);

  // 데이터가 없는 경우 표시
  if (!techTree || techTree.length === 0) {
    return (
      <div className="p-4 bg-slate-800 rounded text-center">
        <p>이 시대에 연구할 수 있는 기술이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {techTree.map(tech => {
        const researched = researchState.researchedTechIds.includes(tech.id);
        const isCurrentResearch = researchState.currentTechId === tech.id;
        const available = tech.prerequisites.every(prereq => 
          researchState.researchedTechIds.includes(prereq)
        );
        
        // 연구 진행 상태에 따른 클래스 결정
        let statusClass = "bg-gray-800 border-gray-600 opacity-60 cursor-not-allowed";
        if (researched) {
          statusClass = "bg-green-800 border-green-500";
        } else if (isCurrentResearch) {
          statusClass = "bg-blue-700 border-blue-400";
        } else if (available) {
          statusClass = "bg-blue-900 border-blue-400 hover:bg-blue-700 cursor-pointer";
        }
        
        // 진행 중인 연구의 진행률 계산
        const progress = isCurrentResearch && researchState.progress[tech.id] 
          ? Math.min(100, Math.round((researchState.progress[tech.id] / tech.cost) * 100)) 
          : 0;
          
        return (
          <div
            key={tech.id}
            className={`p-3 rounded border-2 w-48 h-32 relative ${statusClass}`}
            onClick={() => available && onSelectTech(tech)}
          >
            <div className="font-bold text-base mb-1">{tech.name}</div>
            <div className="text-xs mb-1">연구비용: {tech.cost}</div>
            <div className="flex flex-wrap gap-1 text-xs">
              {Array.isArray(tech.unlocks) && tech.unlocks.map((unlock, index) => {
                const unlockName = typeof unlock === 'string' ? unlock : unlock.name;
                return (
                  <span key={index} className="bg-gray-700 rounded px-1">{unlockName}</span>
                );
              })}
            </div>
            
            {/* 연구 상태 표시 */}
            {researched && <span className="absolute top-1 right-2 text-green-300 font-bold text-xs">완료</span>}
            {isCurrentResearch && (
              <>
                <span className="absolute bottom-1 right-2 text-blue-300 font-bold text-xs">
                  진행 중 ({progress}%)
                </span>
                {/* 진행률 표시 바 */}
                <div className="absolute bottom-0 left-0 h-1 bg-blue-500" style={{ width: `${progress}%` }}></div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
