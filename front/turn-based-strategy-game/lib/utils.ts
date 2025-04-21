import { HexTile, Unit, City, Position } from './types';

// 타일의 색상 결정
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

// 위치가 동일한지 확인
export const isSamePosition = (pos1: Position, pos2: Position): boolean => {
  return pos1.q === pos2.q && pos1.r === pos2.r;
};

// 특정 위치의 도시 찾기
export const findCityAtPosition = (cities: City[], position: Position): City | undefined => {
  return cities.find(city => isSamePosition(city.position, position));
};

// 특정 위치의 유닛 찾기
export const findUnitAtPosition = (units: Unit[], position: Position): Unit | undefined => {
  return units.find(unit => isSamePosition(unit.position, position));
};

// 두 타일 사이의 거리 계산 (큐브 좌표계 사용)
export const getDistance = (a: Position, b: Position): number => {
  return Math.max(
    Math.abs(a.q - b.q),
    Math.abs(a.q + a.r - b.q - b.r),
    Math.abs(a.r - b.r)
  );
};

// 특정 타일의 이웃 타일 좌표 계산
export const getNeighbors = (position: Position): Position[] => {
  const directions = [
    { q: 1, r: -1 }, { q: 1, r: 0 }, { q: 0, r: 1 },
    { q: -1, r: 1 }, { q: -1, r: 0 }, { q: 0, r: -1 }
  ];
  
  return directions.map(dir => ({
    q: position.q + dir.q,
    r: position.r + dir.r
  }));
};

// 관계 점수에 따른 상태 텍스트 반환
export const getRelationshipStatus = (relationship: number): '동맹' | '중립' | '적대' => {
  if (relationship >= 50) return '동맹';
  if (relationship >= 0) return '중립';
  return '적대';
};