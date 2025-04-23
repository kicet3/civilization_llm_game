import React from "react";
import { City } from "../page";

export default function CityProduction({ city }: { city: City }) {
  // TODO: 실제 생산 대기열/구매/즉시생산 로직 연결 필요
  return (
    <div className="bg-slate-800 rounded p-4">
      <h5 className="font-bold mb-2">생산 대기열</h5>
      <ul className="mb-2">
        {city.productionQueue?.length ? city.productionQueue.map((item: any, idx: number) => (
          <li key={idx} className="flex justify-between items-center py-1 border-b border-slate-700 last:border-b-0">
            <span>{item.name}</span>
            <span className="text-xs text-gray-400">{item.turnsLeft}턴</span>
            <button className="ml-2 text-xs text-red-400">제거</button>
          </li>
        )) : <li className="text-gray-400 text-xs">대기열 없음</li>}
      </ul>
      <div className="flex gap-2 mb-2">
        <button className="bg-indigo-600 px-2 py-1 rounded text-xs">즉시 생산</button>
        <button className="bg-yellow-600 px-2 py-1 rounded text-xs">골드 구매</button>
        <button className="bg-purple-600 px-2 py-1 rounded text-xs">신앙 구매</button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {/* TODO: 실제 건설 가능 목록 연결 */}
        <button className="bg-gray-700 px-2 py-1 rounded text-xs">전사</button>
        <button className="bg-gray-700 px-2 py-1 rounded text-xs">정착민</button>
        <button className="bg-gray-700 px-2 py-1 rounded text-xs">도서관</button>
        <button className="bg-gray-700 px-2 py-1 rounded text-xs">시장</button>
        <button className="bg-gray-700 px-2 py-1 rounded text-xs">불가사의</button>
      </div>
    </div>
  );
}
