// 종교 목업 데이터 및 타입

export interface Religion {
  id: string;
  name: string;
  founder: string;
  cityCount: number;
}

export interface ReligionState {
  faith: number;
  foundedReligionId: string | null;
  followerReligionId: string | null;
}

export const mockReligions: Religion[] = [
  { id: "buddhism", name: "불교", founder: "인도", cityCount: 3 },
  { id: "christianity", name: "기독교", founder: "로마", cityCount: 2 },
  { id: "confucianism", name: "유교", founder: "중국", cityCount: 1 },
];

export const mockReligionState: ReligionState = {
  faith: 24,
  foundedReligionId: "buddhism",
  followerReligionId: "buddhism"
};
