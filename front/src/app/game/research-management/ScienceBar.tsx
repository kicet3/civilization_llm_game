import React from "react";
import { Tech } from "./mockTechData";

interface ScienceBarProps {
  science: number;
  progress: number;
  currentTech: Tech | null;
}

export default function ScienceBar({ science, progress, currentTech }: ScienceBarProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="font-bold">과학력: {science}/턴</span>
        {currentTech && <span>진행 중: {currentTech.name} ({progress}/{currentTech.cost})</span>}
      </div>
      <div className="w-full bg-gray-700 rounded h-4 overflow-hidden">
        <div
          className="bg-blue-500 h-4 rounded"
          style={{ width: currentTech ? `${Math.min(100, (progress / currentTech.cost) * 100)}%` : '0%' }}
        />
      </div>
    </div>
  );
}
