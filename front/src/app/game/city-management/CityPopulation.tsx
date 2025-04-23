import React from "react";
import { City } from "../page";

export default function CityPopulation({ city }: { city: City }) {
  // TODO: 시민 배치, 타일 수확, 인구 증가 로직 연결 필요
  return (
    <div className="bg-slate-800 rounded p-4">
      <h5 className="font-bold mb-2">인구 및 타일 관리</h5>
      <div className="flex gap-2 mb-2">
        <span>인구: {city.population}</span>
        <span>다음 인구까지: {city.foodToNextPop ?? "-"}</span>
      </div>
      <div className="flex gap-2 mb-2">
        <button className="bg-blue-600 px-2 py-1 rounded text-xs">자동 배치</button>
        <button className="bg-gray-700 px-2 py-1 rounded text-xs">수동 배치</button>
      </div>
      <div className="flex flex-wrap gap-1">
        {/* TODO: 실제 시민 배치 현황 시각화 */}
        <span className="bg-green-700 px-2 py-1 rounded text-xs">타일1</span>
        <span className="bg-green-700 px-2 py-1 rounded text-xs">타일2</span>
      </div>
    </div>
  );
}
