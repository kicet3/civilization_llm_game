import React, { useState, useEffect, useRef } from "react";
import gameService from "@/services/gameService";
import { HexTile } from "@/types/game";

interface HexMapProps {
  gameId: string;
  onTileClick?: (tile: any) => void;
  selectedTile?: any | null;
  onUnitMove?: (unitId: string, to: { q: number, r: number, s: number }) => void;
}

export default function HexMapTemp({ 
  gameId, 
  onTileClick, 
  selectedTile,
  onUnitMove
}: HexMapProps) {
  // 상태 관리
  const [mapData, setMapData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 참조
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 토스트 메시지 표시 함수
  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    console.log(`Toast: ${message} (${type})`);
    // 실제 구현은 생략
  };

  // 맵 데이터 로드 - 페이지 렌더링 후 로드
  useEffect(() => {
    let isMounted = true;

    const loadMapData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        try {
          console.log("맵 데이터 로드 시도...");
          const response = await fetch("/api/map", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (!isMounted) return;
          
          // 만약 응답이 배열 형태라면
          if (Array.isArray(data)) {
            setMapData(data);
            setIsLoading(false);
            showToast("맵 데이터를 성공적으로 불러왔습니다.", "success");
          } 
          // 만약 응답이 {hexagons: []} 형태라면
          else if (data && Array.isArray(data.hexagons)) {
            setMapData(data.hexagons);
            setIsLoading(false);
            showToast("맵 데이터를 성공적으로 불러왔습니다.", "success");
          } 
          // 기타 형태의 응답은 오류로 처리
          else {
            throw new Error("유효하지 않은 맵 데이터");
          }
        } catch (apiError) {
          console.error("API 오류:", apiError);
          
          // 폴백 맵 데이터 생성
          const fallbackMapData = Array.from({ length: 25 }, (_, index) => {
            const row = Math.floor(index / 5);
            const col = index % 5;
            return {
              q: col,
              r: row,
              s: -(col + row),
              terrain: 'plains',
              explored: true,
              visible: true
            };
          });
          
          if (!isMounted) return;
          
          setMapData(fallbackMapData);
          setIsLoading(false);
          setError("맵 데이터를 가져올 수 없어 기본 맵을 사용합니다");
          showToast("기본 맵 데이터를 사용합니다.", "warning");
        }
      } catch (err) {
        if (!isMounted) return;
        
        console.error("치명적 오류:", err);
        setError("맵을 로드할 수 없습니다");
        setIsLoading(false);
        showToast("맵을 로드할 수 없습니다.", "error");
      }
    };

    // 약간의 지연 후 맵 데이터 로드
    setTimeout(() => {
      if (isMounted) {
        loadMapData();
      }
    }, 300);

    return () => {
      isMounted = false;
    };
  }, [gameId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900">
        <div className="text-xl text-blue-300">맵 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900">
        <div className="text-xl text-red-400 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-slate-900" ref={containerRef}>
      <div className="p-4">
        <h1 className="text-2xl text-white">맵 컴포넌트</h1>
        <p className="text-gray-400 mt-2">맵 데이터 타일 개수: {mapData.length}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {mapData.slice(0, 9).map((tile, index) => (
            <div
              key={index}
              className="p-2 bg-slate-800 rounded"
              onClick={() => onTileClick && onTileClick(tile)}
            >
              <p className="text-sm text-white">
                좌표: ({tile.q}, {tile.r}, {tile.s})
              </p>
              <p className="text-xs text-gray-400">지형: {tile.terrain}</p>
            </div>
          ))}
        </div>
        {mapData.length > 9 && (
          <p className="text-gray-400 mt-2">... 그 외 {mapData.length - 9}개 타일</p>
        )}
      </div>
    </div>
  );
} 