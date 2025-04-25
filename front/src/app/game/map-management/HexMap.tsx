import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  ZoomIn, ZoomOut, RefreshCw, Home, Eye, Mountain, 
  Waves, Droplet, Wand, Wheat, Gem
} from "lucide-react";
import Toast from "../ui/Toast";
import gameService from "@/services/gameService";
import { HexTile } from "@/types/game";

// 상수 분리
const HEX_SIZE = 40; // 육각형 크기
const HEX_HEIGHT = HEX_SIZE * 2;
const HEX_WIDTH = Math.sqrt(3) / 2 * HEX_HEIGHT;
const HEX_VERT = HEX_HEIGHT * 0.75;

interface HexMapProps {
  gameId: string;
  onTileClick?: (tile: any) => void;
  selectedTile?: any | null;
  onUnitMove?: (unitId: string, to: { q: number, r: number, s: number }) => void;
}

// 타일 정보 패널 컴포넌트
const TileInfoPanel = React.memo(({ hoveredTile }: { hoveredTile: HexTile | null }) => {
  if (!hoveredTile || !hoveredTile.explored) return null;
  
  return (
    <div className="absolute top-4 left-4 bg-slate-800 bg-opacity-80 rounded-lg p-2 z-10 max-w-xs">
      <div className="flex items-center text-sm font-bold mb-1">
        {hoveredTile.terrain === 'mountain' && <Mountain size={16} className="mr-1" />}
        {hoveredTile.terrain === 'forest' && <Mountain size={16} className="mr-1" />}
        {hoveredTile.terrain === 'ocean' && <Waves size={16} className="mr-1" />}
        {hoveredTile.terrain === 'desert' && <Wand size={16} className="mr-1" />}
        <span className="capitalize">
          위치: ({hoveredTile.q}, {hoveredTile.r}) - 지형: {hoveredTile.terrain}
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
  );
});
TileInfoPanel.displayName = 'TileInfoPanel';

// 맵 컨트롤 버튼 컴포넌트
const MapControls = React.memo(({ 
  handleZoomIn, 
  handleZoomOut, 
  handleCenterMap, 
  handleRefreshMap 
}: { 
  handleZoomIn: () => void, 
  handleZoomOut: () => void, 
  handleCenterMap: () => void, 
  handleRefreshMap: () => void 
}) => {
  return (
    <div className="absolute left-4 bottom-4 flex flex-col gap-2">
      <button 
        onClick={handleZoomIn}
        className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center hover:bg-slate-700"
      >
        <ZoomIn size={16} />
      </button>
      <button 
        onClick={handleZoomOut}
        className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center hover:bg-slate-700"
      >
        <ZoomOut size={16} />
      </button>
      <button 
        onClick={handleCenterMap}
        className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center hover:bg-slate-700"
      >
        <Home size={16} />
      </button>
      <button 
        onClick={handleRefreshMap}
        className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center hover:bg-slate-700"
      >
        <RefreshCw size={16} />
      </button>
    </div>
  );
});
MapControls.displayName = 'MapControls';

// 미니맵 컴포넌트
interface MiniMapProps {
  mapData: HexTile[];
  mapOffset: { x: number; y: number };
  mapScale: number;
  onMiniMapClick: (q: number, r: number) => void;
  isMiniMapExpanded: boolean;
  setIsMiniMapExpanded: (expanded: boolean) => void;
  mapBounds: { minQ: number; maxQ: number; minR: number; maxR: number };
}

