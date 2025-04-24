import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import Toast from "../ui/Toast";
import { HexTile, GameMapState } from '@/types/game';
import gameService from '@/services/gameService';

interface HexMapProps {
  gameId: string;
  onTileClick?: (tile: any) => void;
  selectedTile?: any | null;
  onUnitMove?: (unitId: string, to: { q: number, r: number, s: number }) => void;
}

export default function HexMap({ 
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
  
  // 토스트 메시지
  const [toast, setToast] = useState<{
    message: string;
    show: boolean;
    type?: 'info' | 'success' | 'warning' | 'error';
  }>({ message: '', show: false });
  
  // 토스트 메시지 표시 함수
  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({
      message,
      show: true,
      type
    });
    
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
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
          
          // gameService를 사용하여 맵 데이터 로드
          const result = await gameService.getMap();
          
          if (!isMounted) return;
          
          // API 응답 검증
          if (!result || !Array.isArray(result.hexagons)) {
            throw new Error('유효하지 않은 맵 데이터');
          }
          
          setMapData(result.hexagons);
          setIsLoading(false);
          showToast("맵 데이터를 성공적으로 불러왔습니다.", "success");
        } catch (apiError) {
          console.error("API 오류:", apiError);
          
          if (!isMounted) return;
          
          // 간단한 대체 맵 데이터 생성 (폴백)
          const fallbackMapData = Array.from({ length: 36 }, (_, index) => {
            const r = Math.floor(index / 6);
            const q = index % 6;
            const s = -q - r;
            
            // 중심에서의 거리 계산 (내륙 바다 스타일)
            const distance = Math.max(
              Math.abs(q - 2),
              Math.abs(r - 2),
              Math.abs(s - (-2 - 2))
            );
            
            // 중심은 바다, 주변은 육지로 설정
            const terrain = distance <= 1 ? 'ocean' : 'plains';
            
            // 플레이어 시작 위치 설정
            const isPlayerStart = q === 4 && r === 1;
            
            return {
              q, r, s,
              terrain,
              explored: true,
              visible: true,
              resource: Math.random() > 0.8 ? 'wheat' : undefined,
              unit_id: isPlayerStart ? 'player_settler_1' : undefined,
              city_id: undefined,
              occupant: isPlayerStart ? 'Korea' : undefined,
              unit_type: isPlayerStart ? 'settler' : undefined
            };
          });
          
          setError(apiError instanceof Error ? apiError.message : '맵 데이터 로드 실패 - 기본 맵으로 대체합니다');
          setMapData(fallbackMapData);
          setIsLoading(false);
          showToast("오류가 발생했습니다. 기본 맵으로 대체합니다.", "warning");
        }
      } catch (err) {
        if (!isMounted) return;
        
        console.error("치명적 오류:", err);
        setError(err instanceof Error ? err.message : "맵을 로드할 수 없습니다");
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

  const handleRefreshMap = async () => {
    // 맵 새로고침 로직
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await gameService.getMap();
      
      // API 응답 검증
      if (!result || !Array.isArray(result.hexagons)) {
        throw new Error('유효하지 않은 맵 데이터');
      }
      
      setMapData(result.hexagons);
      setIsLoading(false);
      showToast("맵 데이터를 성공적으로 불러왔습니다.", "success");
    } catch (err) {
      console.error("맵 새로고침 오류:", err);
      
      setError(err instanceof Error ? err.message : '맵 데이터 로드 실패');
      setIsLoading(false);
      showToast("맵 데이터 로드에 실패했습니다. 다시 시도해주세요.", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900">
        <div className="text-xl text-blue-300 animate-pulse">맵 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900">
        <div className="text-xl text-red-400 mb-4">{error}</div>
        <button
          onClick={handleRefreshMap}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-slate-900" ref={containerRef}>
      {/* 토스트 메시지 */}
      <Toast 
        message={toast.message} 
        show={toast.show} 
        onClose={() => setToast({ ...toast, show: false })}
      />
      
      <div className="p-4">
        <h1 className="text-2xl text-white">맵 컴포넌트</h1>
        <p className="text-gray-400 mt-2">맵 데이터 타일 개수: {mapData.length}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {mapData.slice(0, 9).map((tile, index) => (
            <div
              key={index}
              className={cn(
                "p-2 rounded cursor-pointer",
                selectedTile && selectedTile.q === tile.q && selectedTile.r === tile.r
                  ? "bg-blue-800" : "bg-slate-800"
              )}
              onClick={() => onTileClick && onTileClick(tile)}
            >
              <p className="text-sm text-white">
                좌표: ({tile.q}, {tile.r})
              </p>
              <p className="text-xs text-gray-400">지형: {tile.terrain}</p>
              {tile.resource && (
                <p className="text-xs text-yellow-300">자원: {tile.resource}</p>
              )}
              {tile.unit_id && (
                <p className="text-xs text-blue-300">유닛: {tile.occupant}</p>
              )}
              {tile.city_id && (
                <p className="text-xs text-green-300">도시</p>
              )}
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