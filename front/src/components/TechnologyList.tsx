import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Technology {
  id: string;
  name: string;
  era: string;
  cost: number;
  description: string;
  prerequisites: string[];
  unlocks: string[];
  is_researched: boolean;
  is_current: boolean | null;
}

interface TechnologyListProps {
  technologies: Technology[];
  eras: string[];
}

export default function TechnologyList({ technologies, eras }: TechnologyListProps) {
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);

  // 시대별로 기술 필터링
  const filterTechsByEra = (era: string) => {
    return technologies.filter(tech => tech.era === era);
  };

  // 기술 상태에 따른 클래스 결정
  const getTechStatusClass = (tech: Technology) => {
    if (tech.is_researched) {
      return "bg-green-800 border-green-500";
    } else if (tech.is_current) {
      return "bg-blue-700 border-blue-400";
    } else {
      // 선행 기술이 모두 연구되었는지 확인
      const available = tech.prerequisites.every(prereq => 
        technologies.find(t => t.id === prereq)?.is_researched || false
      );
      
      return available 
        ? "bg-blue-900 border-blue-400 hover:bg-blue-700 cursor-pointer" 
        : "bg-gray-800 border-gray-600 opacity-60 cursor-not-allowed";
    }
  };

  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-xl font-bold mb-4">연구 기술</h3>
      
      {/* 시대별 탭 */}
      <Tabs defaultValue={eras[0]} className="mt-4">
        <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${eras.length}, 1fr)` }}>
          {eras.map(era => (
            <TabsTrigger key={era} value={era}>{era}</TabsTrigger>
          ))}
        </TabsList>
        
        {eras.map(era => (
          <TabsContent key={era} value={era}>
            <div className="flex flex-wrap gap-4 mt-4">
              {filterTechsByEra(era).map(tech => (
                <div
                  key={tech.id}
                  className={`p-3 rounded border-2 w-48 h-40 relative ${getTechStatusClass(tech)}`}
                  onClick={() => setSelectedTech(tech)}
                >
                  <div className="font-bold text-base mb-1">{tech.name}</div>
                  <div className="text-xs mb-1">연구비용: {tech.cost}</div>
                  <div className="text-xs mb-2">{tech.description}</div>
                  
                  <div className="flex flex-wrap gap-1 text-xs">
                    {tech.unlocks.map((unlock, index) => (
                      <span key={index} className="bg-gray-700 rounded px-1">{unlock}</span>
                    ))}
                  </div>
                  
                  {/* 연구 상태 표시 */}
                  {tech.is_researched && <span className="absolute top-1 right-2 text-green-300 font-bold text-xs">완료</span>}
                  {tech.is_current && <span className="absolute bottom-1 right-2 text-blue-300 font-bold text-xs">진행 중</span>}
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      
      {/* 기술 상세 모달 */}
      {selectedTech && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-lg w-full">
            <h4 className="text-xl font-bold mb-2">{selectedTech.name}</h4>
            <p className="text-sm text-gray-300 mb-1">시대: {selectedTech.era}</p>
            <p className="text-sm text-gray-300 mb-3">연구비용: {selectedTech.cost}</p>
            
            <p className="mb-4">{selectedTech.description}</p>
            
            {selectedTech.prerequisites.length > 0 && (
              <div className="mb-3">
                <p className="font-semibold mb-1">선행 기술</p>
                <div className="flex flex-wrap gap-1">
                  {selectedTech.prerequisites.map((prereq, index) => (
                    <span key={index} className="bg-gray-700 rounded px-1 text-sm">
                      {technologies.find(t => t.id === prereq)?.name || prereq}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <p className="font-semibold mb-1">해금 항목</p>
              <div className="flex flex-wrap gap-1">
                {selectedTech.unlocks.map((unlock, index) => (
                  <span key={index} className="bg-gray-700 rounded px-1 text-sm">{unlock}</span>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                onClick={() => setSelectedTech(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 