// 유닛 및 유닛 타입 목업 데이터 (백엔드 연동 전용)

export interface Unit {
  id: string;
  name: string;
  type: string;
  typeName: string;
  hp: number;
  maxHp: number;
  movement: number;
  maxMovement: number;
  status: string;
}

export interface UnitType {
  type: string;
  name: string;
  description: string;
  movement: number;
  maxHp: number;
  commands: string[];
  special: string[];
}

export const mockUnitTypes: { [type: string]: UnitType } = {
  scout: {
    type: "scout",
    name: "정찰병",
    description: "맵 탐사에 특화된 유닛. 이동력 보너스.",
    movement: 3,
    maxHp: 60,
    commands: ["이동", "대기", "자동화", "해산"],
    special: ["지형 이동 보너스"]
  },
  warrior: {
    type: "warrior",
    name: "전사",
    description: "기본 근접 전투 유닛.",
    movement: 2,
    maxHp: 70,
    commands: ["이동", "공격", "요새화", "대기", "해산"],
    special: ["도시 점령 가능"]
  },
  archer: {
    type: "archer",
    name: "궁병",
    description: "원거리 공격 유닛. 방어력이 약함.",
    movement: 2,
    maxHp: 50,
    commands: ["이동", "공격", "대기", "해산"],
    special: ["원거리 공격"]
  },
  turtleShip: {
    type: "turtleShip",
    name: "거북선",
    description: "한국 고유 해상 유닛. 방어력 우수.",
    movement: 4,
    maxHp: 80,
    commands: ["이동", "공격", "대기", "해산"],
    special: ["해상 이동", "방어력 증가"]
  },
};

export const mockUnits: Unit[] = [
  {
    id: "u1",
    name: "정찰병 1",
    type: "scout",
    typeName: "정찰병",
    hp: 60,
    maxHp: 60,
    movement: 3,
    maxMovement: 3,
    status: "대기 중"
  },
  {
    id: "u2",
    name: "전사 1",
    type: "warrior",
    typeName: "전사",
    hp: 70,
    maxHp: 70,
    movement: 2,
    maxMovement: 2,
    status: "이동 가능"
  },
  {
    id: "u3",
    name: "궁병 1",
    type: "archer",
    typeName: "궁병",
    hp: 50,
    maxHp: 50,
    movement: 2,
    maxMovement: 2,
    status: "대기 중"
  },
  {
    id: "u4",
    name: "거북선 1",
    type: "turtleShip",
    typeName: "거북선",
    hp: 80,
    maxHp: 80,
    movement: 4,
    maxMovement: 4,
    status: "항해 중"
  },
];