const MiniMap = React.memo(({ 
  mapData, 
  mapOffset, 
  mapScale, 
  isMiniMapExpanded,
  setIsMiniMapExpanded,
  mapBounds
}: MiniMapProps) => {
  const miniMapRef = useRef<HTMLCanvasElement>(null);
  const miniMapSize = 150; // 미니맵 크기
  
  // 미니맵 렌더링
  useEffect(() => {
    const canvas = miniMapRef.current;
    if (!canvas || mapData.length === 0 || !isMiniMapExpanded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 캔버스 초기화
    ctx.clearRect(0, 0, miniMapSize, miniMapSize);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, miniMapSize, miniMapSize);
    
    // 헥스맵 크기 계산
    const hexWidth = HEX_WIDTH;
    const hexHeight = HEX_VERT;
    
    // 맵 크기 (in hexes)
    const mapWidthInHexes = mapBounds.maxQ - mapBounds.minQ + 2;
    const mapHeightInHexes = mapBounds.maxR - mapBounds.minR + 2;
    
    // 미니맵 유효 영역 (테두리 고려)
    const effectiveMiniMapSize = miniMapSize - 20; // 테두리 여백 10px씩
    
    // 미니맵에서 맵 전체가 보이도록 타일 크기 조정
    const tileScaleX = effectiveMiniMapSize / mapWidthInHexes;
    const tileScaleY = effectiveMiniMapSize / mapHeightInHexes;
    const tileSize = Math.min(tileScaleX, tileScaleY) * 0.9; // 약간의 여백 유지
    
    // 미니맵 중심
    const miniMapCenterX = miniMapSize / 2;
    const miniMapCenterY = miniMapSize / 2;
    
    // 각 헥스 타일 그리기
    mapData.forEach(hex => {
      // 미니맵에서의 타일 위치 계산
      const x = miniMapCenterX + (hex.q - (mapBounds.minQ + mapBounds.maxQ) / 2) * tileSize;
      const y = miniMapCenterY + (hex.r - (mapBounds.minR + mapBounds.maxR) / 2) * tileSize;
      
      // 탐색한 타일만 표시 (미탐색 타일은 건너뜀)
      if (hex.explored) {
        // 지형에 따른 색상으로 타일 그리기
        // 현재 시야에 있지 않은 탐색된 타일은 더 어둡게 표시
        if (!hex.visible) {
          ctx.fillStyle = addOverlay(getTerrainColor(hex.terrain), 'rgba(0, 0, 0, 0.5)');
        } else {
          ctx.fillStyle = getTerrainColor(hex.terrain);
        }
        ctx.fillRect(x - tileSize/2, y - tileSize/2, tileSize, tileSize);
        
        // 도시 위치 표시 (작은 원으로)
        if (hex.city_id || (hex.occupant && hex.occupant === 'Korea' && hex.city)) {
          // 도시 소유자에 따른 색상
          ctx.fillStyle = hex.occupant === 'Korea' ? '#3498db' : '#e74c3c';
          
          // 작은 원 그리기
          ctx.beginPath();
          ctx.arc(x, y, tileSize * 0.4, 0, Math.PI * 2);
          ctx.fill();
          
          // 테두리 추가
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });
    
  }, [mapData, mapOffset, mapScale, isMiniMapExpanded, mapBounds]);

  // 미니맵 토글 버튼
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
          className="bg-slate-800 bg-opacity-70 rounded-lg shadow-md border border-slate-700"
        />
      )}
    </div>
  );
});
MiniMap.displayName = 'MiniMap';

// 지형 색상 유틸리티 함수
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

// 오버레이 색상 유틸리티 함수
const addOverlay = (baseColor: string, overlay: string): string => {
  return overlay; // 실제 구현에서는 두 색상을 섞는 로직이 필요할 수 있음
};

// 맵 경계 계산 함수
const calculateMapBounds = (mapData: HexTile[]) => {
  if (!mapData || mapData.length === 0) {
    return { minQ: 0, maxQ: 0, minR: 0, maxR: 0 };
  }
  
  const qCoords = mapData.map(hex => hex.q);
  const rCoords = mapData.map(hex => hex.r);

  return {
    minQ: Math.min(...qCoords),
    maxQ: Math.max(...qCoords),
    minR: Math.min(...rCoords),
    maxR: Math.max(...rCoords)
  };
};

