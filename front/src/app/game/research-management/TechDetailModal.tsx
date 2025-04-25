import React from "react";
import { Tech, UnlockItem } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { X } from "@/components/ui/icons";

interface TechDetailModalProps {
  tech: Tech;
  researched: boolean;
  isCurrentResearch: boolean;
  onClose: () => void;
  onStartResearch: (tech: Tech) => void;
  onChangeResearch: (tech: Tech) => void;
}

// 기술 상세 정보 모달
export default function TechDetailModal({ 
  tech, 
  researched, 
  isCurrentResearch,
  onClose, 
  onStartResearch,
  onChangeResearch 
}: TechDetailModalProps) {
  // 선행 기술 배열이나 문자열을 반환
  const renderPrerequisites = () => {
    if (tech.prerequisites.length === 0) {
      return <span className="text-gray-400">없음</span>;
    }
    return tech.prerequisites.map(prereq => (
      <span key={prereq} className="inline-block px-2 py-1 m-1 bg-blue-900 rounded text-xs">
        {prereq}
      </span>
    ));
  };

  // 해금 항목 배열이나 문자열을 반환
  const renderUnlocks = () => {
    if (!tech.unlocks || tech.unlocks.length === 0) {
      return <span className="text-gray-400">없음</span>;
    }
    
    return tech.unlocks.map((unlock, index) => {
      // 해금 항목이 문자열인 경우
      if (typeof unlock === 'string') {
        return (
          <span key={index} className="inline-block px-2 py-1 m-1 bg-green-900 rounded text-xs">
            {unlock}
          </span>
        );
      }
      
      // 해금 항목이 객체인 경우
      const unlockItem = unlock as UnlockItem;
      return (
        <div key={unlockItem.id} className="p-2 my-1 bg-green-900/30 rounded">
          <div className="font-bold">{unlockItem.name}</div>
          <div className="text-xs text-gray-300">유형: {unlockItem.type}</div>
          {unlockItem.description && <div className="text-xs mt-1">{unlockItem.description}</div>}
        </div>
      );
    });
  };

  // 연구 버튼 렌더링
  const renderActionButton = () => {
    if (researched) {
      return <Button disabled>연구 완료</Button>;
    }
    
    if (isCurrentResearch) {
      return <Button disabled>연구 중</Button>;
    }
    
    // 현재 다른 연구 중인 경우 변경 버튼 표시
    if (tech.status === 'available') {
      return (
        <>
          <Button onClick={() => onStartResearch(tech)} className="mr-2">연구 시작</Button>
          <Button variant="outline" onClick={() => onChangeResearch(tech)}>연구 변경</Button>
        </>
      );
    }
    
    return <Button disabled>선행 기술 필요</Button>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full bg-slate-900 border-slate-700">
        <CardHeader className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2" 
            onClick={onClose}
          >
            <X size={18} />
          </Button>
          <CardTitle className="text-xl">{tech.name}</CardTitle>
          <div className="flex justify-between items-center">
            <CardDescription className="text-slate-400">
              {tech.era} 시대 - 연구 비용: {tech.cost}
            </CardDescription>
            {tech.quote && (
              <span className="text-xs italic text-slate-400">"{tech.quote}"</span>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-1">설명</h4>
            <p className="text-sm text-slate-300">{tech.description || "설명 없음"}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-1">선행 기술</h4>
            <div className="flex flex-wrap">{renderPrerequisites()}</div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-1">해금 항목</h4>
            <div className="space-y-1">{renderUnlocks()}</div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>닫기</Button>
          {renderActionButton()}
        </CardFooter>
      </Card>
    </div>
  );
}
