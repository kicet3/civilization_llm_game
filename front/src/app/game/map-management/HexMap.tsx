"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { HexTile, GameMapState } from "@/types/game";
import { 
  ZoomIn, ZoomOut, RefreshCw, Home, Eye, Mountain, 
  Waves, Droplet, Wand, Wheat, Gem
} from "lucide-react";
import Toast from "../ui/Toast";

interface HexMapProps {
  gameId: string;
  onTileClick?: (tile: HexTile) => void;
  selectedTile?: HexTile | null;
  onUnitMove?: (unitId: string, to: { q: number, r: number, s: number }) => void;
}

const HexMap: React.FC<HexMapProps> = ({ 
  gameId, 
  onTileClick, 
  selectedTile,
  onUnitMove
}) => {
  // 상태 관리
  const [mapState, setMapState] = useState<GameMapState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredTile, setHoveredTile] = useState<HexTile | null>(null);
  
  // 토스트 메시지
  const [toast, setToast] = useState<{
    message: string;
    show: boolean;
    type?: 'info' | 'success' | 'warning' | 'error';
  }>({ message: '', show: false });
  
  // 참조
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 헥스 그리드 상수
  const HEX_SIZE = 40; // 육각형 크기
  const HEX_HEIGHT = HEX_SIZE * 2;
  const HEX_WIDTH = Math.sqrt(3) / 2 * HEX_HEIGHT;
  const HEX_VERT = HEX_HEIGHT * 0.75;

  // 맵 초기화 함수
  const initializeMap = async () => {
    try {
      setIsLoading(true);
      
      // /api/map/init/{game_id} 경로 직접 호출
      const response = await fetch(`/api/map/init/${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          width: 11,
          height: 9,
          ai_civs: ["Japan", "China", "Mongolia", "Russia", "Rome"],
          player_civ: "Korea",
          map_type: "continental"
        }),
      });
      
      if (!response.ok) {
        throw new Error('맵 초기화 실패');
      }
      
      const data = await response.json();
      setMapState(data);
      showToast('맵이 생성되었습니다', 'success');
      setIsLoading(false);
    } catch (error) {
      console.error('맵 초기화 중 오류:', error);
      setError(error instanceof Error ? error.message : '맵 초기화 중 오류 발생');
      showToast('맵 생성 실패', 'error');
      setIsLoading(false);
    }
  };

  // 맵 로드 함수
  const loadMap = async () => {
    try {
      setIsLoading(true);
      
      // 실제 API 호출
      const response = await fetch(`/api/map/${gameId}`);
      
      if (!response.ok) {
        throw new Error('맵 로드 실패');
      }
      
      const data = await response.json();
      setMapState(data);
      setIsLoading(false);
    } catch (error) {
      console.error('맵 로드 중 오류:', error);
      setError(error instanceof Error ? error.message : '맵 로드 중 오류 발생');
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 맵 로드
  useEffect(() => {
    // 게임 ID가 새로 생성된 것이면 초기화, 아니면 로드
    if (gameId.startsWith('new_')) {
      initializeMap();
    } else {
      loadMap();
    }
    
    // 캔버스 크기 설정
    if (containerRef.current && canvasRef.current) {
      const resizeCanvas = () => {
        if (!canvasRef.current || !containerRef.current) return;
        
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        
        // 맵 중앙 정렬
        setOffset({
          x: containerRef.current.clientWidth / 2,
          y: containerRef.current.clientHeight / 2
        });
      };
      
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  }, [gameId]);

  // 맵 렌더링 함수
  useEffect(() => {
    if (!canvasRef.current || !mapState) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 모든 타일 그리기
    mapState.tiles.forEach(tile => {
      // 좌표 변환
      const { x, y } = hexToPixel(tile.q, tile.r);
      
      // 시야 범위 고려
      if (!tile.explored) {
        // 미탐험 지역
        drawHexagon(ctx, x, y, '#222', 'rgba(0, 0, 0, 0.8)');
      } else if (!tile.visible) {
        // 탐험했지만 현재 시야 범위 밖
        drawHexagon(ctx, x, y, getTerrainColor(tile.terrain), 'rgba(0, 0, 0, 0.5)');
      } else {
        // 현재 시야 내
        drawHexagon(ctx, x, y, getTerrainColor(tile.terrain));
        
        // 자원 그리기
        if (tile.resource) {
          drawResource(ctx, x, y, tile.resource);
        }
        
        // 도시 그리기
        if (tile.city_id) {
          drawCity(ctx, x, y, tile.occupant || '');
        }
        
        // 유닛 그리기
        if (tile.unit_id) {
          drawUnit(ctx, x, y, tile.occupant || '');
        }
      }
      
      // 타일 경계선
      ctx.strokeStyle = 'rgba(80,80,80,0.35)';
      ctx.lineWidth = 0.7;
      drawHexagonOutline(ctx, x, y);
    });
    
    // 선택된 타일 하이라이트
    if (selectedTile) {
      const { x, y } = hexToPixel(selectedTile.q, selectedTile.r);
      highlightTile(ctx, x, y, '#fff', 3);
    }
    
    // 호버된 타일 하이라이트
    if (hoveredTile) {
      const { x, y } = hexToPixel(hoveredTile.q, hoveredTile.r);
      highlightTile(ctx, x, y, 'rgba(255, 255, 255, 0.5)', 2);
    }
  }, [mapState, selectedTile, hoveredTile, offset, scale]);

  // 헥스 좌표를 픽셀 좌표로 변환
  const hexToPixel = (q: number, r: number) => {
    const x = q * HEX_WIDTH * scale + ((r % 2) * HEX_WIDTH * scale) / 2 + offset.x;
    const y = r * HEX_VERT * scale + offset.y;
    return { x, y };
  };
  
  // 픽셀 좌표를 헥스 좌표로 변환
  const pixelToHex = (x: number, y: number) => {
    // 오프셋 및 스케일 적용하여 역변환
    const adjustedX = (x - offset.x) / scale;
    const adjustedY = (y - offset.y) / scale;
    
    // 열 (column) 계산
    const q = Math.round(adjustedX / HEX_WIDTH - (Math.round(adjustedY / HEX_VERT) % 2) / 2);
    
    // 행 (row) 계산
    const r = Math.round(adjustedY / HEX_VERT);
    
    // s 좌표 (q + r + s = 0)
    const s = -q - r;
    
    return { q, r, s };
  };
  
  // 지형별 색상
  const getTerrainColor = (terrain: string): string => {
    switch (terrain) {
      case 'plains': return '#dda15e';
      case 'grassland': return '#606c38';
      case 'forest': return '#283618';
      case 'hills': return '#bc6c25';
      case 'mountain': return '#6c757d';
      case 'desert': return '#e9c46a';
      case 'tundra': return '#e5e5e5';
      case 'snow': return '#ffffff';
      case 'ocean': return '#219ebc';
      case 'coast': return '#8ecae6';
      default: return '#34495e';
    }
  };
  
  // 육각형 그리기
  const drawHexagon = (
    ctx: CanvasRenderingContext2D, 
    cx: number, 
    cy: number, 
    fillColor: string, 
    overlay?: string
  ) => {
    const radius = HEX_WIDTH * scale / 2;
    
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    if (overlay) {
      ctx.fillStyle = overlay;
      ctx.fill();
    }
  };
  
  // 육각형 외곽선 그리기
  const drawHexagonOutline = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    const radius = HEX_WIDTH * scale / 2;
    
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  };
  
  // 타일 하이라이트
  const highlightTile = (
    ctx: CanvasRenderingContext2D, 
    cx: number, 
    cy: number, 
    color: string, 
    lineWidth: number
  ) => {
    const radius = HEX_WIDTH * scale / 2;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    drawHexagonOutline(ctx, cx, cy);
  };
  
  // 자원 그리기
  const drawResource = (ctx: CanvasRenderingContext2D, cx: number, cy: number, resource: string) => {
    const radius = HEX_WIDTH * scale / 6;
    
    let color = '#fff';
    switch (resource) {
      case 'iron': color = '#7f8c8d'; break;
      case 'horses': color = '#e67e22'; break;
      case 'wheat': color = '#f1c40f'; break;
      case 'gold': color = '#f39c12'; break;
      case 'silver': color = '#bdc3c7'; break;
      case 'gems': color = '#9b59b6'; break;
      case 'marble': color = '#ecf0f1'; break;
      case 'oil': color = '#2c3e50'; break;
    }
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy - radius, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  
  // 도시 그리기
  const drawCity = (ctx: CanvasRenderingContext2D, cx: number, cy: number, owner: string) => {
    const radius = HEX_WIDTH * scale / 3;
    
    // 소유자에 따른 색상
    const color = owner === 'Korea' ? '#3498db' : '#e74c3c';
    
    // 도시는 원으로 표현
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 도시 표시 (중심에 별 모양)
    ctx.fillStyle = '#fff';
    const starSize = radius * 0.5;
    
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI / 2.5) * i - Math.PI / 2;
      const x = cx + Math.cos(angle) * starSize;
      const y = cy + Math.sin(angle) * starSize;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };
  
  // 유닛 그리기
  const drawUnit = (ctx: CanvasRenderingContext2D, cx: number, cy: number, owner: string) => {
    const size = HEX_WIDTH * scale / 4;
    
    // 소유자에 따른 색상
    const color = owner === 'Korea' ? '#3498db' : '#e74c3c';
    
    // 삼각형 모양 (유닛)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx - size, cy + size);
    ctx.lineTo(cx + size, cy + size);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  
  // 마우스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) { // 좌클릭
      setIsDragging(true);
      setDragStart({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y
      });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (mapState) {
      // 마우스 호버링시 타일 정보
      const { q, r, s } = pixelToHex(mouseX, mouseY);
      const hoveredHex = mapState.tiles.find(tile => 
        tile.q === q && tile.r === r && tile.s === s
      );
      
      setHoveredTile(hoveredHex || null);
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
    } else if (mapState) {
      // 타일 선택
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const { q, r, s } = pixelToHex(mouseX, mouseY);
      const clickedTile = mapState.tiles.find(tile => 
        tile.q === q && tile.r === r && tile.s === s
      );
      
      if (clickedTile && onTileClick) {
        onTileClick(clickedTile);
      }
    }
  };
  
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    const newScale = Math.max(0.5, Math.min(2, scale + delta));
    setScale(newScale);
  };
  
  // 맵 확대/축소
  const handleZoomIn = () => {
    setScale(Math.min(2, scale + 0.1));
  };
  
  const handleZoomOut = () => {
    setScale(Math.max(0.5, scale - 0.1));
  };
  
  // 맵 중앙으로 이동
  const handleCenterMap = () => {
    if (!containerRef.current) return;
    setOffset({
      x: containerRef.current.clientWidth / 2,
      y: containerRef.current.clientHeight / 2
    });
  };
  
  // 맵 새로고침
  const handleRefreshMap = () => {
    if (gameId.startsWith('new_')) {
      initializeMap();
    } else {
      loadMap();
    }
  };
  
  // 토스트 메시지 표시
  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, show: true, type });
    setTimeout(() => {
      setToast({ message: '', show: false });
    }, 3000);
  };
  
  // 로딩 화면
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900">
        <div className="text-xl text-blue-300 animate-pulse">맵 로딩 중...</div>
      </div>
    );
  }
  
  // 에러 화면
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
      
      {/* 맵 컨트롤 */}
      <div className="absolute top-4 right-4 flex flex-col bg-slate-800 bg-opacity-80 rounded-lg p-2 z-10 space-y-2">
        <button 
          onClick={handleZoomIn}
          className="p-2 bg-slate-700 rounded hover:bg-slate-600"
          title="확대"
        >
          <ZoomIn size={20} />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 bg-slate-700 rounded hover:bg-slate-600"
          title="축소"
        >
          <ZoomOut size={20} />
        </button>
        <button 
          onClick={handleCenterMap}
          className="p-2 bg-slate-700 rounded hover:bg-slate-600"
          title="중앙으로"
        >
          <Home size={20} />
        </button>
        <button 
          onClick={handleRefreshMap}
          className="p-2 bg-slate-700 rounded hover:bg-slate-600"
          title="맵 새로고침"
        >
          <Refresh size={20} />
        </button>
      </div>
      
      {/* 타일 정보 패널 */}
      {hoveredTile && hoveredTile.explored && (
        <div className="absolute bottom-4 left-4 bg-slate-800 bg-opacity-80 rounded-lg p-2 z-10 max-w-xs">
          <div className="flex items-center text-sm font-bold mb-1">
            {hoveredTile.terrain === 'mountain' && <Mountain size={16} className="mr-1" />}
            {hoveredTile.terrain === 'forest' && <Forest size={16} className="mr-1" />}
            {hoveredTile.terrain === 'ocean' && <Waves size={16} className="mr-1" />}
            {hoveredTile.terrain === 'desert' && <Sand size={16} className="mr-1" />}
            <span className="capitalize">
              {hoveredTile.terrain} ({hoveredTile.q}, {hoveredTile.r})
            </span>
          </div>
          {hoveredTile.visible && (
            <>
              {hoveredTile.resource && (
                <div className="text-xs mb-1 flex items-center">
                  {hoveredTile.resource === 'wheat' && <Wheat size={12} className="mr-1" />}
                  {hoveredTile.resource === 'horses' && <Horse size={12} className="mr-1" />}
                  {hoveredTile.resource === 'gems' && <Gem size={12} className="mr-1" />}
                  자원: {hoveredTile.resource}
                </div>
              )}
              {hoveredTile.city_id && (
                <div className="text-xs mb-1">
                  도시: {hoveredTile.city_id.split('_')[0]} 수도
                </div>
              )}
              {hoveredTile.unit_id && (
                <div className="text-xs mb-1">
                  유닛: {hoveredTile.occupant} 유닛
                </div>
              )}
            </>
          )}
          {!hoveredTile.visible && hoveredTile.explored && (
            <div className="text-xs italic">안개 속 지형 (마지막 본 상태)</div>
          )}
        </div>
      )}
      
      {/* 캔버스 */}
      <canvas
        ref={canvasRef}
        className={cn(
          "h-full w-full cursor-grab outline-none", 
          isDragging && "cursor-grabbing"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDragging(false)}
        onWheel={handleWheel}
      />
    </div>
  );
};

export default HexMap;