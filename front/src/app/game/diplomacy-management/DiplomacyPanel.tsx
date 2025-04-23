import React, { useState } from "react";
import { mockCivs, mockCityStates, mockDiplomacyState, Civ, CityState } from "./mockDiplomacyData";

export default function DiplomacyPanel() {
  const [selectedCiv, setSelectedCiv] = useState<Civ | null>(null);
  const [selectedCityState, setSelectedCityState] = useState<CityState | null>(null);
  const [diplomacy, setDiplomacy] = useState(mockDiplomacyState);

  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-xl font-bold mb-4">외교</h3>
      <div className="mb-6">
        <h4 className="font-bold mb-2">AI 문명</h4>
        <div className="flex flex-wrap gap-3">
          {mockCivs.map(civ => (
            <div
              key={civ.id}
              className={`p-3 rounded border cursor-pointer w-44 ${selectedCiv?.id === civ.id ? 'border-blue-400 bg-slate-800' : 'border-slate-600 bg-slate-900'}`}
              onClick={() => setSelectedCiv(civ)}
            >
              <div className="font-bold text-base">{civ.name}</div>
              <div className="text-xs text-gray-400">성향: {civ.personality}</div>
              <div className="text-xs">관계: {diplomacy.civRelations[civ.id]}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mb-6">
        <h4 className="font-bold mb-2">도시국가</h4>
        <div className="flex flex-wrap gap-3">
          {mockCityStates.map(cs => (
            <div
              key={cs.id}
              className={`p-3 rounded border cursor-pointer w-44 ${selectedCityState?.id === cs.id ? 'border-purple-400 bg-slate-800' : 'border-slate-600 bg-slate-900'}`}
              onClick={() => setSelectedCityState(cs)}
            >
              <div className="font-bold text-base">{cs.name}</div>
              <div className="text-xs text-gray-400">유형: {cs.type}</div>
              <div className="text-xs">호감도: {diplomacy.cityStateRelations[cs.id]}</div>
              <div className="text-xs">동맹: {diplomacy.cityStateAllies[cs.id] ? 'O' : 'X'}</div>
            </div>
          ))}
        </div>
      </div>
      {/* 기능 확장: 외교 명령, 무역, 동맹, 비난, 전쟁 등 */}
      <div className="mt-6">
        <h4 className="font-bold mb-2">외교 명령/상호작용 (목업)</h4>
        <div className="flex gap-2 flex-wrap">
          <button className="bg-blue-700 px-3 py-1 rounded text-xs text-white">무역 제안</button>
          <button className="bg-green-700 px-3 py-1 rounded text-xs text-white">동맹 요청</button>
          <button className="bg-yellow-700 px-3 py-1 rounded text-xs text-white">비난</button>
          <button className="bg-red-700 px-3 py-1 rounded text-xs text-white">전쟁 선언</button>
        </div>
      </div>
    </div>
  );
}
