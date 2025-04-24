import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { 
  ZoomIn, ZoomOut, RefreshCw, Home, Eye, Mountain, 
  Waves, Droplet, Wand, Wheat, Gem
} from "lucide-react";
import Toast from "../ui/Toast";
import gameService from "@/services/gameService";
import { HexTile } from "@/types/game";
interface HexMapProps {
  gameId: string;
  onTileClick?: (tile: any) => void;
  selectedTile?: any | null;
  onUnitMove?: (unitId: string, to: { q: number, r: number, s: number }) => void;
}

const getTerrainColor = (terrain: string): string => {
  switch (terrain) {
    case 'plains': return '#dda15e';
    case 'grassland': return '#606c38';
    case 'desert': return '#e9c46a';
    case 'mountain': return '#6c757d';
    case 'hills': return '#bc6c25';
    case 'forest': return '#283618';
    case 'ocean': return '#219ebc';
    case 'coast': return '#8ecae6';
    case 'tundra': return '#e5e5e5';
    default: return '#34495e';
  }
};
interface MiniMapProps {
  mapData: HexTile[];
  mapOffset: { x: number; y: number };
  mapScale: number;
  onMiniMapClick: (q: number, r: number) => void; // 추가된 부분
}

const calculateMapBounds = (mapData: HexTile[]) => {
  const qCoords = mapData.map(hex => hex.q);
  const rCoords = mapData.map(hex => hex.r);

  return {
    minQ: Math.min(...qCoords),
    maxQ: Math.max(...qCoords),
    minR: Math.min(...rCoords),
    maxR: Math.max(...rCoords)
  };
};



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
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isMiniMapExpanded, setIsMiniMapExpanded] = useState(true);
  const [scale, setScale] = useState(0.2); // 기본값을 0.7로 조정
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredTile, setHoveredTile] = useState<any | null>(null);
  const [mapBounds, setMapBounds] = useState<{
    minQ: number;
    maxQ: number;
    minR: number;
    maxR: number;
  }>({ minQ: 0, maxQ: 0, minR: 0, maxR: 0 });
  // 토스트 메시지
  const [toast, setToast] = useState<{
    message: string;
    show: boolean;
    type?: 'info' | 'success' | 'warning' | 'error';
  }>({ message: '', show: false });
  
  // 참조
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleMiniMapClick = (q: number, r: number) => {
    // 미니맵에서 클릭한 위치로 맵 중앙 이동 로직
    const container = containerRef.current;
    if (container) {
      const centerX = container.clientWidth / 2;
      const centerY = container.clientHeight / 2;
      
      setOffset({
        x: centerX - (q * HEX_WIDTH * scale),
        y: centerY - (r * HEX_VERT * scale)
      });
    }
  };
  const MiniMap: React.FC<MiniMapProps> = ({ 
    mapData, 
    mapOffset, 
    mapScale, 
    onMiniMapClick
  }) => {
    const miniMapRef = useRef<HTMLCanvasElement>(null);
    const miniMapSize = 250; // 미니맵 크기
    const miniMapScale = 0.1; // 미니맵 스케일
  
    useEffect(() => {
      const canvas = miniMapRef.current;
      if (!canvas || mapData.length === 0) return;
  
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
  
      // 캔버스 초기화
      ctx.clearRect(0, 0, miniMapSize, miniMapSize);
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, miniMapSize, miniMapSize);
  
      // 미니맵에 타일 그리기
      mapData.forEach(hex => {
        const x = hex.q * miniMapScale + miniMapSize / 2;
        const y = hex.r * miniMapScale + miniMapSize / 2;
  
        // 지형에 따른 색상
        ctx.fillStyle = getTerrainColor(hex.terrain);
        ctx.fillRect(x, y, 3, 3);
      });
  
      // 현재 보고 있는 영역 표시
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.strokeRect(
        mapOffset.x * miniMapScale, 
        mapOffset.y * miniMapScale, 
        miniMapSize * mapScale, 
        miniMapSize * mapScale
      );
    }, [mapData, mapOffset, mapScale]);
  
    
  
    return (
      <div className="absolute bottom-4 right-4">
        <button 
          onClick={() => setIsMiniMapExpanded(!isMiniMapExpanded)}
          className="absolute top-0 right-0 z-10 bg-slate-700 p-1 rounded"
        >
          {isMiniMapExpanded ? '▼' : '▲'}
        </button>
        {isMiniMapExpanded && (
          <canvas
            ref={miniMapRef}
            width={miniMapSize}
            height={miniMapSize}
            onClick={handleMiniMapClick}
            className="bg-slate-800 bg-opacity-70 rounded-lg cursor-pointer"
          />
        )}
      </div>
    );
  };
  // 헥스 그리드 상수
  const HEX_SIZE = 40; // 육각형 크기
  const HEX_HEIGHT = HEX_SIZE * 2;
  const HEX_WIDTH = Math.sqrt(3) / 2 * HEX_HEIGHT;
  const HEX_VERT = HEX_HEIGHT * 0.75;
  useEffect(() => {
    if (mapData.length > 0) {
      const bounds = calculateMapBounds(mapData);
      setMapBounds(bounds);
    }
  }, [mapData]);
  
  // 키보드 이벤트 핸들러 추가
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const moveStep = 50; // 이동 거리
    const scaleStep = 0.1; // 확대/축소 단계

    // 헥스 크기와 현재 스케일을 고려한 픽셀 단위 계산
    const hexPixelWidth = HEX_WIDTH * scale;
    const hexPixelHeight = HEX_VERT * scale;

    const containerWidth = containerRef.current?.clientWidth || 0;
    const containerHeight = containerRef.current?.clientHeight || 0;

    switch (e.key) {
      case 'ArrowUp': {
        const maxUpMovement = (mapBounds.minR * hexPixelHeight);
        setOffset(prev => ({
          x: prev.x, 
          y: Math.min(prev.y + moveStep, containerHeight / 2 + Math.abs(maxUpMovement))
        })); 
        break;
      }
      case 'ArrowDown': {
        const maxDownMovement = (mapBounds.maxR * hexPixelHeight);
        setOffset(prev => ({
          x: prev.x, 
          y: Math.max(prev.y - moveStep, -(maxDownMovement - containerHeight / 2))
        })); 
        break;
      }
      case 'ArrowLeft': {
        const maxLeftMovement = (mapBounds.minQ * hexPixelWidth);
        setOffset(prev => ({
          x: Math.min(prev.x + moveStep, containerWidth / 2 + Math.abs(maxLeftMovement)), 
          y: prev.y
        })); 
        break;
      }
      case 'ArrowRight': {
        const maxRightMovement = (mapBounds.maxQ * hexPixelWidth);
        setOffset(prev => ({
          x: Math.max(prev.x - moveStep, (maxRightMovement - containerWidth / 2)), 
          y: prev.y
        })); 
        break;
      }
      
      // 확대/축소는 기존과 동일
      case '+': 
      case '=': 
        setScale(prev => Math.min(2, prev + scaleStep)); 
        break;
      case '-': 
      case '_': 
        setScale(prev => Math.max(0.5, prev - scaleStep)); 
        break;
    }
  }, [mapBounds, scale, containerRef]);


