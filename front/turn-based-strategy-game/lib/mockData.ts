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
  const map: HexTile[] = [];
  
  for (let q = -5; q <= 5; q++) {
    for (let r = -5; r <= 5; r++) {
      if (Math.abs(q + r) <= 5) { // 균형잡힌 육각형 모양을 위한 제약조건
        const terrainIndex = Math.floor(Math.random() * terrainTypes.length);
        map.push({
          q,
          r,
          s: -q-r, // 큐브 좌표계 특성: q + r + s = 0
          terrain: terrainTypes[terrainIndex],
          hasUnit: false, // 유닛은 별도로 관리되므로 기본값은 false
          hasCity: Math.random() > 0.9,
          owner: Math.random() > 0.7 ? (Math.random() > 0.5 ? "player" : "ai") : null
        });
      }
    }
  }
  
  // 플레이어 시작 위치 (중앙)에 평지 생성
  const centerTile = map.find(tile => tile.q === 0 && tile.r === 0);
  if (centerTile) {
    centerTile.terrain = 'plain';
    centerTile.owner = 'player';
  }
  
  return map;
};

// 목업 유닛 데이터
export const mockUnits: Unit[] = [
  { 
    id: 1, 
    name: "보병", 
    type: "military", 
    strength: 10, 
    movement: 2,
    movementLeft: 2,
    position: { q: 0, r: 0 },
    owner: "player",
    level: 1,
    experience: 0
  },
  { 
    id: 2, 
    name: "정착민", 
    type: "civilian", 
    movement: 2,
    movementLeft: 2,
    position: { q: 1, r: -1 },
    owner: "player",
    abilities: ["도시 건설"]
  },
  { 
    id: 3, 
    name: "궁수", 
    type: "military", 
    strength: 8, 
    movement: 2,
    movementLeft: 2,
    position: { q: -1, r: 2 },
    owner: "player",
    level: 1,
    experience: 0
  },
  { 
    id: 4, 
    name: "적 병사", 
    type: "military", 
    strength: 7, 
    movement: 2,
    movementLeft: 2,
    position: { q: 3, r: -3 },
    owner: "ai",
    level: 1,
    experience: 0
  },
  {
    id: 5,
    name: "기병",
    type: "military",
    strength: 12,
    movement: 4,
    movementLeft: 4,
    position: { q: 2, r: 2 },
    owner: "player",
    level: 1,
    experience: 0
  },
  {
    id: 6,
    name: "노동자",
    type: "civilian",
    movement: 2,
    movementLeft: 2,
    position: { q: -2, r: 0 },
    owner: "player",
    abilities: ["지형 개선"]
  },
  {
    id: 7,
    name: "갤리선",
    type: "naval",
    strength: 5,
    movement: 3,
    movementLeft: 3,
    position: { q: -4, r: 4 },
    owner: "player",
    abilities: ["해상 이동"]
  }
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
    food: 10,
    growth: 15,
    production: {
      current: "barrack",
      progress: 10,
      total: 30
    }
  },
  {
    id: 2,
    name: "스파르타",
    owner: "player",
    population: 3,
    buildings: ["barrack"],
    position: { q: -3, r: 1 },
    food: 8,
    growth: 12,
    production: {
      current: "warrior",
      progress: 5,
      total: 20
    }
  },
  {
    id: 3,
    name: "로마",
    owner: "ai",
    population: 5,
    buildings: ["granary", "market", "barrack"],
    position: { q: 4, r: -2 },
    food: 12,
    growth: 18
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

// 타일 색상 결정 함수
export const getTileColor = (terrain: HexTile['terrain']): string => {
  switch(terrain) {
    case 'plain': return '#a3c557';
    case 'mountain': return '#8b8b8b';
    case 'forest': return '#2d6a4f';
    case 'water': return '#4ea8de';
    case 'desert': return '#e9c46a';
    default: return '#ffffff';
  }
};

// 두 위치 사이의 거리 계산 (큐브 좌표계 사용)
export const getDistance = (a: Position, b: Position): number => {
  return Math.max(
    Math.abs(a.q - b.q),
    Math.abs(a.q + a.r - b.q - b.r),
    Math.abs(a.r - b.r)
  );
};

// 위치가 동일한지 확인
export const isSamePosition = (a: Position, b: Position): boolean => {
  return a.q === b.q && a.r === b.r;
};

// 특정 위치에서 이동 가능한 이웃 타일 계산
export const getNeighbors = (pos: Position): Position[] => {
  const directions = [
    { q: 1, r: -1 }, { q: 1, r: 0 }, { q: 0, r: 1 },
    { q: -1, r: 1 }, { q: -1, r: 0 }, { q: 0, r: -1 }
  ];
  
  return directions.map(dir => ({
    q: pos.q + dir.q,
    r: pos.r + dir.r
  }));
};

// 전투 결과 시뮬레이션 함수
export const simulateCombat = (
  attacker: Unit, 
  defender: Unit, 
  terrainBonus: number = 0
): { winner: 'attacker' | 'defender', remainingStrength: number } => {
  const attackerStr = attacker.strength || 0;
  const defenderStr = (defender.strength || 0) + terrainBonus;
  
  // 간단한 전투 공식
  const attackerPower = attackerStr * (Math.random() * 0.5 + 0.75); // 75%~125% 랜덤 변동
  const defenderPower = defenderStr * (Math.random() * 0.5 + 0.75); // 75%~125% 랜덤 변동
  
  if (attackerPower > defenderPower) {
    return { 
      winner: 'attacker', 
      remainingStrength: Math.floor(attackerPower - defenderPower / 2)
    };
  } else {
    return { 
      winner: 'defender', 
      remainingStrength: Math.floor(defenderPower - attackerPower / 2)
    };
  }
};

// 특정 위치의 유닛 찾기
export const findUnitAtPosition = (units: Unit[], pos: Position): Unit | undefined => {
  return units.find(unit => unit.position.q === pos.q && unit.position.r === pos.r);
};

// 목업 기술 데이터
export const mockTechnologies: Technology[] = [
  {
    id: "agriculture",
    name: "농업",
    cost: 20,
    description: "식량 생산량 증가",
    era: "고대",
    unlocks: ["irrigation", "pottery"]
  },
  {
    id: "bronze_working",
    name: "청동기",
    cost: 30,
    description: "전투력 증가",
    era: "고대",
    unlocks: ["iron_working"]
  },
  {
    id: "writing",
    name: "문자",
    cost: 25,
    description: "과학 생산량 증가",
    era: "고대",
    unlocks: ["philosophy"]
  }
];

// 목업 건물 데이터
export const mockBuildings: Building[] = [
  {
    id: "granary",
    name: "곡물 저장고",
    description: "식량 저장량 증가",
    goldCost: 60,
    woodCost: 20,
    ironCost: 0,
    maintenance: 1,
    effects: {
      food: 2
    }
  },
  {
    id: "barrack",
    name: "병영",
    description: "군사 유닛 생산",
    goldCost: 80,
    woodCost: 30,
    ironCost: 10,
    maintenance: 2,
    effects: {
      military: 1
    }
  },
  {
    id: "market",
    name: "시장",
    description: "골드 생산량 증가",
    goldCost: 100,
    woodCost: 20,
    ironCost: 0,
    maintenance: 2,
    effects: {
      gold: 3
    }
  }
];

// 목업 유닛 타입 데이터
export const mockUnitTypes: UnitType[] = [
  {
    id: "settler",
    name: "정착민",
    type: "civilian",
    movement: 2,
    goldCost: 100,
    description: "새로운 도시를 건설할 수 있음",
    requirements: []
  },
  {
    id: "warrior",
    name: "전사",
    type: "military",
    movement: 2,
    strength: 10,
    goldCost: 50,
    description: "기본 전투 유닛",
    requirements: []
  },
  {
    id: "archer",
    name: "궁수",
    type: "military",
    movement: 2,
    strength: 8,
    goldCost: 60,
    description: "원거리 공격 유닛",
    requirements: ["bronze_working"]
  },
  {
    id: "worker",
    name: "노동자",
    type: "civilian",
    movement: 2,
    goldCost: 70,
    description: "지형을 개선할 수 있음",
    requirements: []
  }
];