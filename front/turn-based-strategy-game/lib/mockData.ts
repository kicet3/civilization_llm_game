import { GameState, HexTile, Unit, City, NpcDialog, GameEvent, Position } from './types';

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
          hasUnit: Math.random() > 0.85,
          hasCity: Math.random() > 0.9,
          owner: Math.random() > 0.7 ? (Math.random() > 0.5 ? "player" : "ai") : null
        });
      }
    }
  }
  return map;
};

// 목업 유닛 데이터
export const mockUnits: Unit[] = [
  { id: 1, name: "보병", type: "military", strength: 10, movement: 2, position: { q: 0, r: 0 } },
  { id: 2, name: "정착민", type: "civilian", movement: 2, position: { q: 1, r: -1 } },
  { id: 3, name: "궁수", type: "military", strength: 8, movement: 2, position: { q: -1, r: 2 } }
];

// 목업 도시 데이터
export const mockCities: City[] = [
  { id: 1, name: "아테네", owner: "player", population: 4, buildings: ["신전", "시장"], position: { q: 2, r: -2 } }
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
  { id: 2, title: "자연재해", description: "지진이 발생하여 아테네의 인구가 감소했습니다.", type: "disaster" }
];