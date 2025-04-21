import { GameState, HexTile, Unit, City, NpcDialog, GameEvent, Position, Technology, Building, UnitType } from './types';

// 목업 게임 상태
export const mockGameState: GameState = {
  version: "1.0",
  turn: 7,
  year: "기원전 400년",
  playerInfo: {
    name: "알렉산더",
    nation: "그리스",
    gold: 450,
    science: 25,
    culture: 18,
    resources: {
      food: 32,
      wood: 15,
      iron: 8
    }
  },
  diplomacy: [
    { nationId: 1, name: "로마", relationship: 65, status: "동맹" },
    { nationId: 2, name: "이집트", relationship: 30, status: "중립" },
    { nationId: 3, name: "페르시아", relationship: -20, status: "적대" }
  ]
};

// 맵 데이터 생성 함수
export const generateHexMap = (): HexTile[] => {
  const terrainTypes: ('plain' | 'mountain' | 'forest' | 'water' | 'desert')[] = ['plain', 'mountain', 'forest', 'water', 'desert'];
  const resourceTypes: ('iron' | 'horses' | 'oil' | 'uranium' | 'gems' | undefined)[] = [undefined, undefined, undefined, 'iron', 'horses', 'gems'];
  const map: HexTile[] = [];
  
  for (let q = -5; q <= 5; q++) {
    for (let r = -5; r <= 5; r++) {
      if (Math.abs(q + r) <= 5) { // 균형잡힌 육각형 모양을 위한 제약조건
        const terrainIndex = Math.floor(Math.random() * terrainTypes.length);
        const resourceIndex = Math.floor(Math.random() * resourceTypes.length);
        
        map.push({
          q,
          r,
          s: -q-r, // 큐브 좌표계 특성: q + r + s = 0
          terrain: terrainTypes[terrainIndex],
          hasUnit: Math.random() > 0.85,
          hasCity: Math.random() > 0.9,
          owner: Math.random() > 0.7 ? (Math.random() > 0.5 ? "player" : "ai") : null,
          resource: resourceTypes[resourceIndex]
        });
      }
    }
  }
  
  // Ensure player starts with a clear area
  const centerTile = map.find(tile => tile.q === 0 && tile.r === 0);
  if (centerTile) {
    centerTile.terrain = 'plain';
    centerTile.hasUnit = true;
    centerTile.hasCity = true;
    centerTile.owner = 'player';
  }
  
  return map;
};

// 목업 유닛 데이터
export const mockUnits: Unit[] = [
  { id: 1, name: "보병", type: "military", strength: 10, movement: 2, movementLeft: 2, position: { q: 0, r: 0 } },
  { id: 2, name: "정착민", type: "civilian", movement: 2, movementLeft: 2, position: { q: 1, r: -1 } },
  { id: 3, name: "궁수", type: "military", strength: 8, movement: 2, movementLeft: 2, position: { q: -1, r: 2 } }
];

// 목업 도시 데이터
export const mockCities: City[] = [
  { 
    id: 1, 
    name: "아테네", 
    owner: "player", 
    population: 4, 
    buildings: ["granary", "market"], 
    position: { q: 0, r: 0 },
    foodProduction: 10,
    productionPoints: 5,
    currentProduction: null
  }
];

// 목업 유닛 타입 데이터
export const mockUnitTypes: UnitType[] = [
  {
    id: "warrior",
    name: "전사",
    category: "military",
    strength: 10,
    movement: 2,
    goldCost: 50,
    ironCost: 0
  },
  {
    id: "archer",
    name: "궁수",
    category: "military",
    strength: 8,
    movement: 2,
    goldCost: 60,
    ironCost: 0,
    requiredTech: "archery"
  },
  {
    id: "spearman",
    name: "창병",
    category: "military",
    strength: 12,
    movement: 2,
    goldCost: 70,
    ironCost: 1,
    requiredTech: "bronze_working"
  },
  {
    id: "horseman",
    name: "기병",
    category: "military",
    strength: 14,
    movement: 4,
    goldCost: 80,
    ironCost: 0,
    requiredTech: "horseback_riding"
  },
  {
    id: "swordsman",
    name: "검병",
    category: "military",
    strength: 15,
    movement: 2,
    goldCost: 90,
    ironCost: 2,
    requiredTech: "iron_working"
  },
  {
    id: "settler",
    name: "정착민",
    category: "civilian",
    movement: 2,
    goldCost: 100,
    ironCost: 0
  },
  {
    id: "worker",
    name: "노동자",
    category: "civilian",
    movement: 2,
    goldCost: 70,
    ironCost: 0
  },
  {
    id: "scout",
    name: "정찰병",
    category: "civilian",
    movement: 3,
    goldCost: 40,
    ironCost: 0
  }
];

