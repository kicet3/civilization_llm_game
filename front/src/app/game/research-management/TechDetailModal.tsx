import React from "react";
import { Tech } from "./mockTechData";

interface TechDetailModalProps {
  tech: Tech;
  researched: boolean;
  onClose: () => void;
  onStartResearch: (techId: string) => void;
}

export default function TechDetailModal({ tech, researched, onClose, onStartResearch }: TechDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg p-6 w-[400px] relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={onClose}>X</button>
        <h4 className="font-bold text-xl mb-2">{tech.name}</h4>
        <div className="mb-2 text-sm text-gray-300">{tech.description}</div>
        <div className="mb-2 text-xs">연구비용: {tech.cost}</div>
        <div className="mb-2 text-xs">시대: {tech.era}</div>
        <div className="mb-2 text-xs">선행 기술: {tech.prerequisites.length === 0 ? '없음' : tech.prerequisites.map(id => tech.nameMap[id]).join(', ')}</div>
        <div className="mb-2 text-xs">해금: {tech.unlocks.join(', ')}</div>
        {!researched && <button className="mt-2 px-4 py-1 bg-blue-600 rounded text-white" onClick={() => onStartResearch(tech.id)}>이 기술 연구 시작</button>}
        {researched && <div className="mt-2 text-green-400 font-bold">연구 완료됨</div>}
      </div>
    </div>
  );
}