// useEffect로 이벤트 리스너 추가
useEffect(() => {
  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [handleKeyDown]);
  // 자원별 색상 함수
  const getResourceColor = (resource: string): string => {
    switch (resource) {
      case 'iron': return '#7f8c8d';       // 철
      case 'horses': return '#d35400';     // 말
      case 'wheat': return '#f1c40f';      // 밀
      case 'cattle': return '#e67e22';     // 소
      case 'gold': return '#f39c12';       // 금
      case 'gems': return '#9b59b6';       // 보석
      default: return '#3498db';           // 기본
    }
  };

  // 맵 데이터 로드
  useEffect(() => {
    const loadMapData = async () => {
      try {
        setIsLoading(true);
        
        // gameService를 통해 맵 데이터 로드
        const { hexagons } = await gameService.getMap();
        setMapData(hexagons);
        
        setIsLoading(false);
        showToast("맵 데이터를 성공적으로 불러왔습니다.", "success");
      } catch (err) {
        setError(err instanceof Error ? err.message : '맵 데이터 로드 실패');
        setIsLoading(false);
        showToast("맵 데이터 로드에 실패했습니다.", "error");
      }
    };
  
    loadMapData();
  }, []);

  // 캔버스 크기 설정
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // 맵 중앙 정렬
      setOffset({
        x: container.clientWidth / 2,
        y: container.clientHeight / 2
      });
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // 맵 렌더링
  useEffect(() => {
    if (isLoading || !canvasRef.current || mapData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    renderMap(ctx);
  }, [mapData, selectedTile, hoveredTile, offset, scale, isLoading]);

  // 헥스 좌표를 픽셀 좌표로 변환
  const hexToPixel = (q: number, r: number) => {
    const x = q * HEX_WIDTH * scale + ((r % 2) * HEX_WIDTH * scale) / 2 + offset.x;
    const y = r * HEX_VERT * scale + offset.y;
    return { x, y };
  };
  
  
  // 맵 렌더링 함수
  const renderMap = (ctx: CanvasRenderingContext2D) => {
    mapData.forEach(hex => {
      const { x, y } = hexToPixel(hex.q, hex.r);
      
      // 시야 상태에 따른 렌더링
      if (!hex.explored) {
        // 미탐험 지역
        drawHexagon(ctx, x, y, '#222', 'rgba(0, 0, 0, 0.8)');
      } else if (!hex.visible) {
        // 탐험했지만 현재 시야 범위 밖
        drawHexagon(ctx, x, y, getTerrainColor(hex.terrain), 'rgba(0, 0, 0, 0.5)');
      } else {
        // 현재 시야 내
        // 지형 렌더링
        drawHexagon(ctx, x, y, getTerrainColor(hex.terrain));
        
        // 자원 렌더링
        if (hex.resource) {
          drawResource(ctx, x, y, hex.resource);
        }
        
        // 도시 렌더링
        if (hex.city_id || (hex.occupant && hex.occupant === 'Korea')) {
          drawCity(ctx, x, y, hex.occupant || 'player');
        }
        
        // 유닛 렌더링
        if (hex.unit_id || (hex.occupant && hex.occupant !== 'Korea')) {
          drawUnit(ctx, x, y, hex.occupant || 'ai');
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
    
    ctx.fillStyle = getResourceColor(resource);
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
    } else {
      const hoveredTile = findNearestTile(mouseX, mouseY);
      setHoveredTile(hoveredTile || null);
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
      return;
    }
  
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // 픽셀 좌표 계산
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
  
    // 실제 위치 계산 로직 대신, 렌더링된 헥스 타일들과 비교
    const nearestTile = findNearestTile(mouseX, mouseY);
    
    if (nearestTile && onTileClick) {
      onTileClick(nearestTile);
    }
  };
  
  // 가장 가까운 타일 찾기
  const findNearestTile = (mouseX: number, mouseY: number) => {
    return mapData.find(tile => {
      const { x, y } = hexToPixel(tile.q, tile.r);
      const distance = Math.sqrt(
        Math.pow(x - mouseX, 2) + Math.pow(y - mouseY, 2)
      );
      
      // 타일 반경 내에 있는지 확인 (HEX_WIDTH의 일정 비율)
      return distance < (HEX_WIDTH * scale / 2);
    });
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
    // 데이터 다시 로드
    const loadMapData = async () => {
      try {
        setIsLoading(true);
        
        // gameService를 통해 맵 데이터 로드
        const { hexagons } = await gameService.getMap();
        setMapData(hexagons);
        
        setIsLoading(false);
        showToast("맵 데이터를 성공적으로 불러왔습니다.", "success");
      } catch (err) {
        setError(err instanceof Error ? err.message : '맵 데이터 로드 실패');
        setIsLoading(false);
        showToast("맵 데이터 로드에 실패했습니다.", "error");
      }
    };

    loadMapData();
  };
  
  // 토스트 메시지 표시
  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, show: true, type });
    setTimeout(() => {
      setToast({ message: '', show: false });
    }, 3000);
  };

  // 로딩 중 화면
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
      
      
      {/* 타일 정보 패널 */}
      {hoveredTile && hoveredTile.explored && (
        <div className="absolute bottom-4 left-4 bg-slate-800 bg-opacity-80 rounded-lg p-2 z-10 max-w-xs">
          <div className="flex items-center text-sm font-bold mb-1">
            {hoveredTile.terrain === 'mountain' && <Mountain size={16} className="mr-1" />}
            {hoveredTile.terrain === 'forest' && <Mountain size={16} className="mr-1" />}
            {hoveredTile.terrain === 'ocean' && <Waves size={16} className="mr-1" />}
            {hoveredTile.terrain === 'desert' && <Wand size={16} className="mr-1" />}
            <span className="capitalize">
              {hoveredTile.terrain} ({hoveredTile.q}, {hoveredTile.r})
            </span>
          </div>
          {hoveredTile.visible && (
            <>
              {hoveredTile.resource && (
                <div className="text-xs mb-1 flex items-center">
                  {hoveredTile.resource === 'wheat' && <Wheat size={12} className="mr-1" />}
                  {hoveredTile.resource === 'horses' && <Mountain size={12} className="mr-1" />}
                  {hoveredTile.resource === 'gems' && <Gem size={12} className="mr-1" />}
                  자원: {hoveredTile.resource}
                </div>
              )}
              {hoveredTile.city_id && (
                <div className="text-xs mb-1">
                  도시: {hoveredTile.city_id.split('_')[0]} 문명
                </div>
              )}
              {hoveredTile.unit_id && (
                <div className="text-xs mb-1">
                  유닛: {hoveredTile.occupant} 문명
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
      <MiniMap 
        mapData={mapData}
        mapOffset={offset}
        mapScale={scale}
        onMiniMapClick={handleMiniMapClick}
      />
    </div>
  );
}