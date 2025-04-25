import React, { useState, useEffect } from "react";
import { useGameState } from "../globalGameState";
import TechTree from "./TechTree";
import ScienceBar from "./ScienceBar";
import TechDetailModal from "./TechDetailModal";
import researchService from "@/services/researchService";
import { Tech, ResearchStateResponse } from "@/types/game";
import { Button } from "../../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";

interface ResearchPanelProps {
  updateGameData?: () => Promise<void>;
}

// 연구 탭 메인 패널
export default function ResearchPanel({ updateGameData }: ResearchPanelProps) {
  const [gameId, setGameId] = useState<string>("");
  const [playerId, setPlayerId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState<Tech | null>(null);
  const [techTree, setTechTree] = useState<{ [id: string]: Tech }>({});
  const [currentEra, setCurrentEra] = useState<string>("Medieval");
  const [availableEras, setAvailableEras] = useState<string[]>(["Medieval", "Industrial", "Modern"]);
  const [researchState, setResearchState] = useState<ResearchStateResponse>({
    currentTechId: null,
    researchedTechIds: [],
    progress: {},
    sciencePerTurn: 0,
    era: "Medieval"
  });

  // 시대명 매핑
  const eraMapping: Record<string, string> = {
    "Medieval": "중세",
    "Industrial": "산업",
    "Modern": "현대"
  };

  // 글로벌 게임 상태에서 필요한 정보 가져오기
  const applyTechUnlock = useGameState(state => state.applyTechUnlock);

  // 초기 데이터 로드
  useEffect(() => {
    // 로컬 스토리지에서 게임 ID와 플레이어 ID 가져오기
    const storedGameId = localStorage.getItem('text_civ_game_id');
    const storedPlayerId = localStorage.getItem('text_civ_player_id');
    if (storedGameId && storedPlayerId) {
      setGameId(storedGameId);
      setPlayerId(storedPlayerId);
      loadResearchData(storedGameId, storedPlayerId);
    } else {
      setError("게임 정보를 찾을 수 없습니다.");
      setLoading(false);
    }
  }, []);

  // 연구 데이터 로드
  const loadResearchData = async (id: string, pid: string) => {
    try {
      setLoading(true);
      
      // 1. 기술 목록 가져오기
      const techsResponse = await researchService.getTechs();
      console.log("기술 목록 응답:", techsResponse); // 디버깅용 로그 추가
      
      if (techsResponse.success && techsResponse.data) {
        // 기술 목록을 ID로 매핑하여 저장
        const techMap: { [id: string]: Tech } = {};
        
        // 응답 데이터의 구조에 따라 처리
        if (Array.isArray(techsResponse.data.technologies)) {
          techsResponse.data.technologies.forEach((tech: Tech) => {
            techMap[tech.id] = tech;
          });
        } else if (Array.isArray(techsResponse.data)) {
          // 배열이 직접 응답된 경우
          techsResponse.data.forEach((tech: Tech) => {
            techMap[tech.id] = tech;
          });
        }
        
        console.log("처리된 기술 맵:", techMap); // 디버깅용 로그 추가
        setTechTree(techMap);
        
        // 사용 가능한 시대 설정
        let availableErasList = ["Medieval", "Industrial", "Modern"]; // 기본값
        
        if (techsResponse.data.eras && Array.isArray(techsResponse.data.eras) && techsResponse.data.eras.length > 0) {
          availableErasList = techsResponse.data.eras;
        }
        
        console.log("사용 가능한 시대:", availableErasList); // 디버깅용 로그 추가
        setAvailableEras(availableErasList);
        setCurrentEra(availableErasList[0]); // 기본 시대를 첫 번째 시대로 설정
      }

      // 2. 연구 상태 가져오기
      const stateResponse = await researchService.getResearchState(id, pid);
      console.log("연구 상태 응답:", stateResponse); // 디버깅용 로그 추가
      
      if (stateResponse.success && stateResponse.data) {
        setResearchState(stateResponse.data);
        if (stateResponse.data.era && availableEras.includes(stateResponse.data.era)) {
          setCurrentEra(stateResponse.data.era);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("연구 데이터 로드 중 오류:", err);
      setError("연구 데이터를 불러오는 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  // 기술 선택 핸들러
  const handleSelectTech = async (tech: Tech) => {
    try {
      // 기술 상세 정보 조회
      const detailResponse = await researchService.getTechDetail(tech.id);
      if (detailResponse.success && detailResponse.data) {
        setSelectedTech(detailResponse.data);
      } else {
        setSelectedTech(tech);
      }
    } catch (err) {
      console.error("기술 상세 정보 조회 중 오류:", err);
      setSelectedTech(tech);
    }
  };

  // 연구 시작 핸들러
  const handleStartResearch = async (tech: Tech) => {
    try {
      const response = await researchService.startResearch(gameId, tech.id);
      if (response.success && response.data) {
        // 연구 상태 업데이트
        setResearchState(prevState => ({
          ...prevState,
          currentTechId: tech.id,
          progress: {
            ...prevState.progress,
            [tech.id]: 0
          }
        }));
        
        // 변경된 연구 상태를 게임 상태에 반영
        if (updateGameData) {
          await updateGameData();
        }
        
        // 모달 닫기
        setSelectedTech(null);
      }
    } catch (err) {
      console.error("연구 시작 중 오류:", err);
      setError("연구를 시작하는 중 오류가 발생했습니다.");
    }
  };

  // 연구 변경 핸들러
  const handleChangeResearch = async (tech: Tech) => {
    try {
      const response = await researchService.changeResearch(gameId, tech.id);
      if (response.success && response.data) {
        // 연구 상태 업데이트
        setResearchState(prevState => ({
          ...prevState,
          currentTechId: tech.id,
          progress: {
            ...prevState.progress,
            [tech.id]: 0
          }
        }));
        
        // 변경된 연구 상태를 게임 상태에 반영
        if (updateGameData) {
          await updateGameData();
        }
        
        // 모달 닫기
        setSelectedTech(null);
      }
    } catch (err) {
      console.error("연구 변경 중 오류:", err);
      setError("연구를 변경하는 중 오류가 발생했습니다.");
    }
  };

  // 시대별 기술 필터링
  const filterTechsByEra = (era: string) => {
    console.log("Filtering by era:", era);
    console.log("Available techs:", techTree);
    
    if (!techTree || Object.keys(techTree).length === 0) {
      console.log("No tech tree data available");
      return [];
    }
    
    const filteredTechs = Object.values(techTree).filter(tech => tech.era === era);
    console.log("Filtered techs for era", era, ":", filteredTechs);
    return filteredTechs;
  };

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-full">
        <p>연구 데이터를 불러오는 중...</p>
      </div>
    );
  }

  // 오류 상태 표시
  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => playerId ? loadResearchData(gameId, playerId) : null} className="mt-2">재시도</Button>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-xl font-bold mb-4">연구</h3>
      
      {/* 과학 진행 바 */}
      <ScienceBar 
        science={researchState.sciencePerTurn} 
        progress={researchState.currentTechId ? researchState.progress[researchState.currentTechId] || 0 : 0} 
        currentTech={researchState.currentTechId ? techTree[researchState.currentTechId] : null} 
      />
      
      {/* 시대별 탭 */}
      <Tabs defaultValue={currentEra} className="mt-4">
        <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${availableEras.length}, 1fr)` }}>
          {availableEras.map(era => (
            <TabsTrigger key={era} value={era}>{eraMapping[era] || era}</TabsTrigger>
          ))}
        </TabsList>
        
        {availableEras.map(era => (
          <TabsContent key={era} value={era}>
            <TechTree 
              techTree={filterTechsByEra(era)}
              researchState={researchState}
              onSelectTech={handleSelectTech}
            />
          </TabsContent>
        ))}
      </Tabs>
      
      {/* 기술 상세 모달 */}
      {selectedTech && (
        <TechDetailModal 
          tech={selectedTech} 
          researched={researchState.researchedTechIds.includes(selectedTech.id)}
          isCurrentResearch={researchState.currentTechId === selectedTech.id}
          onClose={() => setSelectedTech(null)}
          onStartResearch={handleStartResearch}
          onChangeResearch={handleChangeResearch}
        />
      )}
    </div>
  );
}
