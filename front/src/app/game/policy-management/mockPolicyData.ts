// 사회 정책 목업 데이터 및 타입

export interface PolicyTree {
  id: string;
  name: string;
  description: string;
  policies: { id: string; name: string; description: string }[];
}

export interface PolicyState {
  culture: number;
  adopted: string[];
  ideology: string | null;
}

export const mockPolicies: PolicyTree[] = [
  {
    id: "tradition",
    name: "전통",
    description: "수도 성장 및 초기 도시 강화 (소수 도시 운영에 유리)",
    policies: [
      { id: "tradition1", name: "수도 성장", description: "수도 인구 성장률 증가" },
      { id: "tradition2", name: "방어 강화", description: "도시 방어력 증가" },
    ]
  },
  {
    id: "liberty",
    name: "자유",
    description: "급속 확장/신속 개척 유리 (다도시 전략)",
    policies: [
      { id: "liberty1", name: "개척자 생산", description: "개척자 생산 속도 증가" },
      { id: "liberty2", name: "골드 보너스", description: "도시당 골드 증가" },
    ]
  },
  {
    id: "honor",
    name: "명예",
    description: "전투와 정복 중심 (군사 문명)",
    policies: [
      { id: "honor1", name: "전투 경험치", description: "전투 시 경험치 증가" },
      { id: "honor2", name: "야만인 보너스", description: "야만인 전투력 증가" },
    ]
  },
];

export const mockPolicyState: PolicyState = {
  culture: 13,
  adopted: ["tradition1"],
  ideology: null
};
