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
  userId: string;
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
  userId,
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
  const [scale, setScale] = useState(1); // 기본값을 0.7로 조정
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
    const miniMapSize = 150; // 미니맵 UI 크기
    const miniMapCanvasSize = 300; // 실제 캔버스 크기 (고해상도를 위해 2배)
    
    useEffect(() => {
      const canvas = miniMapRef.current;
      if (!canvas || mapData.length === 0) return;
  
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // 고해상도 렌더링을 위한 설정
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // 캔버스 초기화
      ctx.clearRect(0, 0, miniMapCanvasSize, miniMapCanvasSize);
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, miniMapCanvasSize, miniMapCanvasSize);
      
      // 맵 경계 계산
      const bounds = calculateMapBounds(mapData);
      
      // 헥스맵 크기 계산
      const hexWidth = HEX_WIDTH;
      const hexHeight = HEX_VERT;
      
      // 맵 크기 (in hexes)
      const mapWidthInHexes = bounds.maxQ - bounds.minQ + 2;
      const mapHeightInHexes = bounds.maxR - bounds.minR + 2;
      
      // 미니맵 유효 영역 (테두리 고려)
      const effectiveMiniMapSize = miniMapCanvasSize - 40; // 테두리 여백 20px씩 (캔버스 크기가 2배이므로)
      
      // 미니맵에서 맵 전체가 보이도록 타일 크기 조정
      const tileScaleX = effectiveMiniMapSize / mapWidthInHexes;
      const tileScaleY = effectiveMiniMapSize / mapHeightInHexes;
      const tileSize = Math.min(tileScaleX, tileScaleY) * 0.9; // 약간의 여백 유지
      
      // 미니맵 중심
      const miniMapCenterX = miniMapCanvasSize / 2;
      const miniMapCenterY = miniMapCanvasSize / 2;
      
      // 각 헥스 타일 그리기
      mapData.forEach(hex => {
        // 미니맵에서의 타일 위치 계산
        const x = miniMapCenterX + (hex.q - (bounds.minQ + bounds.maxQ) / 2) * tileSize;
        const y = miniMapCenterY + (hex.r - (bounds.minR + bounds.maxR) / 2) * tileSize;
        
        // 탐색한 타일만 표시 (미탐색 타일은 건너뜀)
        if (hex.explored) {
          // 지형에 따른 색상으로 타일 그리기
          // 현재 시야에 있지 않은 탐색된 타일은 더 어둡게 표시
          if (!hex.visible) {
            ctx.fillStyle = addOverlay(getTerrainColor(hex.terrain), 'rgba(0, 0, 0, 0.5)');
          } else {
            ctx.fillStyle = getTerrainColor(hex.terrain);
          }
          
          // 사각형 대신 원을 그려 더 부드럽게 표현
          ctx.beginPath();
          ctx.arc(x, y, tileSize/2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      // 컨테이너 크기 가져오기
      const container = containerRef.current;
      if (!container) return;
      
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // 현재 화면 중심점 계산 - 메인 맵의 오프셋에서 역산
      const centerQInPixels = containerWidth / 2 - mapOffset.x;
      const centerRInPixels = containerHeight / 2 - mapOffset.y;
      
      // 중심점의 헥스 좌표
      const centerQ = centerQInPixels / (HEX_WIDTH * mapScale);
      const centerR = centerRInPixels / (HEX_VERT * mapScale);
      
      // 미니맵에서의 화면 중심점
      const viewportCenterX = miniMapCenterX + (centerQ - (bounds.minQ + bounds.maxQ) / 2) * tileSize;
      const viewportCenterY = miniMapCenterY + (centerR - (bounds.minR + bounds.maxR) / 2) * tileSize;
      
      // 현재 메인맵에 보이는 헥스 개수 계산
      const visibleHexesWidth = containerWidth / (HEX_WIDTH * mapScale);
      const visibleHexesHeight = containerHeight / (HEX_VERT * mapScale);
      
      // 미니맵에서의 뷰포트 크기
      const viewportWidthOnMinimap = visibleHexesWidth * tileSize;
      const viewportHeightOnMinimap = visibleHexesHeight * tileSize;
      
      // 계산된 뷰포트가 너무 크거나 작지 않도록 제한
      const maxSize = miniMapCanvasSize * 0.9;
      const minSize = miniMapCanvasSize * 0.1;
      const adjustedWidth = Math.min(maxSize, Math.max(minSize, viewportWidthOnMinimap));
      const adjustedHeight = Math.min(maxSize, Math.max(minSize, viewportHeightOnMinimap));
      
      // 보이는 화면 영역 표시
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 3; // 선 굵기 증가 (캔버스 크기가 2배이므로)
      ctx.strokeRect(
        viewportCenterX - adjustedWidth / 2,
        viewportCenterY - adjustedHeight / 2,
        adjustedWidth,
        adjustedHeight
      );
      
    }, [mapData, mapOffset, mapScale, containerRef.current?.clientWidth, containerRef.current?.clientHeight]);
  
    // 미니맵 클릭 핸들러 추가
    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      // 기능 제거 - 아무 동작도 하지 않음
      return;
    };
  
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
            width={miniMapCanvasSize}
            height={miniMapCanvasSize}
            onClick={handleClick}
            className="bg-slate-800 bg-opacity-70 rounded-lg shadow-md border border-slate-700"
            style={{ width: miniMapSize, height: miniMapSize }} // CSS로 크기 조정
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

    // 맵의 실제 픽셀 크기 계산
    const mapWidthInPixels = (mapBounds.maxQ - mapBounds.minQ + 1) * hexPixelWidth;
    const mapHeightInPixels = (mapBounds.maxR - mapBounds.minR + 1) * hexPixelHeight;

    // 현재 오프셋 값
    const currentOffset = { ...offset };

    switch (e.key) {
      case 'ArrowUp': {
        // 맵 상단 경계 제한
        const maxUpPosition = containerHeight / 2 + Math.abs(mapBounds.minR * hexPixelHeight);
        const newY = Math.min(currentOffset.y + moveStep, maxUpPosition);
        
        // 상단 경계를 넘어가지 않도록 추가 검사
        if (newY <= maxUpPosition) {
          setOffset(prev => ({ ...prev, y: newY }));
        }
        break;
      }
      case 'ArrowDown': {
        // 맵 하단 경계 제한
        const maxDownPosition = containerHeight / 2 - (mapBounds.maxR * hexPixelHeight);
        const newY = Math.max(currentOffset.y - moveStep, maxDownPosition);
        
        // 하단 경계를 넘어가지 않도록 추가 검사
        if (newY >= maxDownPosition) {
          setOffset(prev => ({ ...prev, y: newY }));
        }
        break;
      }
      case 'ArrowLeft': {
        // 맵 좌측 경계 제한
        const maxLeftPosition = containerWidth / 2 + Math.abs(mapBounds.minQ * hexPixelWidth);
        const newX = Math.min(currentOffset.x + moveStep, maxLeftPosition);
        
        // 좌측 경계를 넘어가지 않도록 추가 검사
        if (newX <= maxLeftPosition) {
          setOffset(prev => ({ ...prev, x: newX }));
        }
        break;
      }
      case 'ArrowRight': {
        // 맵 우측 경계 제한
        const maxRightPosition = containerWidth / 2 - (mapBounds.maxQ * hexPixelWidth);
        const newX = Math.max(currentOffset.x - moveStep, maxRightPosition);
        
        // 우측 경계를 넘어가지 않도록 추가 검사
        if (newX >= maxRightPosition) {
          setOffset(prev => ({ ...prev, x: newX }));
        }
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
  }, [mapBounds, scale, offset, containerRef]);


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

  // WebSocket 연결 상태
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isMapDataLoaded, setIsMapDataLoaded] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<number | null>(null);

  // 토스트 메시지 표시 함수
  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ 
      message,
      show: true,
      type
    });
    
    // 3초 후 자동으로 제거
    setTimeout(() => {
      setToast({ message: '', show: false });
    }, 3000);
  };
  
  // 맵 데이터 로드 함수
  const loadMapData = async () => {
    // 이미 맵 데이터가 로드되었고 턴이 끝나지 않았다면 중복 요청 방지
    if (isMapDataLoaded && mapData.length > 0) {
      console.log("맵 데이터가 이미 로드되어 있습니다. 턴이 끝나기 전까지 다시 로드하지 않습니다.");
      return;
    }

    try {
      setIsLoading(true);
      
      // gameService를 통해 맵 데이터 로드 (userId 전달)
      const response = await gameService.getMap(userId);
      
      // hexagons가 undefined일 경우 빈 배열로 처리
      const hexagons = response?.hexagons || [];
      console.log("맵 데이터 로드:", response, hexagons);
      
      setMapData(hexagons);
      setIsMapDataLoaded(true);
      
      // 현재 턴 정보 저장 (맵 데이터에 turn 정보가 있다면)
      if (response && 'turn' in response) {
        setCurrentTurn(typeof response.turn === 'number' ? response.turn : null);
      }
      
      // 맵 데이터가 로드된 직후에 포커싱
      if (hexagons.length > 0) {
        focusOnPlayerCity(hexagons);
      }
      
      setIsLoading(false);
      showToast("맵 데이터를 성공적으로 불러왔습니다.", "success");
    } catch (err) {
      console.error("맵 데이터 로드 오류:", err);
      setError(err instanceof Error ? err.message : '맵 데이터 로드 실패');
      setIsLoading(false);
      showToast("맵 데이터 로드에 실패했습니다.", "error");
    }
  };
  
  // WebSocket 연결 설정 함수
  const setupWebSocketConnection = useCallback(async () => {
    if (!gameId || !userId) return;
    
    try {
      // WebSocket 연결 설정
      await gameService.connectWebSocket(userId, gameId);
      setWsConnected(true);
      showToast("실시간 게임 서버에 연결되었습니다.", "success");
      
      // 게임 업데이트 이벤트 핸들러 등록
      const handleGameUpdate = (data: any) => {
        console.log('게임 상태 업데이트 수신:', data);
        
        // 턴 변경 감지
        let turnChanged = false;
        if (data.current_turn && currentTurn !== null) {
          const newTurn = Number(data.current_turn);
          if (!isNaN(newTurn) && newTurn !== currentTurn) {
            setCurrentTurn(newTurn);
            turnChanged = true;
            console.log(`턴이 변경되었습니다: ${currentTurn} -> ${newTurn}`);
          }
        }
        
        // 맵 데이터 업데이트 (턴이 변경되었거나 맵 데이터가 없는 경우에만)
        if (data.tiles && (turnChanged || !isMapDataLoaded || mapData.length === 0)) {
          setMapData(data.tiles);
          setIsMapDataLoaded(true);
          console.log("WebSocket을 통해 맵 데이터가 업데이트되었습니다.");
        }
        
        setLastUpdateTime(new Date());
      };
      
      // 알림 이벤트 핸들러 등록
      const handleNotification = (data: any) => {
        if (data.message) {
          showToast(data.message, data.type || 'info');
        }
        
        // 턴 종료 알림인 경우 맵 데이터 재로드 플래그 설정
        if (data.message && (data.message.includes('턴이 끝났습니다') || data.message.includes('다음 턴'))) {
          setIsMapDataLoaded(false);
          console.log("턴이 종료되었습니다. 다음 맵 데이터 로드가 필요합니다.");
        }
      };
      
      // 오류 이벤트 핸들러 등록
      const handleError = (data: any) => {
        console.log('WebSocket 오류 이벤트 수신:', data);
        showToast(data.message || '오류가 발생했습니다.', 'error');
        
        // WebSocket 연결 오류 시 백업 모드 활성화
        if (data.message?.includes('서버 연결 오류') || data.message?.includes('타임아웃')) {
          setWsConnected(false);
          
          // 맵 데이터가 없는 경우에만 폴백 데이터 로드
          if (!isMapDataLoaded || mapData.length === 0) {
            loadMapData();
          }
        }
      };
      
      // 이벤트 리스너 등록
      gameService.onWebSocketEvent('gameUpdate', handleGameUpdate);
      gameService.onWebSocketEvent('notification', handleNotification);
      gameService.onWebSocketEvent('error', handleError);
      
      // 클린업 함수에서 이벤트 리스너 제거
      return () => {
        gameService.offWebSocketEvent('gameUpdate', handleGameUpdate);
        gameService.offWebSocketEvent('notification', handleNotification);
        gameService.offWebSocketEvent('error', handleError);
      };
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      setWsConnected(false);
      showToast("실시간 게임 서버 연결에 실패했습니다. 오프라인 모드로 계속합니다.", "error");
      
      // 맵 데이터가 없는 경우에만 폴백 데이터 로드
      if (!isMapDataLoaded || mapData.length === 0) {
        loadMapData();
      }
    }
  }, [gameId, userId, showToast, mapData, isMapDataLoaded, currentTurn]);

  // 컴포넌트 마운트 시 맵 데이터 로드 및 WebSocket 연결
  useEffect(() => {
    if (gameId && userId) {
      // 먼저 맵 데이터 로드, 그 다음 WebSocket 연결
      loadMapData().then(() => {
        setupWebSocketConnection();
      }).catch(err => {
        console.error("초기 맵 데이터 로드 오류:", err);
        // 맵 데이터 로드 실패해도 WebSocket 연결 시도
        setupWebSocketConnection();
      });
      
      return () => {
        // 컴포넌트 언마운트 시 WebSocket 연결 종료
        gameService.disconnectWebSocket();
      };
    }
  }, [gameId, userId, loadMapData, setupWebSocketConnection]);

  // 맵 렌더링
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
  }, [mapData, selectedTile, hoveredTile, offset, scale, isLoading]);

  // 헥스 좌표를 픽셀 좌표로 변환
  const hexToPixel = (q: number, r: number) => {
    // 헥스 좌표계에서 픽셀 좌표계로 변환
    // 홀수 행(r)에 대한 오프셋 처리
    const x = q * HEX_WIDTH * scale + ((r % 2) * HEX_WIDTH * scale) / 2 + offset.x;
    const y = r * HEX_VERT * scale + offset.y;
    return { x, y };
  };
  
  // 픽셀 좌표를 헥스 좌표로 변환 (마우스 클릭 위치 계산용)
  const pixelToHex = (px: number, py: number) => {
    // 오프셋 적용하여 상대 좌표 계산
    const x = (px - offset.x) / (HEX_WIDTH * scale);
    const y = (py - offset.y) / (HEX_VERT * scale);
    
    // 홀수 행에 대한 오프셋 고려
    const r = Math.round(y);
    const q = Math.round(x - (r % 2) / 2);
    
    return { q, r };
  };
  
  // 맵 렌더링 함수
  const renderMap = (ctx: CanvasRenderingContext2D) => {
    if (!mapData) return;
    
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
    // 마우스 좌표를 헥스 좌표로 변환
    const { q, r } = pixelToHex(mouseX, mouseY);
    
    // 해당 헥스 좌표와 가장 가까운 타일 찾기
    const nearestTile = mapData.find(tile => 
      tile.q === q && tile.r === r
    );
    
    return nearestTile || null;
  };
  
  // 확대/축소 처리
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    let newScale = Math.max(0.5, Math.min(2, scale + delta));
    
    // 최소 스케일일 때 맵이 화면에 꽉 차도록 조정
    if (newScale === 0.5 && containerRef.current && mapData.length > 0) {
      const container = containerRef.current;
      const bounds = calculateMapBounds(mapData);
      const mapWidthInHexes = bounds.maxQ - bounds.minQ + 1;
      const mapHeightInHexes = bounds.maxR - bounds.minR + 1;
      
      const containerAspectRatio = container.clientWidth / container.clientHeight;
      const mapAspectRatio = mapWidthInHexes / mapHeightInHexes;
      
      // 맵을 컨테이너에 꽉 차게 표시하기 위한 스케일 계산
      if (containerAspectRatio > mapAspectRatio) {
        // 세로로 꽉 차게
        newScale = container.clientHeight / (mapHeightInHexes * HEX_VERT);
      } else {
        // 가로로 꽉 차게
        newScale = container.clientWidth / (mapWidthInHexes * HEX_WIDTH);
      }
      
      // 여백 최소화를 위해 약간 더 크게 (5% 정도)
      newScale *= 1.05;
      
      // 스케일 값 범위 제한
      newScale = Math.max(0.5, Math.min(2, newScale));
    }
    
    // 마우스 포인터 위치 기준으로 확대/축소
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // 마우스 위치에서의 헥스 좌표 계산
      const hexCoord = pixelToHex(mouseX, mouseY);
      
      // 새로운 스케일로 픽셀 좌표 계산
      const oldScale = scale;
      setScale(newScale);
      
      // 확대/축소 후에도 마우스 아래의 타일이 동일한 위치에 오도록 오프셋 조정
      if (containerRef.current) {
        const container = containerRef.current;
        const bounds = calculateMapBounds(mapData);
        const mapWidthInHexes = bounds.maxQ - bounds.minQ + 1;
        const mapHeightInHexes = bounds.maxR - bounds.minR + 1;
        
        // 맵의 실제 크기 계산 (픽셀 단위)
        const mapWidthInPixels = mapWidthInHexes * HEX_WIDTH * newScale;
        const mapHeightInPixels = mapHeightInHexes * HEX_VERT * newScale;
        
        // 맵 중앙 정렬 유지하면서 확대/축소
        setOffset({
          x: (container.clientWidth - mapWidthInPixels) / 2 + (HEX_WIDTH * newScale / 2),
          y: (container.clientHeight - mapHeightInPixels) / 2 + (HEX_VERT * newScale / 2)
        });
      }
    }
  };
  
  // 맵 확대/축소 버튼 핸들러
  const handleZoomIn = () => {
    const newScale = Math.min(2, scale + 0.1);
    setScale(newScale);
    
    // 맵 중앙 정렬 유지
    if (containerRef.current) {
      const container = containerRef.current;
      const bounds = mapBounds;
      const mapWidthInHexes = bounds.maxQ - bounds.minQ + 1;
      const mapHeightInHexes = bounds.maxR - bounds.minR + 1;
      
      // 맵의 실제 크기 계산 (픽셀 단위)
      const mapWidthInPixels = mapWidthInHexes * HEX_WIDTH * newScale;
      const mapHeightInPixels = mapHeightInHexes * HEX_VERT * newScale;
      
      // 맵 중앙 정렬
      setOffset({
        x: (container.clientWidth - mapWidthInPixels) / 2 + (HEX_WIDTH * newScale / 2),
        y: (container.clientHeight - mapHeightInPixels) / 2 + (HEX_VERT * newScale / 2)
      });
    }
  };
  
  const handleZoomOut = () => {
    const newScale = Math.max(0.5, scale - 0.1);
    setScale(newScale);
    
    // 맵 중앙 정렬 유지
    if (containerRef.current) {
      const container = containerRef.current;
      const bounds = mapBounds;
      const mapWidthInHexes = bounds.maxQ - bounds.minQ + 1;
      const mapHeightInHexes = bounds.maxR - bounds.minR + 1;
      
      // 맵의 실제 크기 계산 (픽셀 단위)
      const mapWidthInPixels = mapWidthInHexes * HEX_WIDTH * newScale;
      const mapHeightInPixels = mapHeightInHexes * HEX_VERT * newScale;
      
      // 맵 중앙 정렬
      setOffset({
        x: (container.clientWidth - mapWidthInPixels) / 2 + (HEX_WIDTH * newScale / 2),
        y: (container.clientHeight - mapHeightInPixels) / 2 + (HEX_VERT * newScale / 2)
      });
    }
  };
  
  // 맵 중앙으로 이동
  const handleCenterMap = () => {
    if (!containerRef.current) return;
    setOffset({
      x: containerRef.current.clientWidth / 2,
      y: containerRef.current.clientHeight / 2
    });
  };

  // Korea 문명 위치로 포커싱하는 함수
  const focusOnPlayerCity = useCallback((hexData: HexTile[]) => {
    if (!hexData || hexData.length === 0 || !containerRef.current) {
      return;
    }
    
    // 왼쪽 상단 헥스 타일 찾기 (가장 작은 q, r 값을 가진 타일)
    let leftTopTile = hexData[0];
    
    hexData.forEach(hex => {
      // q, r 값이 작을수록 왼쪽 상단에 위치
      if (hex.q < leftTopTile.q || (hex.q === leftTopTile.q && hex.r < leftTopTile.r)) {
        leftTopTile = hex;
      }
    });
    
    console.log("왼쪽 상단 타일 찾음:", leftTopTile); // 디버깅용
    
    const container = containerRef.current;
    
    // 초기 맵 스케일 설정
    const initialScale = 1.2;
    setScale(initialScale);
    
    // 정확한 픽셀 좌표 계산
    const x = leftTopTile.q * HEX_WIDTH * initialScale + ((leftTopTile.r % 2) * HEX_WIDTH * initialScale) / 2;
    const y = leftTopTile.r * HEX_VERT * initialScale;
    
    // 왼쪽 상단 타일이 화면 왼쪽 상단에서 약간 떨어진 위치에 오도록 오프셋 계산
    const marginX = 100; // 왼쪽 여백
    const marginY = 100; // 상단 여백
    
    setOffset({
      x: marginX - x,
      y: marginY - y
    });
    
    console.log(`왼쪽 상단으로 포커싱 설정 - 스케일: ${initialScale}, 오프셋:`, {
      x: marginX - x,
      y: marginY - y
    });
    
    // 선택된 타일로 설정 (선택적)
    if (onTileClick) {
      onTileClick(leftTopTile);
    }
  }, [onTileClick]);

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
          onClick={loadMapData}
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
      
      {/* WebSocket 연결 상태 표시 */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs bg-black bg-opacity-50 p-1 rounded">
        <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>{wsConnected ? '서버 연결됨' : '서버 연결 안됨'}</span>
        {currentTurn !== null && (
          <span className="ml-2">
            현재 턴: {currentTurn}
          </span>
        )}
        {lastUpdateTime && (
          <span className="ml-2">
            최근 업데이트: {lastUpdateTime.toLocaleTimeString()}
          </span>
        )}
        {isMapDataLoaded && (
          <span className="ml-2 text-green-300">
            ✓ 맵 로드됨
          </span>
        )}
      </div>
    </div>
  );
}

// 색상에 오버레이를 추가하는 유틸리티 함수
const addOverlay = (baseColor: string, overlay: string): string => {
  // 간단하게 어두운 오버레이 효과를 위해 검은색 반투명 오버레이를 적용한 새 색상 리턴
  return overlay; // 실제 구현에서는 두 색상을 섞는 로직이 필요할 수 있음
};