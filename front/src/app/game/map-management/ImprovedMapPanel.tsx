"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import gameService, { HexTile, Unit } from "@/services/gameService";
import { cn } from "@/lib/utils";
import { 
  ZoomIn, ZoomOut, Compass, Home, RotateCcw,
  RefreshCw, Eye, Trees, Mountain,
  Star, Flag, Tent, Shield, Droplet
} from "lucide-react";
import Toast from "../ui/Toast";

interface ImprovedMapPanelProps {
  onSelectTile: (tile: HexTile) => void;
  selectedUnit: Unit | null;
  onUnitMove: (unit: Unit, q: number, r: number) => void;
}

export default function ImprovedMapPanel({ 
  onSelectTile, 
  selectedUnit, 
  onUnitMove 
}: ImprovedMapPanelProps) {
  // Canvas 관련 상태 및 참조
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapData, setMapData] = useState<HexTile[]>([]);
  const [naturalWonders, setNaturalWonders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTile, setHoveredTile] = useState<HexTile | null>(null);
  const [selectedTile, setSelectedTile] = useState<HexTile | null>(null);

  // 이동 경로 관련 상태
  const [movementPath, setMovementPath] = useState<{q: number, r: number, s: number}[]>([]);
  const [pathCost, setPathCost] = useState<number>(0);
  const [canCompletePath, setCanCompletePath] = useState<boolean>(false);
  const [adjacentTiles, setAdjacentTiles] = useState<HexTile[]>([]);

  // 맵 탐색 관련 상태
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [mapScale, setMapScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // 토스트 메시지 관련 상태
  const [toast, setToast] = useState<{
    message: string;
    show: boolean;
    type?: 'info' | 'success' | 'warning' | 'error';
  }>({ message: '', show: false });

  // 헥스 그리드 상수
  const HEX_SIZE = 40; // 육각형 크기
  const HEX_HEIGHT = HEX_SIZE * 2;
  const HEX_WIDTH = Math.sqrt(3) / 2 * HEX_HEIGHT;
  const HEX_VERT = HEX_HEIGHT * 0.75;

  // 지형별 색상 가져오기
  const getTerrainColor = (terrain: string): string => {
    switch (terrain) {
      case 'plains': return '#f1c40f';     // 평원
      case 'grassland': return '#2ecc71';  // 초원
      case 'desert': return '#e67e22';     // 사막
      case 'mountain': return '#95a5a6';   // 산
      case 'hills': return '#d35400';      // 언덕
      case 'forest': return '#27ae60';     // 숲
      case 'jungle': return '#16a085';     // 정글
      case 'ocean': return '#3498db';      // 대양
      case 'sea': return '#2980b9';        // 바다
      case 'lake': return '#2980b9';       // 호수
      case 'river': return '#3498db';      // 강
      case 'beach': return '#f39c12';      // 해변
      case 'tundra': return '#ecf0f1';     // 툰드라
      case 'ice': return '#bdc3c7';        // 얼음
      default: return '#34495e';           // 기본
    }
  };

  // 자원 색상 가져오기
  const getResourceColor = (resource: string): string => {
    switch (resource) {
      case 'iron': return '#7f8c8d';       // 철
      case 'horses': return '#d35400';     // 말
      case 'oil': return '#2c3e50';        // 석유
      case 'coal': return '#2c3e50';       // 석탄
      case 'uranium': return '#27ae60';    // 우라늄
      case 'wheat': return '#f1c40f';      // 밀
      case 'cattle': return '#e67e22';     // 소
      case 'sheep': return '#ecf0f1';      // 양
      case 'deer': return '#d35400';       // 사슴
      case 'banana': return '#f1c40f';     // 바나나
      case 'fish': return '#3498db';       // 생선
      case 'gold': return '#f39c12';       // 금
      case 'silver': return '#bdc3c7';     // 은
      case 'gems': return '#9b59b6';       // 보석
      case 'marble': return '#ecf0f1';     // 대리석
      case 'spices': return '#e74c3c';     // 향신료
      case 'silk': return '#9b59b6';       // 비단
      default: return '#3498db';           // 기본
    }
  };

  // 맵 데이터 로드
  useEffect(() => {
    const loadMapData = async () => {
      try {
        setIsLoading(true);
        const { hexagons } = await gameService.getMap();
        setMapData(hexagons);
        
        // 자연경관 정보 로드
        const { wonders } = await gameService.getNaturalWonders();
        setNaturalWonders(wonders);
        
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : '맵 데이터 로드 실패');
        setIsLoading(false);
      }
    };

    loadMapData();
  }, []);

  // Canvas 크기 설정
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // 맵 중앙 정렬
      setMapOffset({
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
    
  }, [mapData, selectedTile, hoveredTile, mapOffset, mapScale, movementPath, canCompletePath, selectedUnit, adjacentTiles, isLoading]);

  // 선택된 타일이 변경되면 인접 타일 정보 가져오기
  useEffect(() => {
    if (!selectedTile) {
      setAdjacentTiles([]);
      return;
    };
    
    const fetchAdjacentTiles = async () => {
      try {
        const { hexagons } = await gameService.getAdjacentTiles(selectedTile.q, selectedTile.r);
        setAdjacentTiles(hexagons);
      } catch (err) {
        setError(err instanceof Error ? err.message : '인접 타일 정보 로드 실패');
      }
    };
    
    fetchAdjacentTiles();
  }, [selectedTile]);

  // 유닛이 선택되었을 때 경로 초기화
  useEffect(() => {
    setMovementPath([]);
    setPathCost(0);
    setCanCompletePath(false);
  }, [selectedUnit]);

  // 맵 렌더링 함수
  const renderMap = (ctx: CanvasRenderingContext2D) => {
    // 모든 타일 그리기
    mapData.forEach(hex => {
      const { pixelX, pixelY } = hexToPixel(hex.q, hex.r);
      
      // 시야 범위 외 타일은 안개로 표시
      if (hex.visibility === 'unexplored') {
        drawHexagon(ctx, pixelX, pixelY, '#222', 'rgba(0, 0, 0, 0.8)');
      } else if (hex.visibility === 'fogOfWar') {
        drawHexagon(ctx, pixelX, pixelY, getTerrainColor(hex.terrain), 'rgba(0, 0, 0, 0.5)');
      } else {
        // 지형에 따른 색상
        drawHexagon(ctx, pixelX, pixelY, getTerrainColor(hex.terrain));
        
        // 타일에 있는 자원 표시
        if (hex.resource) {
          drawResource(ctx, pixelX, pixelY, hex.resource);
        }
        
        // 자연경관 표시
        if (hex.naturalWonder) {
          drawNaturalWonder(ctx, pixelX, pixelY, hex.naturalWonder);
        }
        
        // 도시 표시
        if (hex.city) {
          drawCity(ctx, pixelX, pixelY, hex.city);
        }
        
        // 유닛 표시
        if (hex.unit) {
          drawUnit(ctx, pixelX, pixelY, hex.unit);
        }
        
        // 타일 개선시설(improvement) 표시
        if (hex.improvement) {
          drawImprovement(ctx, pixelX, pixelY, hex.improvement);
        }
        
        // 타일 경계선
        ctx.strokeStyle = 'rgba(80,80,80,0.35)';
        ctx.lineWidth = 0.7;
        drawHexagonOutline(ctx, pixelX, pixelY);
      }
    });
    
    // 인접 타일 하이라이트
    adjacentTiles.forEach(tile => {
      const { pixelX, pixelY } = hexToPixel(tile.q, tile.r);
      highlightTile(ctx, pixelX, pixelY, 'rgba(255, 255, 100, 0.3)', 1);
    });
    
    // 이동 경로 렌더링
    if (movementPath.length > 0) {
      renderMovementPath(ctx);
    }
    
    // 선택된 타일 하이라이트
    if (selectedTile) {
      const { pixelX, pixelY } = hexToPixel(selectedTile.q, selectedTile.r);
      highlightTile(ctx, pixelX, pixelY, '#fff', 3);
    }
    
    // 호버된 타일 하이라이트
    if (hoveredTile) {
      const { pixelX, pixelY } = hexToPixel(hoveredTile.q, hoveredTile.r);
      highlightTile(ctx, pixelX, pixelY, 'rgba(255, 255, 255, 0.5)', 2);
    }
  };
  
  // 헥스 좌표를 픽셀 좌표로 변환
  const hexToPixel = (q: number, r: number) => {
    const pixelX = q * HEX_WIDTH * mapScale + ((r % 2) * HEX_WIDTH * mapScale) / 2 + HEX_WIDTH * mapScale / 2 + mapOffset.x;
    const pixelY = r * HEX_VERT * mapScale + HEX_HEIGHT * mapScale / 2 + mapOffset.y;
    return { pixelX, pixelY };
  };
  
  // 픽셀 좌표를 헥스 좌표로 변환 (근사값)
  const pixelToHex = (x: number, y: number) => {
    // 오프셋 및 스케일 적용하여 역변환
    const adjustedX = (x - mapOffset.x) / mapScale;
    const adjustedY = (y - mapOffset.y) / mapScale;
    
    // 육각형 그리드 좌표 계산
    const q = Math.round(adjustedX / HEX_WIDTH);
    const r = Math.round(adjustedY / HEX_VERT);
    
    // 헥스 좌표 s 계산 (q + r + s = 0)
    const s = -q - r;
    
    return { q, r, s };
  };
  
  // 육각형 그리기
  const drawHexagon = (
    ctx: CanvasRenderingContext2D, 
    cx: number, 
    cy: number, 
    fillColor: string, 
    overlay?: string
  ) => {
    const radius = HEX_WIDTH * mapScale / 2;
    
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
    const radius = HEX_WIDTH * mapScale / 2;
    
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
  const highlightTile = (ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, lineWidth: number) => {
    const radius = HEX_WIDTH * mapScale / 2;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    drawHexagonOutline(ctx, cx, cy);
  };
  
  // 자원 그리기
  const drawResource = (ctx: CanvasRenderingContext2D, cx: number, cy: number, resource: string) => {
    const radius = HEX_WIDTH * mapScale / 6;
    
    ctx.fillStyle = getResourceColor(resource);
    ctx.beginPath();
    ctx.arc(cx, cy - radius, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  
  // 자연경관 그리기
  const drawNaturalWonder = (ctx: CanvasRenderingContext2D, cx: number, cy: number, wonderId: string) => {
    const radius = HEX_WIDTH * mapScale / 4;
    
    // 별 모양 그리기
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    
    const spikes = 5;
    const outerRadius = radius;
    const innerRadius = radius / 2;
    
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI * i) / spikes - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  
  // 도시 그리기
  const drawCity = (ctx: CanvasRenderingContext2D, cx: number, cy: number, city: any) => {
    const radius = HEX_WIDTH * mapScale / 3;
    
    // 도시는 원으로 표현
    ctx.fillStyle = city.owner === 'player' ? '#3498db' : '#e74c3c';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 도시 이름 (스케일이 충분히 클 경우에만)
    if (mapScale > 0.7) {
      ctx.fillStyle = '#fff';
      ctx.font = `${12 * mapScale}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(city.name, cx, cy + radius + 12 * mapScale);
    }
  };
  
  // 유닛 그리기
  const drawUnit = (ctx: CanvasRenderingContext2D, cx: number, cy: number, unit: any) => {
    const size = HEX_WIDTH * mapScale / 4;
    
    // 유닛 유형에 따라 다른 모양 그리기
    ctx.fillStyle = unit.owner === 'player' ? '#3498db' : '#e74c3c';
    
    if (unit.type === 'military') {
      // 군사 유닛은 삼각형
      ctx.beginPath();
      ctx.moveTo(cx, cy - size);
      ctx.lineTo(cx - size, cy + size);
      ctx.lineTo(cx + size, cy + size);
      ctx.closePath();
      ctx.fill();
    } else if (unit.type === 'settler') {
      // 정착민은 원형
      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.fill();
    } else if (unit.type === 'worker') {
      // 일꾼은 사각형
      ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    } else {
      // 기타 유닛
      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 선택된 유닛 표시
    if (selectedUnit && unit.id === selectedUnit.id) {
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, size + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  };
  
  // 개선시설 그리기
  const drawImprovement = (ctx: CanvasRenderingContext2D, cx: number, cy: number, improvement: string) => {
    const size = HEX_WIDTH * mapScale / 6;
    
    ctx.fillStyle = '#7f8c8d';
    
    if (improvement === 'farm') {
      // 농장은 십자가 모양
      ctx.beginPath();
      ctx.moveTo(cx - size, cy);
      ctx.lineTo(cx + size, cy);
      ctx.moveTo(cx, cy - size);
      ctx.lineTo(cx, cy + size);
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (improvement === 'mine') {
      // 광산은 원형
      ctx.fillStyle = '#7f8c8d';
      ctx.beginPath();
      ctx.arc(cx + size, cy - size, size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (improvement === 'trading_post') {
      // 교역소는 사각형
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    }
  };
  
  // 이동 경로 렌더링
  const renderMovementPath = (ctx: CanvasRenderingContext2D) => {
    if (movementPath.length < 2) return;
    
    ctx.strokeStyle = canCompletePath ? '#2ecc71' : '#e74c3c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    const start = hexToPixel(movementPath[0].q, movementPath[0].r);
    ctx.moveTo(start.pixelX, start.pixelY);
    
    for (let i = 1; i < movementPath.length; i++) {
      const { pixelX, pixelY } = hexToPixel(movementPath[i].q, movementPath[i].r);
      ctx.lineTo(pixelX, pixelY);
    }
    
    ctx.stroke();
    
    // 이동 비용 표시
    if (movementPath.length > 1) {
      const lastPoint = hexToPixel(
        movementPath[movementPath.length - 1].q,
        movementPath[movementPath.length - 1].r
      );
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(lastPoint.pixelX, lastPoint.pixelY, 16 * mapScale, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = canCompletePath ? '#2ecc71' : '#e74c3c';
      ctx.font = `${12 * mapScale}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pathCost.toString(), lastPoint.pixelX, lastPoint.pixelY);
    }
  };

  // 마우스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) { // 좌클릭
      setIsDragging(true);
      setDragStart({
        x: e.clientX - mapOffset.x,
        y: e.clientY - mapOffset.y
      });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (isDragging) {
      setMapOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else {
      // 마우스 호버링시 타일 정보
      const { q, r, s } = pixelToHex(mouseX, mouseY);
      const hoveredHex = mapData.find(hex => hex.q === q && hex.r === r);
      
      if (hoveredHex) {
        setHoveredTile(hoveredHex);
      } else {
        setHoveredTile(null);
      }
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
    } else {
      // 타일 선택
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const { q, r, s } = pixelToHex(mouseX, mouseY);
      const clickedHex = mapData.find(hex => hex.q === q && hex.r === r);
      
      if (clickedHex) {
        // 유닛 선택 및 이동 로직
        if (selectedUnit && movementPath.length === 0) {
          // 유닛 선택 상태에서 목적지 선택 -> 경로 계산
          calculateMovementPath(selectedUnit, clickedHex);
        } else if (selectedUnit && movementPath.length > 0) {
          // 경로 확정 및 이동 실행
          if (canCompletePath) {
            executeMovement(selectedUnit, clickedHex);
          } else {
            showToast('이동할 수 없는 경로입니다.', 'warning');
          }
        } else {
          // 일반 타일 선택
          setSelectedTile(clickedHex);
          onSelectTile(clickedHex);
        }
      }
    }
  };
  
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    const newScale = Math.max(0.5, Math.min(2, mapScale + delta));
    setMapScale(newScale);
  };
  
  // 토스트 메시지 표시
  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, show: true, type });
    setTimeout(() => {
      setToast({ message: '', show: false });
    }, 3000);
  };

  // 유닛 이동 경로 계산
  const calculateMovementPath = async (unit: Unit, targetTile: HexTile) => {
    try {
      // 자기 자신을 클릭한 경우 경로 초기화
      if (unit.location.q === targetTile.q && unit.location.r === targetTile.r) {
        setMovementPath([]);
        setPathCost(0);
        setCanCompletePath(false);
        return;
      }
      
      const { path, totalCost, possibleInTurn } = await gameService.calculatePath(
        unit.id, 
        targetTile.q, 
        targetTile.r
      );
      
      setMovementPath(path);
      setPathCost(totalCost);
      setCanCompletePath(possibleInTurn);
      
      if (!possibleInTurn) {
        showToast(`이동 비용(${totalCost})이 남은 이동력(${unit.movement})보다 큽니다.`, 'warning');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : '경로 계산 실패', 'error');
    }
  };
  
  // 유닛 이동 실행
  const executeMovement = async (unit: Unit, targetTile: HexTile) => {
    try {
      const { unit: updatedUnit } = await gameService.moveUnit(unit.id, targetTile.q, targetTile.r);
      
      onUnitMove(updatedUnit, targetTile.q, targetTile.r);
      setMovementPath([]);
      setPathCost(0);
      setCanCompletePath(false);
      
      // 맵 데이터 업데이트 (백엔드에서 변경된 정보 반영)
      const { hexagons } = await gameService.getMap();
      setMapData(hexagons);
      
      showToast('유닛 이동 완료', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '유닛 이동 실패', 'error');
    }
  };
  
  // 맵 확대/축소
  const handleZoomIn = () => {
    const newScale = Math.min(2, mapScale + 0.1);
    setMapScale(newScale);
  };
  
  const handleZoomOut = () => {
    const newScale = Math.max(0.5, mapScale - 0.1);
    setMapScale(newScale);
  };
  
  // 맵 중앙으로 이동
  const handleCenterMap = () => {
    if (!containerRef.current) return;
    setMapOffset({
      x: containerRef.current.clientWidth / 2,
      y: containerRef.current.clientHeight / 2
    });
  };
  
  // 선택한 타일로 맵 이동
  const handleCenterOnTile = (tile?: HexTile) => {
    if (!containerRef.current || !tile) return;
    
    const { pixelX, pixelY } = hexToPixel(tile.q, tile.r);
    const centerX = containerRef.current.clientWidth / 2;
    const centerY = containerRef.current.clientHeight / 2;
    
    setMapOffset({
      x: centerX - (pixelX - mapOffset.x),
      y: centerY - (pixelY - mapOffset.y)
    });
  };
  
  // 현재 선택 리셋
  const handleResetSelection = () => {
    setSelectedTile(null);
    setMovementPath([]);
    setPathCost(0);
    setCanCompletePath(false);
  };
  
  // 맵 새로고침 (서버에서 새로운 데이터 가져오기)
  const handleRefreshMap = async () => {
    try {
      setIsLoading(true);
      const { hexagons } = await gameService.getMap();
      setMapData(hexagons);
      
      showToast('맵 데이터가 갱신되었습니다.', 'success');
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '맵 데이터 로드 실패');
      setIsLoading(false);
      showToast('맵 갱신 실패', 'error');
    }
  };
  
  // 자연경관 유무에 따른 아이콘 색상 변경
  const isNaturalWonderDiscovered = (wonderId: string) => {
    const wonder = naturalWonders.find(w => w.id === wonderId);
    return wonder && wonder.discovered;
  };

  // 로딩 표시
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900">
        <div className="text-2xl text-blue-300">맵 로딩 중...</div>
      </div>
    );
  }

  // 에러 표시
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900">
        <div className="text-xl text-red-400">{error}</div>
        <button 
          onClick={handleRefreshMap}
          className="mt-4 bg-blue-600 px-4 py-2 rounded"
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
          title="맵 중앙으로"
        >
          <Home size={20} />
        </button>
        {selectedTile && (
          <button 
            onClick={() => handleCenterOnTile(selectedTile)}
            className="p-2 bg-slate-700 rounded hover:bg-slate-600"
            title="선택한 타일로 이동"
          >
            <Compass size={20} />
          </button>
        )}
        <button 
          onClick={handleResetSelection}
          className="p-2 bg-slate-700 rounded hover:bg-slate-600"
          title="선택 초기화"
        >
          <RotateCcw size={20} />
        </button>
        <button 
          onClick={handleRefreshMap}
          className="p-2 bg-slate-700 rounded hover:bg-slate-600"
          title="맵 새로고침"
        >
          <RefreshCw size={20} />
        </button>
      </div>
      
      {/* 자연경관 표시기 */}
      <div className="absolute top-4 left-4 bg-slate-800 bg-opacity-80 rounded-lg p-2 z-10">
        <div className="text-sm font-bold mb-1">자연경관</div>
        <div className="flex flex-col space-y-1">
          {naturalWonders.map(wonder => (
            <div 
              key={wonder.id} 
              className={cn(
                "flex items-center",
                wonder.discovered ? "text-yellow-300" : "text-gray-500"
              )}
              title={wonder.discovered ? wonder.name : "미발견 자연경관"}
            >
              <Star size={16} className="mr-1" />
              <span className="text-xs">
                {wonder.discovered ? wonder.name : "???"}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 타일 정보 패널 */}
      {hoveredTile && (
        <div className="absolute bottom-4 left-4 bg-slate-800 bg-opacity-80 rounded-lg p-2 z-10 max-w-xs">
          <div className="flex items-center text-sm font-bold mb-1">
            {hoveredTile.terrain === 'mountain' && <Mountain size={16} className="mr-1" />}
            {hoveredTile.terrain === 'forest' && <Trees size={16} className="mr-1" />}
            {hoveredTile.terrain === 'ocean' && <Droplet size={16} className="mr-1" />}
            {hoveredTile.terrain.includes('river') && <Droplet size={16} className="mr-1" />}
            <span className="capitalize">
              {hoveredTile.terrain} ({hoveredTile.q}, {hoveredTile.r})
            </span>
          </div>
          {hoveredTile.visibility === 'visible' && (
            <>
              {hoveredTile.resource && (
                <div className="text-xs mb-1">자원: {hoveredTile.resource}</div>
              )}
              {hoveredTile.naturalWonder && (
                <div className="text-xs mb-1 text-yellow-300">
                  자연경관: {hoveredTile.naturalWonder}
                </div>
              )}
              {hoveredTile.improvement && (
                <div className="text-xs mb-1">개선: {hoveredTile.improvement}</div>
              )}
              {hoveredTile.city && (
                <div className="text-xs mb-1">
                  도시: {hoveredTile.city.name} (인구: {hoveredTile.city.population})
                </div>
              )}
              {hoveredTile.unit && (
                <div className="text-xs mb-1">
                  유닛: {hoveredTile.unit.typeName}
                </div>
              )}
              <div className="text-xs mb-1">이동 비용: {hoveredTile.movementCost}</div>
              <div className="text-xs flex flex-wrap gap-1">
                {hoveredTile.yields.food > 0 && <span className="text-green-300">식량: {hoveredTile.yields.food}</span>}
                {hoveredTile.yields.production > 0 && <span className="text-red-300">생산: {hoveredTile.yields.production}</span>}
                {hoveredTile.yields.gold > 0 && <span className="text-yellow-300">골드: {hoveredTile.yields.gold}</span>}
                {hoveredTile.yields.science > 0 && <span className="text-blue-300">과학: {hoveredTile.yields.science}</span>}
                {hoveredTile.yields.culture > 0 && <span className="text-purple-300">문화: {hoveredTile.yields.culture}</span>}
                {hoveredTile.yields.faith > 0 && <span className="text-white">신앙: {hoveredTile.yields.faith}</span>}
              </div>
            </>
          )}
          {hoveredTile.visibility === 'fogOfWar' && (
            <div className="text-xs italic">안개 속 지형 (마지막 본 상태)</div>
          )}
          {hoveredTile.visibility === 'unexplored' && (
            <div className="text-xs italic">미탐험 지역</div>
          )}
        </div>
      )}
      
      {/* 선택된 타일 액션 패널 */}
      {selectedTile && selectedTile.visibility === 'visible' && (
        <div className="absolute bottom-4 right-4 bg-slate-800 bg-opacity-80 rounded-lg p-2 z-10">
          <div className="text-sm font-bold mb-2">행동</div>
          <div className="flex flex-wrap gap-2">
            {selectedUnit && (
              <button 
                className="px-3 py-1 bg-blue-600 rounded text-xs hover:bg-blue-500"
                onClick={() => handleCenterOnTile(selectedTile)}
              >
                이동 준비
              </button>
            )}
            {selectedTile.unit && (
              <>
                <button 
                  className="px-3 py-1 bg-green-600 rounded text-xs hover:bg-green-500"
                  onClick={() => onSelectTile(selectedTile)}
                >
                  유닛 선택
                </button>
                {selectedTile.unit.type === 'settler' && (
                  <button 
                    className="px-3 py-1 bg-yellow-600 rounded text-xs hover:bg-yellow-500"
                    onClick={() => gameService.commandUnit(selectedTile.unit!.id, 'found_city')
                      .then(() => handleRefreshMap())
                      .catch(err => showToast(err.message, 'error'))}
                  >
                    도시 건설
                  </button>
                )}
                {selectedTile.unit.type === 'worker' && (
                  <button 
                    className="px-3 py-1 bg-orange-600 rounded text-xs hover:bg-orange-500"
                    onClick={() => gameService.commandUnit(selectedTile.unit!.id, 'build_improvement')
                      .then(() => handleRefreshMap())
                      .catch(err => showToast(err.message, 'error'))}
                  >
                    개선시설 건설
                  </button>
                )}
              </>
            )}
            {selectedTile.city && (
              <button 
                className="px-3 py-1 bg-indigo-600 rounded text-xs hover:bg-indigo-500"
                onClick={() => onSelectTile(selectedTile)}
              >
                도시 관리
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* 맵 캔버스 */}
      <canvas
        ref={canvasRef}
        className={cn(
          "cursor-grab touch-none",
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
}