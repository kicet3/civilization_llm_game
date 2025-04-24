import React from "react";
import { Tech } from "./mockTechData";
import { Lightbulb } from "lucide-react";

interface ScienceBarProps {
  science: number;
  progress: number;
  currentTech: Tech | null;
}

export default function ScienceBar({ science, progress, currentTech }: ScienceBarProps) {
  // 진행률 계산
  const progressPercentage = currentTech
    ? Math.min(100, Math.round((progress / currentTech.cost) * 100))
    : 0;

  return (
    <div className="mb-6 bg-slate-900 p-4 rounded-lg border border-slate-700 shadow-md">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center text-blue-300">
          <Lightbulb className="mr-2" size={18} />
          <span className="font-bold">과학력:</span>
          <span className="ml-2">{science} / 턴</span>
        </div>
        
        {currentTech ? (
          <div className="text-white">
            연구 중: <span className="font-bold text-blue-300">{currentTech.name}</span>
            <span className="ml-2 text-sm">({progressPercentage}% 완료)</span>
          </div>
        ) : (
          <div className="text-gray-400 italic">연구 중인 기술 없음</div>
        )}
      </div>
      
      {currentTech && (
        <div className="relative w-full h-4 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            {progress} / {currentTech.cost}
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-400">
        {currentTech && (
          <div>
            <span>예상 완료까지 </span>
            <span className="font-bold">
              {Math.ceil((currentTech.cost - progress) / Math.max(1, science))} 턴
            </span>
            <span> 남음</span>
          </div>
        )}
      </div>
    </div>
  );
}
