// 기술, 시대, 연구 상태 목업 데이터 (백엔드 연동 전용)

export type Era = "고대" | "고전" | "중세" | "르네상스" | "산업" | "현대" | "정보";

export interface Tech {
  id: string;
  name: string;
  description: string;
  cost: number;
  era: Era;
  prerequisites: string[];
  unlocks: string[];
  nameMap: { [id: string]: string };
}

export interface ResearchState {
  science: number; // 매 턴 수입
  progress: number; // 현재 기술 연구 누적치
  currentTechId: string | null;
  researchedTechIds: string[];
}

// 예시 기술 트리 (실제 게임에서는 백엔드에서 불러옴)
export const mockTechTree: { [id: string]: Tech } = {
  pottery: {
    id: "pottery",
    name: "도자기",
    description: "곡물 저장고와 신앙 건물 건설 가능.",
    cost: 25,
    era: "고대",
    prerequisites: [],
    unlocks: ["곡물 저장고", "신전"],
    nameMap: { pottery: "도자기", animal: "동물 사육", mining: "채광", sailing: "범선" }
  },
  animal: {
    id: "animal",
    name: "동물 사육",
    description: "목장 건설, 말 자원 채취 가능.",
    cost: 30,
    era: "고대",
    prerequisites: [],
    unlocks: ["목장", "말 채취"],
    nameMap: { pottery: "도자기", animal: "동물 사육", mining: "채광", sailing: "범선" }
  },
  mining: {
    id: "mining",
    name: "채광",
    description: "광산 건설, 광물 자원 채취 가능.",
    cost: 35,
    era: "고대",
    prerequisites: [],
    unlocks: ["광산", "광물 채취"],
    nameMap: { pottery: "도자기", animal: "동물 사육", mining: "채광", sailing: "범선" }
  },
  sailing: {
    id: "sailing",
    name: "범선",
    description: "항구 건설, 해상 이동 가능.",
    cost: 40,
    era: "고대",
    prerequisites: [],
    unlocks: ["항구", "해상 이동"],
    nameMap: { pottery: "도자기", animal: "동물 사육", mining: "채광", sailing: "범선" }
  },
};

export const mockResearchState: ResearchState = {
  science: 6,
  progress: 12,
  currentTechId: "pottery",
  researchedTechIds: ["pottery"],
};