// 목업 기술 데이터
export const mockTechnologies: Technology[] = [
  {
    id: "agriculture",
    name: "농업",
    description: "농업의 발전으로 정착 생활과 도시 건설이 가능해졌습니다.",
    era: "ancient",
    cost: 20,
    prerequisites: [],
    researched: true,
    unlocksBuildings: ["granary"]
  },
  {
    id: "pottery",
    name: "도예",
    description: "음식과 물을 보관할 수 있는 그릇 제작 기술을 개발했습니다.",
    era: "ancient",
    cost: 25,
    prerequisites: ["agriculture"],
    researched: false,
    unlocksBuildings: ["storage"]
  },
  {
    id: "animal_husbandry",
    name: "목축",
    description: "동물을 사육하는 기술을 개발했습니다.",
    era: "ancient",
    cost: 25,
    prerequisites: ["agriculture"],
    researched: false
  },
  {
    id: "archery",
    name: "궁술",
    description: "원거리 공격이 가능한 활을 개발했습니다.",
    era: "ancient",
    cost: 30,
    prerequisites: ["agriculture"],
    researched: false,
    unlocksUnits: ["archer"]
  },
  {
    id: "mining",
    name: "채광",
    description: "지하 자원을 채취하는 방법을 개발했습니다.",
    era: "ancient",
    cost: 30,
    prerequisites: ["agriculture"],
    researched: false
  },
  {
    id: "sailing",
    name: "항해",
    description: "배를 만들고 조종하는 기술을 개발했습니다.",
    era: "ancient",
    cost: 35,
    prerequisites: ["pottery"],
    researched: false,
    unlocksUnits: ["galley"]
  },
  {
    id: "bronze_working",
    name: "청동 가공",
    description: "청동으로 도구와 무기를 만드는 기술을 개발했습니다.",
    era: "ancient",
    cost: 40,
    prerequisites: ["mining"],
    researched: false,
    unlocksUnits: ["spearman"],
    unlocksBuildings: ["barracks"]
  },
  {
    id: "writing",
    name: "문자",
    description: "정보를 기록하고 저장하는 문자 체계를 개발했습니다.",
    era: "ancient",
    cost: 45,
    prerequisites: ["pottery"],
    researched: false,
    unlocksBuildings: ["library"]
  },
  {
    id: "horseback_riding",
    name: "승마",
    description: "말을 타고 이동하는 기술을 개발했습니다.",
    era: "ancient",
    cost: 45,
    prerequisites: ["animal_husbandry"],
    researched: false,
    unlocksUnits: ["horseman"]
  },
  {
    id: "iron_working",
    name: "철 가공",
    description: "철을 제련하고 가공하는 기술을 개발했습니다.",
    era: "classical",
    cost: 60,
    prerequisites: ["bronze_working"],
    researched: false,
    unlocksUnits: ["swordsman"]
  }
];

// 목업 건물 데이터
export const mockBuildings: Building[] = [
  {
    id: "granary",
    name: "곡물 창고",
    description: "도시의 식량 생산을 증가시킵니다.",
    goldCost: 50,
    woodCost: 10,
    ironCost: 0,
    requiredTech: "agriculture",
    foodBonus: 2
  },
  {
    id: "market",
    name: "시장",
    description: "도시의 금화 생산을 증가시킵니다.",
    goldCost: 70,
    woodCost: 15,
    ironCost: 0,
    requiredTech: "pottery",
    goldBonus: 3
  },
  {
    id: "barracks",
    name: "병영",
    description: "군사 유닛의 경험치 획득량이 증가합니다.",
    goldCost: 80,
    woodCost: 20,
    ironCost: 0,
    requiredTech: "bronze_working"
  },
  {
    id: "library",
    name: "도서관",
    description: "도시의 과학 생산을 증가시킵니다.",
    goldCost: 80,
    woodCost: 20,
    ironCost: 0,
    requiredTech: "writing",
    scienceBonus: 2
  },
  {
    id: "workshop",
    name: "작업장",
    description: "도시의 생산력을 증가시킵니다.",
    goldCost: 100,
    woodCost: 30,
    ironCost: 2,
    requiredTech: "mining",
    woodBonus: 2,
    ironBonus: 1
  },
  {
    id: "temple",
    name: "신전",
    description: "도시의 문화 생산을 증가시킵니다.",
    goldCost: 120,
    woodCost: 30,
    ironCost: 0,
    requiredTech: "pottery",
    cultureBonus: 3
  }
];

// 목업 NPC 대화
export const mockNpcDialogs: NpcDialog[] = [
  { id: 1, npcName: "로마 황제", message: "우리의 동맹은 견고합니다. 함께 페르시아의 위협에 맞서 싸우겠습니다.", relationship: "동맹" },
  { id: 2, npcName: "이집트 파라오", message: "당신의 문명이 발전하는 모습이 인상적입니다. 무역 협정을 맺으면 어떨까요?", relationship: "중립" },
  { id: 3, npcName: "페르시아 왕", message: "당신의 영토 확장은 용납할 수 없습니다. 곧 우리의 힘을 보게 될 것입니다.", relationship: "적대" }
];

// 목업 이벤트
export const mockEvents: GameEvent[] = [
  { id: 1, title: "새로운 기술 발견", description: "천문학 기술을 발견했습니다. 이제 항해가 가능합니다.", type: "science" },
  { id: 2, title: "자연재해", description: "지진이 발생하여 아테네의 인구가 감소했습니다.", type: "disaster" },
  { id: 3, title: "문화적 발전", description: "새로운 예술 형태가 탄생했습니다. 문화 점수가 증가합니다.", type: "cultural" },
  { id: 4, title: "외교 제안", description: "이집트에서 무역 협정을 제안했습니다.", type: "diplomatic" }
];