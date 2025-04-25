'use client';

import React, { useState } from 'react';
import TechnologyList from '@/components/TechnologyList';

export default function TechViewerPage() {
  const [techData, setTechData] = useState<{
    technologies: any[];
    eras: string[];
  } | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleJsonSubmit = () => {
    try {
      const parsedData = JSON.parse(jsonInput);
      
      // 필요한 데이터 구조 확인
      if (!parsedData.technologies || !Array.isArray(parsedData.technologies) || !parsedData.eras || !Array.isArray(parsedData.eras)) {
        setError('JSON 데이터는 technologies(배열)와 eras(배열)를 포함해야 합니다.');
        return;
      }
      
      setTechData(parsedData);
      setError(null);
    } catch (err) {
      setError('JSON 파싱 오류가 발생했습니다.');
      console.error('JSON 파싱 오류:', err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">기술 연구 데이터 뷰어</h1>
      
      <div className="mb-6 p-4 bg-gray-800 rounded">
        <h2 className="text-lg font-semibold mb-3">JSON 데이터 입력</h2>
        <textarea 
          className="w-full h-40 p-2 bg-gray-700 text-white rounded mb-3"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="기술 연구 JSON 데이터를 여기에 붙여넣기 하세요."
        />
        
        {error && (
          <div className="text-red-500 mb-3">{error}</div>
        )}
        
        <button 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          onClick={handleJsonSubmit}
        >
          데이터 로드
        </button>
      </div>
      
      {techData ? (
        <TechnologyList technologies={techData.technologies} eras={techData.eras} />
      ) : (
        <div className="p-4 bg-gray-800 rounded text-center">
          <p>JSON 데이터를 입력하고 '데이터 로드' 버튼을 클릭하세요.</p>
        </div>
      )}
    </div>
  );
} 