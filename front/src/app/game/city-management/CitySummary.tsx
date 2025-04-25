import React from "react";
import { City } from "../page";

export default function CitySummary({ city }: { city: City }) {
  return (
    <div className="bg-slate-800 rounded p-4 flex flex-col md:flex-row justify-between items-center">
      <div>
        <h4 className="text-lg font-bold mb-2">{city.name}</h4>
        <div className="flex gap-4 text-sm mb-2">
          <span>인구: {city.population}</span>
          <span>행복도: {city.happiness ?? "-"}</span>
          <span>체력: {city.hp ?? "-"}</span>
          <span>방어: {city.defense ?? "-"}</span>
        </div>
        <div className="flex gap-4 text-xs text-gray-300">
          <span>식량: {city.food ?? 0}</span>
          <span>생산력: {city.production ?? 0}</span>
          <span>골드: {city.gold ?? 0}</span>
          <span>과학: {city.science ?? 0}</span>
          <span>문화: {city.culture ?? 0}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-3 md:mt-0">
        <button className="bg-blue-600 px-3 py-1 rounded text-xs">자동 생산</button>
        <button className="bg-green-600 px-3 py-1 rounded text-xs">자동 시민</button>
        <select className="bg-gray-700 rounded text-xs px-2 py-1">
          <option>집중 없음</option>
          <option>식량 우선</option>
          <option>생산 우선</option>
          <option>골드 우선</option>
          <option>과학 우선</option>
        </select>
      </div>
    </div>
  );
}
