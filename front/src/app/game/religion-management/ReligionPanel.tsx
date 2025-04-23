import React, { useState } from "react";
import { useGameState } from "../globalGameState";
import { mockReligionState, mockReligions, Religion } from "./mockReligionData";

export default function ReligionPanel() {
  const [religionState, setReligionState] = useState(mockReligionState);
  const applyDoctrine = useGameState(state => state.applyDoctrine);
  const [selectedReligion, setSelectedReligion] = useState<Religion | null>(null);

  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-xl font-bold mb-4">종교</h3>
      <div className="mb-4">
        <span className="font-bold">신앙 포인트:</span> {religionState.faith} / 턴
      </div>
      <div className="mb-6">
        <h4 className="font-bold mb-2">창시/추종 종교</h4>
        <div className="flex flex-wrap gap-3">
          {mockReligions.map(rel => (
            <div
              key={rel.id}
              className={`p-3 rounded border cursor-pointer w-44 ${selectedReligion?.id === rel.id ? 'border-yellow-400 bg-slate-800' : 'border-slate-600 bg-slate-900'}`}
              onClick={() => setSelectedReligion(rel)}
            >
              <div className="font-bold text-base">{rel.name}</div>
              <div className="text-xs text-gray-400">창시자: {rel.founder}</div>
              <div className="text-xs">도시 수: {rel.cityCount}</div>
            </div>
          ))}
        </div>
      </div>
      {/* 종교 교리, 신앙 구매 등 기능 확장 가능 */}
      <div className="mt-6">
        <h4 className="font-bold mb-2">신앙 행동 (목업)</h4>
        <div className="flex gap-2 flex-wrap">
          <button className="bg-yellow-700 px-3 py-1 rounded text-xs text-white" onClick={() => applyDoctrine("임시교리ID")}>종교 창시</button>
          <button className="bg-blue-700 px-3 py-1 rounded text-xs text-white">선교사 구매</button>
          <button className="bg-green-700 px-3 py-1 rounded text-xs text-white">신앙 건물 구매</button>
        </div>
      </div>
    </div>
  );
}
