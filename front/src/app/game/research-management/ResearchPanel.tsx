import React, { useState, useEffect } from "react";
import { useGameState } from "../globalGameState";
import TechTree from "./TechTree";
import ScienceBar from "./ScienceBar";
import TechDetailModal from "./TechDetailModal";
import { Tech, Era } from "./mockTechData";
import gameService from "@/services/gameService";
import { useToast } from "../ui/useToast";

interface ResearchPanelProps {
  userId: string;
  gameId: string;
}

// 연구 탭 메인 패널
export default function ResearchPanel({ userId, gameId }: ResearchPanelProps) {
  const [selectedTech, setSelectedTech] = useState<Tech | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const applyTechUnlock = useGameState(state => state.applyTechUnlock);
  
  // 실제 연구 데이터를 저장할 상태
  const [techTree, setTechTree] = useState<{ [id: string]: Tech }>({});
  const [researchState, setResearchState] = useState<{
    science: number;
    progress: number;
    currentTechId: string | null;
    researchedTechIds: string[];
  }>({
    science: 0,
    progress: 0,
    currentTechId: null,
    researchedTechIds: []
  });
  
  const { showToast } = useToast();

  // 컴포넌트 마운트 시 연구 트리 데이터 로드
  useEffect(() => {
    loadResearchData();
  }, [userId, gameId]);

  // 연구 트리 데이터 로드 함수
  const loadResearchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const researchData = await gameService.getResearchTree(userId, gameId);
      
      setTechTree(researchData.techs);
      setResearchState(researchData.researchState);
      
      setIsLoading(false);
      showToast({
        title: "연구 데이터 로드 완료",
        description: "연구 트리 데이터를 성공적으로 불러왔습니다.",
        variant: "default"
      });
    } catch (err) {
      console.error("연구 데이터 로드 오류:", err);
      setError(err instanceof Error ? err.message : '연구 데이터 로드 실패');
      setIsLoading(false);
      showToast({
        title: "연구 데이터 로드 실패",
        description: err instanceof Error ? err.message : '연구 데이터를 불러오는데 실패했습니다',
        variant: "destructive"
      });
    }
  };

  // 기술 선택 핸들러
  const handleSelectTech = (tech: Tech) => {
    setSelectedTech(tech);
  };

  // 기술 연구 시작
  const handleStartResearch = async (tech: Tech) => {
    try {
      setIsLoading(true);
      
      // 백엔드에 연구 시작 요청
      const result = await gameService.startResearch(userId, tech.id, gameId);
      
      if (result.success) {
        // 연구 상태 업데이트
        setResearchState(result.researchState);
        
        // 이미 연구 완료된 기술이면 글로벌 상태에 반영
        if (result.researchState.researchedTechIds.includes(tech.id)) {
          applyTechUnlock(tech.id);
        }
        
        showToast({
          title: "연구 시작",
          description: `${tech.name} 연구를 시작했습니다.`,
          variant: "default"
        });
      }
      
      setSelectedTech(null);
      setIsLoading(false);
    } catch (err) {
      console.error("연구 시작 오류:", err);
      showToast({
        title: "연구 시작 실패",
        description: err instanceof Error ? err.message : '연구를 시작하는데 실패했습니다',
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="p-4 h-full overflow-auto flex items-center justify-center">
        <div className="text-xl text-blue-300 animate-pulse">연구 데이터 로딩 중...</div>
      </div>
    );
  }

  // 오류 표시
  if (error) {
    return (
      <div className="p-4 h-full overflow-auto flex flex-col items-center justify-center">
        <div className="text-xl text-red-400 mb-4">{error}</div>
        <button 
          onClick={loadResearchData}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-xl font-bold mb-4">연구</h3>
      <ScienceBar 
        science={researchState.science} 
        progress={researchState.progress} 
        currentTech={researchState.currentTechId ? techTree[researchState.currentTechId] : null} 
      />
      <TechTree 
        techTree={techTree}
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
