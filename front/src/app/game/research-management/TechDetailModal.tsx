import React from "react";
import { Tech } from "./mockTechData";

interface TechDetailModalProps {
  tech: Tech;
  researched: boolean;
  onClose: () => void;
  onStartResearch: (tech: Tech) => void | Promise<void>;
}

export default function TechDetailModal({ 
  tech, 
  researched, 
  onClose, 
  onStartResearch 
}: TechDetailModalProps) {
  // 기술 이름에 맞는 아이콘 렌더링 (필요에 따라 확장 가능)
  const renderIcon = () => {
    switch (tech.id) {
      case 'pottery': return '🏺';
      case 'animal': return '🐴';
      case 'mining': return '⛏️';
      case 'sailing': return '⛵';
      case 'writing': return '📜';
      case 'bronzeWorking': return '🗡️';
      default: return '🔬';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 shadow-xl w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold flex items-center">
            <span className="mr-2 text-2xl">{renderIcon()}</span>
            {tech.name}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <div className="mb-2">
            <span className="text-blue-300 font-semibold">시대:</span> {tech.era}
          </div>
          <div className="mb-2">
            <span className="text-blue-300 font-semibold">연구 비용:</span> {tech.cost} 과학력
          </div>
          <div className="mb-4">
            <p className="text-gray-300">{tech.description}</p>
          </div>
          
          {tech.prerequisites.length > 0 && (
            <div className="mb-2">
              <span className="text-blue-300 font-semibold">필요 기술:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {tech.prerequisites.map(prereq => (
                  <span key={prereq} className="bg-blue-900 rounded px-2 py-1 text-xs">
                    {tech.nameMap?.[prereq] || prereq}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <span className="text-blue-300 font-semibold">해금 요소:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {tech.unlocks.map(item => (
                <span key={item} className="bg-green-900 rounded px-2 py-1 text-xs">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          {researched ? (
            <div className="bg-green-700 px-4 py-2 rounded text-center w-full">
              이미 연구 완료됨
            </div>
          ) : (
            <button
              onClick={() => onStartResearch(tech)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded w-full"
            >
              연구 시작
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
