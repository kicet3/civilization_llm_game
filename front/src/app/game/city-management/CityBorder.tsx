import React from "react";
import { City } from "../page";

export default function CityBorder({ city }: { city: City }) {
  // TODO: 실제 경계 확장/타일 구매/자원 활용 로직 연결 필요
  return (
    <div className="bg-slate-800 rounded p-4">
      <h5 className="font-bold mb-2">도시 경계 및 확장</h5>
      <div className="flex gap-2 mb-2">
        <span>문화: {city.culture ?? 0}</span>
        <span>경계 확장까지: {city.cultureToNextBorder ?? "-"}</span>
      </div>
      <div className="flex gap-2">
        <button className="bg-yellow-600 px-2 py-1 rounded text-xs">타일 구매</button>
        <button className="bg-green-600 px-2 py-1 rounded text-xs">자원 활용</button>
      </div>
    </div>
  );
}
