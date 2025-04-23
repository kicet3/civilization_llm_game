// 외교/도시국가 목업 데이터 및 타입

export interface Civ {
  id: string;
  name: string;
  personality: string;
}

export interface CityState {
  id: string;
  name: string;
  type: string;
}

export interface DiplomacyState {
  civRelations: { [civId: string]: string };
  cityStateRelations: { [csId: string]: number };
  cityStateAllies: { [csId: string]: boolean };
}

export const mockCivs: Civ[] = [
  { id: "korea", name: "한국", personality: "과학/평화적" },
  { id: "japan", name: "일본", personality: "정복/공격적" },
  { id: "france", name: "프랑스", personality: "문화/외교적" },
  { id: "germany", name: "독일", personality: "공업/정복" },
];

export const mockCityStates: CityState[] = [
  { id: "cs1", name: "서울", type: "문화" },
  { id: "cs2", name: "홍콩", type: "상업" },
  { id: "cs3", name: "바티칸", type: "종교" },
];

export const mockDiplomacyState: DiplomacyState = {
  civRelations: {
    korea: "우호적",
    japan: "경계",
    france: "중립",
    germany: "비난"
  },
  cityStateRelations: {
    cs1: 55,
    cs2: 10,
    cs3: 80
  },
  cityStateAllies: {
    cs1: false,
    cs2: false,
    cs3: true
  }
};
