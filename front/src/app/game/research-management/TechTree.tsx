import React from "react";
import { Tech } from "./mockTechData";

interface TechTreeProps {
  techTree: { [id: string]: Tech };
  researchState: {
    science: number;
    progress: number;
    currentTechId: string | null;
    researchedTechIds: string[];
  };
  onSelectTech: (tech: Tech) => void;
  onStartResearch: (tech: Tech) => void | Promise<void>;
}

// 기술 트리 시각화 (간단한 그래프 구조)
export default function TechTree({ techTree, researchState, onSelectTech, onStartResearch }: TechTreeProps) {
  // 시대별로 그룹화
  const eras = ["고대", "고전", "중세", "르네상스", "산업", "현대", "정보"];
  
  return (
    <div className="flex flex-col gap-6">
      {eras.map(era => {
        // 각 시대에 맞는 기술들 필터링
        const techsInEra = Object.values(techTree).filter(tech => tech.era === era);
        
        // 해당 시대에 기술이 없으면 렌더링하지 않음
        if (techsInEra.length === 0) return null;
        
        return (
          <div key={era}>
            <h4 className="font-bold text-lg mb-2">{era}</h4>
            <div className="flex flex-wrap gap-4">
              {techsInEra.map(tech => {
                const researched = researchState.researchedTechIds.includes(tech.id);
                const isResearching = researchState.currentTechId === tech.id;
                const available = tech.prerequisites.every(prereq => 
                  researchState.researchedTechIds.includes(prereq)
                );
                
                return (
                  <div
                    key={tech.id}
                    className={`p-3 rounded border-2 cursor-pointer transition-all w-48 h-32 relative 
                      ${researched 
                        ? 'bg-green-800 border-green-500' 
                        : isResearching
                          ? 'bg-blue-800 border-blue-300 animate-pulse'
                          : available 
                            ? 'bg-blue-900 border-blue-400 hover:bg-blue-700' 
                            : 'bg-gray-800 border-gray-600 opacity-60 cursor-not-allowed'
                      }`}
                    onClick={() => available && !researched && !isResearching && onSelectTech(tech)}
                  >
                    <div className="font-bold text-base mb-1">{tech.name}</div>
                    <div className="text-xs mb-1">연구비용: {tech.cost}</div>
                    <div className="flex flex-wrap gap-1 text-xs">
                      {tech.unlocks.map(u => (
                        <span key={u} className="bg-gray-700 rounded px-1">{u}</span>
                      ))}
                    </div>
                    {researched && (
                      <span className="absolute top-1 right-2 text-green-300 font-bold text-xs">완료</span>
                    )}
                    {isResearching && (
                      <span className="absolute bottom-1 right-2 text-blue-300 font-bold text-xs">
                        진행 중 ({Math.round((researchState.progress / tech.cost) * 100)}%)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
