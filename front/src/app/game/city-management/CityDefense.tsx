import React from "react";
import { City } from "../page";

export default function CityDefense({ city }: { city: City }) {
  // TODO: 실제 방어/전투/주둔 유닛/자동 반격 로직 연결 필요
  return (
    <div className="bg-slate-800 rounded p-4">
      <h5 className="font-bold mb-2">방어 및 전투</h5>
      <div className="flex gap-4 mb-2">
        <span>체력: {city.hp ?? "-"}</span>
        <span>방어: {city.defense ?? "-"}</span>
        <span>주둔 유닛: {city.garrisonedUnit ?? "없음"}</span>
      </div>
      <div className="flex gap-2">
        <button className="bg-blue-600 px-2 py-1 rounded text-xs">주둔 해제</button>
        <button className="bg-red-600 px-2 py-1 rounded text-xs">자동 반격</button>
      </div>
    </div>
  );
}
