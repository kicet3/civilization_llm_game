import React from "react";
import { Unit } from "./mockUnitData";

interface UnitListProps {
  units: Unit[];
  onSelectUnit: (unit: Unit) => void;
}

export default function UnitList({ units, onSelectUnit }: UnitListProps) {
  return (
    <div className="space-y-2">
      {units.map(unit => (
        <div
          key={unit.id}
          className="bg-gray-800 rounded p-3 flex justify-between items-center cursor-pointer hover:bg-gray-700"
          onClick={() => onSelectUnit(unit)}
        >
          <div>
            <div className="font-bold text-base">{unit.name}</div>
            <div className="text-xs text-gray-400">{unit.typeName} | HP: {unit.hp} | 이동력: {unit.movement}/{unit.maxMovement}</div>
          </div>
          <div className="text-sm text-blue-300">{unit.status}</div>
        </div>
      ))}
    </div>
  );
}
