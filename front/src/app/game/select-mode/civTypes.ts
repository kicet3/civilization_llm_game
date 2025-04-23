// 문명 타입 분류 및 매핑
export const CIV_TYPES = [
  { id: 'military', name: '군사', color: 'from-red-700 to-red-900' },
  { id: 'culture', name: '문화', color: 'from-pink-700 to-pink-900' },
  { id: 'economic', name: '경제', color: 'from-yellow-700 to-yellow-900' },
  { id: 'expansion', name: '확장', color: 'from-green-700 to-green-900' },
];

// 문명별 타입 매핑 (id 기준)
export const CIV_TYPE_MAP: Record<string, string> = {
  korea: 'science',
  china: 'science',
  babylon: 'science',
  inca: 'expansion',
  india: 'economic',
  arabia: 'economic',
  venice: 'economic',
  brazil: 'culture',
  france: 'culture',
  egypt: 'culture',
  maya: 'science',
  russia: 'military',
  germany: 'military',
  mongol: 'military',
  japan: 'military',
  america: 'expansion',
  poland: 'military',
  greece: 'expansion',
  rome: 'military',
  assyria: 'military',
  aztec: 'military',
  ethiopia: 'defense',
  siam: 'culture',
  shoshone: 'expansion',
  persia: 'culture',
};
