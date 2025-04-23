import React, { useState } from "react";
import UnitList from "./UnitList";
import UnitDetailModal from "./UnitDetailModal";
import { mockUnits, Unit, mockUnitTypes } from "./mockUnitData";

export default function UnitPanel() {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [units, setUnits] = useState<Unit[]>(mockUnits);

  // 유닛 명령 예시 (실제 게임에서는 게임 상태와 연동 필요)
  const handleCommand = (unitId: string, command: string) => {
    // TODO: 이동/공격/요새화/대기 등 명령 처리
    alert(`유닛 ${unitId}에 명령: ${command}`);
  };

  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-xl font-bold mb-4">유닛 관리</h3>
      <UnitList units={units} onSelectUnit={setSelectedUnit} />
      {selectedUnit && (
        <UnitDetailModal
          unit={selectedUnit}
          unitTypes={mockUnitTypes}
          onClose={() => setSelectedUnit(null)}
          onCommand={handleCommand}
        />
      )}
    </div>
  );
}
