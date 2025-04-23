import React from "react";
import { Unit, UnitType } from "./mockUnitData";
import Tooltip from "../ui/Tooltip";

interface UnitDetailModalProps {
  unit: Unit;
  unitTypes: { [type: string]: UnitType };
  onClose: () => void;
  onCommand: (unitId: string, command: string) => void;
}

function getCommandTooltip(cmd: string, unit: Unit, type: UnitType) {
  // 명령별 설명 및 불가 사유 예시
  if (cmd === "이동" && unit.movement <= 0) return "이동력이 부족합니다.";
  if (cmd === "공격" && unit.status !== "정상") return "현재 상태에서는 공격할 수 없습니다.";
  if (cmd === "요새화") return "이 유닛을 요새화하여 방어력을 올립니다.";
  if (cmd === "대기") return "턴이 끝날 때까지 대기합니다.";
  // ... 기타 명령 설명
  return `${cmd} 명령을 실행합니다.`;
}

export default function UnitDetailModal({ unit, unitTypes, onClose, onCommand }: UnitDetailModalProps) {
  const type = unitTypes[unit.type];
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg p-6 w-[400px] relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={onClose}>X</button>
        <h4 className="font-bold text-xl mb-2">{unit.name}</h4>
        <div className="mb-2 text-sm text-gray-300">{type.name} | {type.description}</div>
        <div className="mb-2 text-xs">HP: {unit.hp} / {type.maxHp} | 이동력: {unit.movement} / {type.movement}</div>
        <div className="mb-2 text-xs">상태: {unit.status}</div>
        <div className="mb-2 text-xs">특수 능력: {type.special.join(", ")}</div>
        <div className="flex flex-wrap gap-2 mt-4">
          {type.commands.map(cmd => (
            <Tooltip key={cmd} content={getCommandTooltip(cmd, unit, type)}>
              <button
                className="px-3 py-1 bg-blue-700 rounded text-xs text-white hover:bg-blue-500"
                onClick={() => onCommand(unit.id, cmd)}
              >{cmd}</button>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}
