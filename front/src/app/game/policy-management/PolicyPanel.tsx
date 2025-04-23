import React, { useState } from "react";
import { useGameState } from "../globalGameState";
import { mockPolicies, mockPolicyState, PolicyTree, PolicyState } from "./mockPolicyData";

export default function PolicyPanel() {
  const [policyState, setPolicyState] = useState<PolicyState>(mockPolicyState);
  const applyPolicy = useGameState(state => state.applyPolicy);

  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-xl font-bold mb-4">사회 정책</h3>
      <div className="mb-4">
        <span className="font-bold">문화 포인트:</span> {policyState.culture} / 턴
      </div>
      <div className="mb-6">
        <h4 className="font-bold mb-2">정책 트리</h4>
        <div className="flex flex-wrap gap-4">
          {mockPolicies.map(tree => (
            <div key={tree.id} className="bg-gray-800 rounded p-4 w-56">
              <div className="font-bold text-base mb-2">{tree.name}</div>
              <div className="text-xs text-gray-400 mb-2">{tree.description}</div>
              <div className="flex flex-wrap gap-1 text-xs">
                {tree.policies.map(pol => (
                  <span
                    key={pol.id}
                    className={`rounded px-2 py-1 ${policyState.adopted.includes(pol.id) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    {pol.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* 정책 채택, 이념 선택 등 기능 확장 가능 */}
      <div className="mt-6">
        <h4 className="font-bold mb-2">정책 행동 (목업)</h4>
        <div className="flex gap-2 flex-wrap">
          <button className="bg-blue-700 px-3 py-1 rounded text-xs text-white" onClick={() => applyPolicy("임시정책ID")}>정책 채택</button>
          <button className="bg-green-700 px-3 py-1 rounded text-xs text-white">이념 선택</button>
        </div>
      </div>
    </div>
  );
}
