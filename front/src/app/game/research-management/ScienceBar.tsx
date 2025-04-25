import React from "react";
import { Tech } from "@/types/game";
import { Progress } from "@/components/ui/progress";

interface ScienceBarProps {
  science: number;
  progress: number;
  currentTech: Tech | null;
}

// 과학 진행 상태 표시 바
export default function ScienceBar({ science, progress, currentTech }: ScienceBarProps) {
  // 현재 연구 중인 기술이 없는 경우
  if (!currentTech) {
    return (
      <div className="mb-6 p-3 bg-blue-900/30 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">과학: {science} / 턴</span>
          <span>연구 중인 기술이 없습니다</span>
        </div>
      </div>
    );
  }

  // 현재 연구 진행률 계산 (%)
  const progressPercent = Math.min(100, Math.round((progress / currentTech.cost) * 100));
  
  // 남은 턴 계산
  const turnsLeft = Math.max(1, Math.ceil((currentTech.cost - progress) / science));

  return (
    <div className="mb-6 p-3 bg-blue-900/30 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">과학: {science} / 턴</span>
        <span>현재 연구: {currentTech.name} ({progressPercent}%)</span>
      </div>
      <Progress value={progressPercent} max={100} className="h-2 mb-1" />
      <div className="flex justify-between text-xs text-gray-300">
        <span>{progress} / {currentTech.cost}</span>
        <span>완료까지 {turnsLeft}턴 남음</span>
      </div>
    </div>
  );
}
