// 글로벌 게임 상태 (Zustand 기반)
import { create } from 'zustand';

// 타입 정의 예시
export interface GameState {
  researchedTechs: string[];
  adoptedPolicies: string[];
  foundedReligionId: string | null;
  selectedDoctrines: string[];
  unlockedUnits: string[];
  unlockedBuildings: string[];
  cityBonuses: { [cityId: string]: { production: number; faith: number; culture: number } };
  // ... 기타 상태
  applyTechUnlock: (techId: string) => void;
  applyPolicy: (policyId: string) => void;
  applyDoctrine: (doctrineId: string) => void;
}

export const useGameState = create<GameState>((set, get) => ({
  researchedTechs: [],
  adoptedPolicies: [],
  foundedReligionId: null,
  selectedDoctrines: [],
  unlockedUnits: [],
  unlockedBuildings: [],
  cityBonuses: {},

  applyTechUnlock: (techId) => {
    // 예시: 기술 해금 시 유닛/건물 자동 해금
    let unlockedUnits = [...get().unlockedUnits];
    let unlockedBuildings = [...get().unlockedBuildings];
    if (techId === 'bronzeWorking') unlockedUnits.push('창병');
    if (techId === 'pottery') unlockedBuildings.push('곡물 저장고');
    set({
      researchedTechs: [...get().researchedTechs, techId],
      unlockedUnits,
      unlockedBuildings
    });
  },
  applyPolicy: (policyId) => {
    // 예시: 정책 채택 시 도시 생산력 보너스 적용
    const cityBonuses = { ...get().cityBonuses };
    Object.keys(cityBonuses).forEach(cid => {
      cityBonuses[cid] = {
        ...cityBonuses[cid],
        production: cityBonuses[cid].production + 2 // 예시: +2 생산력
      };
    });
    set({
      adoptedPolicies: [...get().adoptedPolicies, policyId],
      cityBonuses
    });
  },
  applyDoctrine: (doctrineId) => {
    // 예시: 종교 교리 선택 시 도시 보너스 적용
    const cityBonuses = { ...get().cityBonuses };
    Object.keys(cityBonuses).forEach(cid => {
      cityBonuses[cid] = {
        ...cityBonuses[cid],
        faith: cityBonuses[cid].faith + 2 // 예시: +2 신앙
      };
    });
    set({
      selectedDoctrines: [...get().selectedDoctrines, doctrineId],
      cityBonuses
    });
  }
}));
