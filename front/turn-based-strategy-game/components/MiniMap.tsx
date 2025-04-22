'use client'

import React from 'react';
import { useGameStore } from '@/lib/store';
import { getTileColor } from '@/lib/utils';

interface MiniMapProps {
  width: number;
  height: number;
  onPositionClick: (q: number, r: number) => void;
  viewportPosition: { x: number, y: number };
  viewportScale: number;
}

const MiniMap: React.FC<MiniMapProps> = ({
  width,
  height,
  onPositionClick,
  viewportPosition,
  viewportScale
}) => {
  const { hexMap, units, cities } = useGameStore();
  
  // 맵의 경계 계산
  const mapBounds = React.useMemo(() => {
    if (hexMap.length === 0) return { minQ: -5, maxQ: 5, minR: -5, maxR: 5 };
    
    let minQ = Infinity;
    let maxQ = -Infinity;
    let minR = Infinity;
    let maxR = -Infinity;
    
    hexMap.forEach(tile => {
      minQ = Math.min(minQ, tile.q);
      maxQ = Math.max(maxQ, tile.q);
      minR = Math.min(minR, tile.r);
      maxR = Math.max(maxR, tile.r);
    });
    
    return { minQ, maxQ, minR, maxR };
  }, [hexMap]);
  
  // 맵 사이즈
  const mapWidth = mapBounds.maxQ - mapBounds.minQ + 1;
  const mapHeight = mapBounds.maxR - mapBounds.minR + 1;
  
  // 각 타일의 크기 계산
  const tileSize = Math.min(width / mapWidth, height / mapHeight) * 0.8; // 약간의 여백을 줌
  
  // 중앙 오프셋 계산
  const offsetX = (width - mapWidth * tileSize) / 2;
  const offsetY = (height - mapHeight * tileSize) / 2;
  
  // 타일의 캔버스 좌표 계산
  const getTilePosition = (q: number, r: number) => {
    // 큐브 좌표계를 화면 좌표계로 변환 (평평한 상단 육각형 레이아웃)
    const x = tileSize * (3/2 * q);
    const y = tileSize * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    
    return {
      x: offsetX + x - mapBounds.minQ * tileSize * 3/2,
      y: offsetY + y - (mapBounds.minR * tileSize * Math.sqrt(3) + mapBounds.minQ * tileSize * Math.sqrt(3)/2)
    };
  };
  
  // 클릭 위치를 타일 좌표로 변환
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 가장 가까운 타일 찾기
    let closestTile = null;
    let minDistance = Infinity;
    
    hexMap.forEach(tile => {
      const pos = getTilePosition(tile.q, tile.r);
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      
      if (distance < minDistance) {
        minDistance = distance;
        closestTile = tile;
      }
    });
    
    if (closestTile && minDistance < tileSize) {
      onPositionClick(closestTile.q, closestTile.r);
    }
  };
  
  // 캔버스 참조
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  // 미니맵 렌더링
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 캔버스 초기화
    ctx.clearRect(0, 0, width, height);
    
    // 배경 그리기
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(0, 0, width, height);
    
    // 모든 타일 그리기
    hexMap.forEach(tile => {
      const { x, y } = getTilePosition(tile.q, tile.r);
      
      // 육각형 그리기
      drawHexagon(ctx, x, y, tileSize * 0.9, getTileColor(tile.terrain));
      
      // 소유자 표시
      if (tile.owner) {
        const ownerColor = tile.owner === 'player' ? '#48bb78' : '#f56565';
        ctx.fillStyle = ownerColor;
        ctx.globalAlpha = 0.5;
        drawHexagon(ctx, x, y, tileSize * 0.5, ownerColor);
        ctx.globalAlpha = 1.0;
      }
    });
    
    // 도시 표시
    cities.forEach(city => {
      const { x, y } = getTilePosition(city.position.q, city.position.r);
      
      ctx.fillStyle = city.owner === 'player' ? '#ffffff' : '#f6ad55';
      ctx.beginPath();
      ctx.arc(x, y, tileSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // 유닛 표시
    units.forEach(unit => {
      const { x, y } = getTilePosition(unit.position.q, unit.position.r);
      
      ctx.fillStyle = unit.owner === 'player' ? '#4299e1' : '#f56565';
      ctx.beginPath();
      ctx.arc(x, y, tileSize * 0.25, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // 현재 뷰포트 영역 표시
    const viewportWidth = width / viewportScale;
    const viewportHeight = height / viewportScale;
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      width / 2 - viewportWidth / 2 + viewportPosition.x,
      height / 2 - viewportHeight / 2 + viewportPosition.y,
      viewportWidth,
      viewportHeight
    );
    
  }, [hexMap, units, cities, mapBounds, width, height, viewportPosition, viewportScale]);
  
  // 육각형 그리기 함수
  const drawHexagon = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    fillColor: string
  ) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = 2 * Math.PI / 6 * i;
      const hx = x + size * Math.cos(angle);
      const hy = y + size * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(hx, hy);
      } else {
        ctx.lineTo(hx, hy);
      }
    }
    ctx.closePath();
    
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  };
  
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleClick}
        className="rounded-lg shadow-md cursor-pointer"
      />
      <div className="absolute bottom-1 right-1 text-xs text-white bg-gray-800 bg-opacity-70 px-1 rounded">
        미니맵
      </div>
    </div>
  );
};

export default MiniMap;