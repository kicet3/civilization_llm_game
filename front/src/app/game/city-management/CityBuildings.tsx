import React from "react";
import { City } from "../page";

export default function CityBuildings({ city }: { city: City }) {
  // TODO: 실제 건물/불가사의/특화/효과 누적 로직 연결 필요
  return (
    <div className="bg-slate-800 rounded p-4">
      <h5 className="font-bold mb-2">건물 및 특화</h5>
      <div className="flex flex-wrap gap-2 mb-2">
        {/* TODO: 실제 건물 목록 렌더링 */}
        <span className="bg-gray-700 px-2 py-1 rounded text-xs">도서관</span>
        <span className="bg-gray-700 px-2 py-1 rounded text-xs">시장</span>
        <span className="bg-yellow-700 px-2 py-1 rounded text-xs">불가사의</span>
      </div>
      <div className="flex gap-2">
        <button className="bg-blue-600 px-2 py-1 rounded text-xs">과학 특화</button>
        <button className="bg-green-600 px-2 py-1 rounded text-xs">생산 특화</button>
        <button className="bg-yellow-600 px-2 py-1 rounded text-xs">골드 특화</button>
      </div>
    </div>
  );
}
