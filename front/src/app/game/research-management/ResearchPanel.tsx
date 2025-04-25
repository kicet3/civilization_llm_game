import React, { useState } from "react";
import { useGameState } from "../globalGameState";
import TechTree from "./TechTree";
import ScienceBar from "./ScienceBar";
import TechDetailModal from "./TechDetailModal";
import { Tech, Era, ResearchState, mockTechTree, mockResearchState } from "./mockTechData";

// 연구 탭 메인 패널
export default function ResearchPanel() {
  const [selectedTech, setSelectedTech] = useState<Tech | null>(null);
  const applyTechUnlock = useGameState(state => state.applyTechUnlock);
  const [researchState, setResearchState] = useState<ResearchState>(mockResearchState);

  // 기술 선택 핸들러
  const handleSelectTech = (tech: Tech) => {
    setSelectedTech(tech);
  };

  // 기술 연구 시작
  const handleStartResearch = (tech: Tech) => {
    setResearchState({
      ...researchState,
      [tech.id]: { ...researchState[tech.id], researched: true },
    });
    applyTechUnlock(tech.id); // 글로벌 상태에 기술 해금 반영
    setSelectedTech(null);
  };

  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-xl font-bold mb-4">연구</h3>
      <ScienceBar science={researchState.science} progress={researchState.progress} currentTech={researchState.currentTechId ? mockTechTree[researchState.currentTechId] : null} />
      <TechTree 
        techTree={mockTechTree}
        researchState={researchState}
        onSelectTech={handleSelectTech}
        onStartResearch={handleStartResearch}
      />
      {selectedTech && (
        <TechDetailModal 
          tech={selectedTech} 
          researched={researchState.researchedTechIds.includes(selectedTech.id)}
          onClose={() => setSelectedTech(null)}
          onStartResearch={handleStartResearch}
        />
      )}
    </div>
  );
}