// 메인 HexMap 컴포넌트
export default function HexMap({ 
  gameId, 
  onTileClick, 
  selectedTile,
  onUnitMove
}: HexMapProps) {
  // 상태 관리
  const [mapData, setMapData] = useState<HexTile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isMiniMapExpanded, setIsMiniMapExpanded] = useState(true);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredTile, setHoveredTile] = useState<HexTile | null>(null);
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
  const isInitialFocusSet = useRef(false);
  
  // 토스트 메시지 표시 함수
  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, show: true, type });
    setTimeout(() => {
      setToast({ message: '', show: false });
    }, 3000);
  }, []);
  
  // 맵 데이터 로드
  useEffect(() => {
    const loadMapData = async () => {
      try {
        setIsLoading(true);
        
        // gameService를 통해 맵 데이터 로드
        const response = await gameService.getMap();
        console.log("맵 데이터 로드:", response);
        
        setMapData(response);
        
        setIsLoading(false);
        showToast("맵 데이터를 성공적으로 불러왔습니다.", "success");
      } catch (err) {
        console.error("맵 데이터 로드 오류:", err);
        setError(err instanceof Error ? err.message : '맵 데이터 로드 실패');
        setIsLoading(false);
        showToast("맵 데이터 로드에 실패했습니다.", "error");
      }
    };
  
    loadMapData();
  }, [showToast]);
  
  // 맵 데이터가 변경될 때마다 경계 계산
  useEffect(() => {
    if (mapData.length > 0) {
      const bounds = calculateMapBounds(mapData);
      setMapBounds(bounds);
    }
  }, [mapData]);
  
  // 맵 중앙으로 포커싱 - 메모이제이션
  const focusOnPlayerCity = useCallback((hexData: HexTile[]) => {
    if (!hexData || hexData.length === 0 || !containerRef.current) {
      return;
    }
    
    // 플레이어의 도시 또는 유닛 찾기
    const playerTile = hexData.find(hex => 
      (hex.city && hex.city.owner === 'player') || 
      (hex.unit && hex.unit.owner === 'player')
    );
    
    if (playerTile) {
      const container = containerRef.current;
      
      // 적절한 확대/축소 비율 설정
      const initialScale = 1.2;
      setScale(initialScale);
      
      // 플레이어 위치로 오프셋 조정
      const centerX = container.clientWidth / 2;
      const centerY = container.clientHeight / 2;
      
      // 타일의 픽셀 좌표 계산
      const tileX = playerTile.q * HEX_WIDTH * initialScale + ((playerTile.r % 2) * HEX_WIDTH * initialScale) / 2;
      const tileY = playerTile.r * HEX_VERT * initialScale;
      
      // 타일이 중앙에 오도록 오프셋 설정
      setOffset({
        x: centerX - tileX,
        y: centerY - tileY
      });
      
      console.log('플레이어 위치로 포커싱:', playerTile.q, playerTile.r);
    } else {
      console.log('플레이어 타일을 찾을 수 없어 왼쪽 상단으로 포커싱');
      
      // 플레이어 타일이 없으면 왼쪽 상단 타일로 포커싱
      const leftTopTile = hexData.reduce((prev, current) => {
        if (current.q < prev.q || (current.q === prev.q && current.r < prev.r)) {
          return current;
        }
        return prev;
      }, hexData[0]);
      
      // 왼쪽 상단 타일이 화면 왼쪽 상단에서 약간 떨어진 위치에 오도록 오프셋 계산
      const marginX = 100; // 왼쪽 여백
      const marginY = 100; // 상단 여백
      
      const x = leftTopTile.q * HEX_WIDTH + ((leftTopTile.r % 2) * HEX_WIDTH) / 2;
      const y = leftTopTile.r * HEX_VERT;
      
      setOffset({
        x: marginX - x,
        y: marginY - y
      });
    }
  }, []);
  
  // 맵 데이터가 변경될 때마다 플레이어 위치로 포커싱 (최초 1회만)
  useEffect(() => {
    if (mapData && mapData.length > 0 && !isInitialFocusSet.current) {
      focusOnPlayerCity(mapData);
      isInitialFocusSet.current = true; // 초기 포커싱 완료 표시
    }
  }, [mapData, focusOnPlayerCity]);
  
  // 캔버스 크기 설정
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      
      // 컨테이너 크기에 맞게 캔버스 크기 설정
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);
  
  // 헥스 좌표를 픽셀 좌표로 변환 - 메모이제이션
  const hexToPixel = useCallback((q: number, r: number) => {
    const x = q * HEX_WIDTH * scale + ((r % 2) * HEX_WIDTH * scale) / 2 + offset.x;
    const y = r * HEX_VERT * scale + offset.y;
    return { x, y };
  }, [scale, offset]);
  
  // 픽셀 좌표를 헥스 좌표로 변환 - 메모이제이션
  const pixelToHex = useCallback((px: number, py: number) => {
    const x = (px - offset.x) / (HEX_WIDTH * scale);
    const y = (py - offset.y) / (HEX_VERT * scale);
    
    const r = Math.round(y);
    const q = Math.round(x - (r % 2) / 2);
    
    return { q, r };
  }, [scale, offset]);
  
  // 맵 렌더링 - 메모이제이션
  const renderMap = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!mapData) return;
    
    // 육각형 그리기 함수
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
    
    // 육각형 외곽선 그리기 함수
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
    
    // 타일 하이라이트 함수
    const highlightTile = (
      ctx: CanvasRenderingContext2D, 
      cx: number, 
      cy: number, 
      color: string, 
      lineWidth: number
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      drawHexagonOutline(ctx, cx, cy);
    };
    
    // 자원 그리기 함수
    const drawResource = (ctx: CanvasRenderingContext2D, cx: number, cy: number, resource: string) => {
      const radius = HEX_WIDTH * scale / 6;
      
      // 자원별 색상
      const getResourceColor = (resource: string): string => {
        switch (resource) {
          case 'iron': return '#7f8c8d';
          case 'horses': return '#d35400';
          case 'wheat': return '#f1c40f';
          case 'cattle': return '#e67e22';
          case 'gold': return '#f39c12';
          case 'gems': return '#9b59b6';
          default: return '#3498db';
        }
      };
      
      ctx.fillStyle = getResourceColor(resource);
      ctx.beginPath();
      ctx.arc(cx, cy - radius, radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    };
    
    // 도시 그리기 함수
    const drawCity = (ctx: CanvasRenderingContext2D, cx: number, cy: number, owner: string) => {
      const radius = HEX_WIDTH * scale / 2.5;
      
      ctx.shadowColor = owner === 'Korea' ? 'rgba(52, 152, 219, 0.8)' : 'rgba(231, 76, 60, 0.8)';
      ctx.shadowBlur = 10;
      
      const color = owner === 'Korea' ? '#3498db' : '#e74c3c';
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.shadowBlur = 0;
      
      // 도시 건물 아이콘
      ctx.fillStyle = '#fff';
      
      const buildingWidth = radius * 0.4;
      const buildingHeight = radius * 0.8;
      ctx.fillRect(cx - buildingWidth/2, cy - buildingHeight/2, buildingWidth, buildingHeight);
      
      const smallBuildingWidth = radius * 0.3;
      const smallBuildingHeight = radius * 0.5;
      ctx.fillRect(cx - buildingWidth/2 - smallBuildingWidth, cy - smallBuildingHeight/2, smallBuildingWidth, smallBuildingHeight);
      
      const mediumBuildingWidth = radius * 0.35;
      const mediumBuildingHeight = radius * 0.6;
      ctx.fillRect(cx + buildingWidth/2, cy - mediumBuildingHeight/2, mediumBuildingWidth, mediumBuildingHeight);

      // 도시 이름 표시 플래그
      ctx.fillStyle = owner === 'Korea' ? '#3498db' : '#e74c3c';
      ctx.fillRect(cx - radius/2, cy + radius * 0.6, radius, radius * 0.3);
      ctx.strokeRect(cx - radius/2, cy + radius * 0.6, radius, radius * 0.3);
    };
    
    // 유닛 그리기 함수
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
    
    // 각 타일 렌더링
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
        if (hex.city_id || hex.city || (hex.occupant && hex.occupant === 'Korea')) {
          // 도시 주변에 밝은 테두리 효과 추가
          ctx.strokeStyle = hex.occupant === 'Korea' ? 'rgba(52, 152, 219, 0.7)' : 'rgba(231, 76, 60, 0.7)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          const glowRadius = HEX_WIDTH * scale / 1.8;
          for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i;
            const px = x + Math.cos(angle) * glowRadius;
            const py = y + Math.sin(angle) * glowRadius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
          
          // 도시 아이콘 그리기
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
  }, [mapData, selectedTile, hoveredTile, scale, offset, hexToPixel]);
  
  // 맵 렌더링 효과
  useEffect(() => {
    if (isLoading || !canvasRef.current || !mapData || mapData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    renderMap(ctx);
  }, [mapData, selectedTile, hoveredTile, offset, scale, isLoading, renderMap]);
  
  // 키보드 이벤트 핸들러 - 메모이제이션
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const moveStep = 50; // 이동 거리
    const scaleStep = 0.1; // 확대/축소 단계

    switch (e.key) {
      case 'ArrowUp':
        setOffset(prev => ({ ...prev, y: prev.y + moveStep }));
        break;
      case 'ArrowDown':
        setOffset(prev => ({ ...prev, y: prev.y - moveStep }));
        break;
      case 'ArrowLeft':
        setOffset(prev => ({ ...prev, x: prev.x + moveStep }));
        break;
      case 'ArrowRight':
        setOffset(prev => ({ ...prev, x: prev.x - moveStep }));
        break;
      case '+': 
      case '=': 
        setScale(prev => Math.min(2, prev + scaleStep)); 
        break;
      case '-': 
      case '_': 
        setScale(prev => Math.max(0.5, prev - scaleStep)); 
        break;
    }
  }, []);

  // 키보드 이벤트 리스너 추가/제거
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // 마우스 이벤트 핸들러 - 메모이제이션
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) { // 좌클릭
      setIsDragging(true);
      setDragStart({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y
      });
    }
  }, [offset]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
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
      // 가장 가까운 타일 찾기 함수
      const findNearestTile = (mouseX: number, mouseY: number): HexTile | null => {
        // 마우스 좌표를 헥스 좌표로 변환
        const { q, r } = pixelToHex(mouseX, mouseY);
        
        // 해당 헥스 좌표와 가장 가까운 타일 찾기
        return mapData.find(tile => tile.q === q && tile.r === r) || null;
      };
      
      const hoveredTile = findNearestTile(mouseX, mouseY);
      setHoveredTile(hoveredTile);
    }
  }, [isDragging, dragStart, mapData, pixelToHex]);
  
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
      return;
    }
  
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !onTileClick) return;
    
    // 픽셀 좌표 계산
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 가장 가까운 타일 찾기 함수 (inline으로 정의)
    const findNearestTile = (mouseX: number, mouseY: number): HexTile | null => {
      const { q, r } = pixelToHex(mouseX, mouseY);
      return mapData.find(tile => tile.q === q && tile.r === r) || null;
    };
    
    const nearestTile = findNearestTile(mouseX, mouseY);
    
    if (nearestTile) {
      onTileClick(nearestTile);
    }
  }, [isDragging, mapData, onTileClick, pixelToHex]);
  
  // 확대/축소 처리 - 메모이제이션
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setScale(prev => Math.max(0.5, Math.min(2, prev + delta)));
  }, []);
  
  // 맵 컨트롤 함수들 - 메모이제이션
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(2, prev + 0.1));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.1));
  }, []);
  
  const handleCenterMap = useCallback(() => {
    if (!containerRef.current) return;
    setOffset({
      x: containerRef.current.clientWidth / 2,
      y: containerRef.current.clientHeight / 2
    });
  }, []);
  
  const handleRefreshMap = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await gameService.getMap();
      setMapData(response);
      setIsLoading(false);
      showToast("맵 데이터를 성공적으로 불러왔습니다.", "success");
    } catch (err) {
      console.error("맵 데이터 로드 오류:", err);
      setError(err instanceof Error ? err.message : '맵 데이터 로드 실패');
      setIsLoading(false);
      showToast("맵 데이터 로드에 실패했습니다.", "error");
    }
  }, [showToast]);
  
  // 미니맵 클릭 핸들러 - 메모이제이션
  const handleMiniMapClick = useCallback((q: number, r: number) => {
    const container = containerRef.current;
    if (container) {
      const centerX = container.clientWidth / 2;
      const centerY = container.clientHeight / 2;
      
      setOffset({
        x: centerX - (q * HEX_WIDTH * scale),
        y: centerY - (r * HEX_VERT * scale)
      });
    }
  }, [scale]);
  
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
      <TileInfoPanel hoveredTile={hoveredTile} />
      
      {/* 맵 컨트롤 버튼 */}
      <MapControls 
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        handleCenterMap={handleCenterMap}
        handleRefreshMap={handleRefreshMap}
      />
      
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
      
      {/* 미니맵 */}
      <MiniMap 
        mapData={mapData}
        mapOffset={offset}
        mapScale={scale}
        onMiniMapClick={handleMiniMapClick}
        isMiniMapExpanded={isMiniMapExpanded}
        setIsMiniMapExpanded={setIsMiniMapExpanded}
        mapBounds={mapBounds}
      />
    </div>
  );
}
    
