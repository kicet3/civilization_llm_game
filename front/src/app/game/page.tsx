"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { HexGrid, Layout, Hexagon, Text, GridGenerator } from 'react-hexgrid';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Menu, MessageSquare, Settings, Map, Book, 
  Beaker, Users, Sword, Award, ChevronUp, 
  ChevronDown, User, PanelLeft, Send, 
  ZoomIn, ZoomOut, Move, Home 
} from 'lucide-react';
import {  
  Mountain, Trees, Waves, Globe, Sun, Leaf, 
  Tent, Compass, Anchor 
} from 'lucide-react';

import { createNoise2D } from 'simplex-noise';
import seedrandom from 'seedrandom';
import { useSearchParams } from 'next/navigation';
import TurnManager from './TurnManager';

interface Hexagon {
  q: number;
  r: number;
  s: number;
  terrain: string;
  resource?: string | null;
  city?: { name: string; population: number } | null;
  unit?: string | null;
}

interface Resource {
  food: number;
  production: number;
  gold: number;
  science: number;
  culture: number;
  faith: number;
}

export interface City {
  id: number;
  name: string;
  population: number;
  production: string;
  turnsLeft: number;
  food?: number;
  gold?: number;
  science?: number;
  culture?: number;
  faith?: number;
  happiness?: number;
  hp?: number;
  defense?: number;
  garrisonedUnit?: string;
  productionQueue?: { name: string; turnsLeft: number }[];
  foodToNextPop?: number;
  cultureToNextBorder?: number;
}


interface LogEntry {
  type: 'system' | 'advisor' | 'event' | 'player';
  content: string;
  turn: number;
}

interface InfoPanel {
  open: boolean;
  type: 'tile' | null;
  data: Hexagon | null;
}

// ResourceBar: Top resource display
function ResourceBar({ resources }: { resources: Resource }) {
  const icons = [
    { color: 'bg-yellow-400', value: resources.food },
    { color: 'bg-red-500', value: resources.production },
    { color: 'bg-yellow-600', value: resources.gold },
    { color: 'bg-blue-500', value: resources.science },
    { color: 'bg-purple-500', value: resources.culture },
    { color: 'bg-white', value: resources.faith },
  ];
  return (
    <div className="bg-slate-800 p-1 flex justify-center space-x-6 text-sm border-b border-slate-700">
      {icons.map((icon, idx) => (
        <div key={idx} className="flex items-center">
          <div className={`w-4 h-4 ${icon.color} rounded-full mr-1`}></div>
          <span>{icon.value}</span>
        </div>
      ))}
    </div>
  );
}




// TabNavigation: Left tab bar
function TabNavigation({ selectedTab, setSelectedTab }: { selectedTab: string, setSelectedTab: (tab: string) => void }) {
  const tabs = [
    { key: 'map', icon: <Map size={24} /> },
    { key: 'cities', icon: <Book size={24} /> },
    { key: 'research', icon: <Beaker size={24} /> },
    { key: 'units', icon: <Sword size={24} /> },
    { key: 'diplomacy', icon: <Users size={24} /> },    // 외교
    { key: 'religion', icon: <Award size={24} /> },     // 종교
    { key: 'policy', icon: <Tent size={24} /> },        // 사회정책
    { key: 'turn', icon: <ChevronUp size={24} /> },     // 턴 관리
  ];
  return (
    <div className="w-16 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-4">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={cn(
            "w-12 h-12 mb-4 rounded-lg flex items-center justify-center",
            selectedTab === tab.key ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'
          )}
          onClick={() => setSelectedTab(tab.key)}
        >
          {tab.icon}
        </button>
      ))}
    </div>
  );
}

// MapPanel: Map display
function MapPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = 1600;
  const height = 1200;
  const cell = 40; // 타일 크기(px) - 스케일 확대
  const cols = Math.floor(width / cell);
  const rows = Math.floor(height / cell);

  // 도시 이름 샘플
  const cityNames = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "수원", "창원", "고양", "용인", "성남", "청주", "전주", "천안", "안산", "안양", "남양주", "포항", "의정부", "김해", "평택", "구미", "진주", "원주", "아산", "경산", "거제", "양산", "춘천", "제주"];
  // 플레이어 색상 샘플
  const playerColors = ["#e53935", "#3949ab", "#43a047", "#fbc02d", "#8e24aa", "#00838f", "#6d4c41"];

  // 지도 이동(패닝) 상태
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  // 매 게임마다 랜덤 seed로 노이즈 인스턴스 생성
  const [seed, setSeed] = React.useState(() => `${Date.now()}-${Math.random()}`);
  const noise2D = useRef(createNoise2D(seedrandom(seed))).current;


  // 강 경로 생성 (맵 중앙에서 한 줄기)
  const riverPath = React.useMemo(() => {
    // 맵의 5분의 1 이상이 river가 되도록 충분히 긴 강줄기(들) 생성
    const totalTiles = rows * cols;
    const targetRiverTiles = Math.floor(totalTiles / 8); // 12.5% (8분의 1)
    const riverSet = new Set<string>();
    // 반복적으로 강줄기를 이어붙임
    // 맵을 4~6개 구역(grid)으로 나누고, 각 구역마다 수원지 1개씩 배치
    const gridCols = 2 + Math.floor(Math.random() * 2); // 2~3
    const gridRows = 2 + Math.floor(Math.random() * 2); // 2~3
    const grids: [number, number][] = [];
    for (let gx = 0; gx < gridCols; gx++) {
      for (let gy = 0; gy < gridRows; gy++) {
        // 각 구역의 범위 내에서 랜덤한 수원지
        const x = Math.floor((gx + Math.random()) * cols / gridCols);
        const y = Math.floor((gy + Math.random()) * rows / gridRows);
        grids.push([x, y]);
      }
    }
    let gridIdx = 0;
    while (riverSet.size < targetRiverTiles) {
      let localPath: [number, number][] = [];
      // 골고루 분포된 수원지에서 시작
      let [x, y] = grids[gridIdx % grids.length];
      gridIdx++;
      // 이미 river인 곳이면 새 위치 찾기 (최대 10회)
      let attempts = 0;
      while (riverSet.has(`${x},${y}`) && attempts < 10) {
        const g = grids[Math.floor(Math.random() * grids.length)];
        x = g[0]; y = g[1];
        attempts++;
      }
      localPath.push([x, y]);
      riverSet.add(`${x},${y}`);
      const maxLen = Math.floor(rows * cols * 0.18); // 한 줄기 최대 길이(전체의 18%까지 허용)
      let prevDir: [number, number] = [0, 1];
      for (let i = 0; i < maxLen; i++) {
        // 직전 방향 유지, 15% 확률로만 방향 틀기
        let dir: [number, number];
        if (i === 0) {
          dir = Math.random() < 0.5 ? [0, 1] : [1, 1];
        } else {
          const prev = localPath[localPath.length - 1];
          prevDir = [prev[0] - (localPath[localPath.length - 2]?.[0] ?? x), prev[1] - (localPath[localPath.length - 2]?.[1] ?? y)];
          const possibleDirs: [number, number][] = [prevDir, [prevDir[0]+1, prevDir[1]], [prevDir[0]-1, prevDir[1]], [prevDir[0], prevDir[1]+1], [prevDir[0], prevDir[1]-1]];
          dir = possibleDirs[Math.random() < 0.85 ? 0 : Math.floor(Math.random() * possibleDirs.length)];
          if (dir[0] === 0 && dir[1] === 0) dir = [0, 1];
        }
        x += dir[0];
        y += dir[1];
        // 경계에서 너무 일찍 끊기지 않게, 5% 확률로 경계 무시하고 한 칸 더 진행
        if ((x < 1 || x > cols - 2 || y < 1 || y > rows - 2) && Math.random() > 0.05) break;
        const key = `${x},${y}`;
        if (riverSet.has(key)) continue;
        localPath.push([x, y]);
        riverSet.add(key);
        // riverSet이 이미 목표량을 채우면 즉시 종료
        if (riverSet.size >= targetRiverTiles) break;
      }
    }
    // Set을 [number, number][]로 변환
    return Array.from(riverSet).map(str => str.split(",").map(Number) as [number, number]);
  }, [cols, rows, seed]);

  // 도시 배치(노이즈 기반 규칙적)
  const cities = React.useMemo(() => {
    const arr: any[] = [];
    let cityIdx = 0;
    // 맵 전체에 고르게 분포하도록 x, y offset과 스케일 조정
    for (let y = 2; y < rows - 2; y += 3) {
      for (let x = 2 + (y % 6 === 0 ? 2 : 0); x < cols - 2; x += 6) {
        const noise = noise2D((x + 20) / 50, (y + 30) / 50);
        const terrain = getTerrain(noise, x, y);
        if (noise > -0.25 && cityIdx < cityNames.length && terrain !== 'river') {
          const name = cityNames[cityIdx % cityNames.length];
          const isCapital = cityIdx === 0;
          const playerId = cityIdx % playerColors.length;
          arr.push({ x, y, name, isCapital, playerId, prod: ["도서관", "시장", "병영"][cityIdx % 3], prodTurns: 2 + (cityIdx % 4), size: 1.1 + Math.abs(noise) * 1.5 });
          cityIdx++;
        }
      }
    }
    return arr;
  }, [rows, cols, noise2D, seed]);



  // 지형 타입 결정 함수
  function getTerrain(noise: number, x?: number, y?: number): string {
    // riverPath에 포함된 좌표면 river
    if (typeof x === 'number' && typeof y === 'number') {
      for (const [rx, ry] of riverPath) {
        if (Math.abs(rx - x) <= 0 && Math.abs(ry - y) <= 0) return 'river';
      }
    }
    if (noise < -0.92) return 'beach';
    if (noise < 0.45) return 'plains';
    if (noise < 0.7) return 'forest';
    return 'mountain';
  }
  // 색상 매핑
  function getColor(terrain: string): string {
    switch (terrain) {
      case 'river': return '#2176ae'; // 강: 파란색
      case 'beach': return '#ffe066';
      case 'plains': return '#8bc34a';
      case 'forest': return '#388e3c';
      case 'mountain': return '#b0bec5';
      default: return '#222';
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const hexHeight = cell;
    const hexWidth = Math.sqrt(3) / 2 * hexHeight;
    const hexVert = hexHeight * 0.75;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // 육각형 중심 좌표 계산 (이동 오프셋 반영)
        const cx = x * hexWidth + ((y % 2) * hexWidth) / 2 + hexWidth / 2 + offset.x;
        const cy = y * hexVert + hexHeight / 2 + offset.y;
        // 섬 형태를 위해 중심부로 갈수록 육지 확률 증가
        const nx = (x / cols - 0.5) * 2;
        const ny = (y / rows - 0.5) * 2;
        const dist = Math.sqrt(nx * nx + ny * ny);
        // 노이즈 값 (섬 모양 강조)
        let noise = noise2D(x / 80, y / 80) - dist * 0.7;
        const terrain = getTerrain(noise, x, y);
        // --- 육각형 그리기 ---
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = Math.PI / 3 * i;
          const px = cx + Math.cos(angle) * hexWidth / 2;
          const py = cy + Math.sin(angle) * hexHeight / 2;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = getColor(terrain);
        ctx.fill();
        // --- 오버레이: 타일 경계선 ---
        ctx.strokeStyle = 'rgba(80,80,80,0.35)';
        ctx.lineWidth = 0.7;
        ctx.stroke();
        // --- 오버레이: 랜덤 도시/유닛/자원 ---
        // 도시: 육지(평야/숲/산)에서만, 2% 확률
        if ((terrain === 'plains' || terrain === 'forest' || terrain === 'mountain') && Math.abs(noise * 1000) % 50 === 0) {
          ctx.beginPath();
          ctx.arc(cx, cy, hexWidth/3, 0, 2*Math.PI);
          ctx.fillStyle = '#b388ff';
          ctx.globalAlpha = 0.8;
          ctx.fill();
          ctx.globalAlpha = 1.0;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        // 유닛: 육지에서만, 2% 확률
        if ((terrain === 'plains' || terrain === 'forest') && Math.abs(noise * 1000) % 49 === 0) {
          ctx.beginPath();
          ctx.moveTo(cx, cy - hexHeight/3 + 4);
          ctx.lineTo(cx - hexWidth/3 + 2, cy + hexHeight/4 - 2);
          ctx.lineTo(cx + hexWidth/3 - 2, cy + hexHeight/4 - 2);
          ctx.closePath();
          ctx.fillStyle = '#ff7043';
          ctx.globalAlpha = 0.9;
          ctx.fill();
          ctx.globalAlpha = 1.0;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        // 자원: 바다/육지 모두, 1.5% 확률
        if (Math.abs(noise * 1000) % 67 === 0) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(Math.PI/10);
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * (hexWidth/2.3),
                       -Math.sin((18 + i * 72) / 180 * Math.PI) * (hexWidth/2.3));
            ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * (hexWidth/4),
                       -Math.sin((54 + i * 72) / 180 * Math.PI) * (hexWidth/4));
          }
          ctx.closePath();
          ctx.fillStyle = '#ffd600';
          ctx.globalAlpha = 0.9;
          ctx.fill();
          ctx.globalAlpha = 1.0;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.restore();
        }
        // 도시 시각화
        for (let city of cities) {
          if (city.x === x && city.y === y) {
            ctx.beginPath();
            ctx.arc(cx, cy, hexWidth/3, 0, 2*Math.PI);
            ctx.fillStyle = playerColors[city.playerId];
            ctx.globalAlpha = 0.8;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            // 도시 이름
            ctx.font = '12px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(city.name, cx, cy + hexHeight/3);
            // 생산 텍스트
            ctx.font = '10px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(city.prod, cx, cy + hexHeight/3 + 15);
            // 수도 강조
            if (city.isCapital) {
              ctx.beginPath();
              ctx.arc(cx, cy, hexWidth/3 + 2, 0, 2*Math.PI);
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 2;
          }
        }
      }
      // 국경선
      if (terrain === 'plains' || terrain === 'forest' || terrain === 'mountain') {
        ctx.beginPath();
        ctx.moveTo(cx - hexWidth/2, cy);
        ctx.lineTo(cx + hexWidth/2, cy);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // 지형 패턴
      if (terrain === 'plains') {
        ctx.beginPath();
        ctx.moveTo(cx - hexWidth/4, cy - hexHeight/4);
        ctx.lineTo(cx + hexWidth/4, cy - hexHeight/4);
        ctx.lineTo(cx + hexWidth/4, cy + hexHeight/4);
        ctx.lineTo(cx - hexWidth/4, cy + hexHeight/4);
        ctx.closePath();
        ctx.fillStyle = '#8bc34a';
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      } else if (terrain === 'forest') {
        ctx.beginPath();
        ctx.moveTo(cx - hexWidth/4, cy - hexHeight/4);
        ctx.lineTo(cx + hexWidth/4, cy - hexHeight/4);
        ctx.lineTo(cx + hexWidth/4, cy + hexHeight/4);
        ctx.lineTo(cx - hexWidth/4, cy + hexHeight/4);
        ctx.closePath();
        ctx.fillStyle = '#388e3c';
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      } else if (terrain === 'mountain') {
        ctx.beginPath();
        ctx.moveTo(cx - hexWidth/4, cy - hexHeight/4);
        ctx.lineTo(cx + hexWidth/4, cy - hexHeight/4);
        ctx.lineTo(cx + hexWidth/4, cy + hexHeight/4);
        ctx.lineTo(cx - hexWidth/4, cy + hexHeight/4);
        ctx.closePath();
        ctx.fillStyle = '#b0bec5';
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      } else if (terrain === 'river') {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = '#2176ae';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - hexWidth/3, cy - hexHeight/4);
        ctx.bezierCurveTo(cx, cy - hexHeight/8, cx, cy + hexHeight/8, cx + hexWidth/3, cy + hexHeight/4);
        ctx.stroke();
        ctx.restore();
        } else if (terrain === 'mountain') {
          ctx.beginPath();
          ctx.moveTo(cx - hexWidth/4, cy - hexHeight/4);
          ctx.lineTo(cx + hexWidth/4, cy - hexHeight/4);
          ctx.lineTo(cx + hexWidth/4, cy + hexHeight/4);
          ctx.lineTo(cx - hexWidth/4, cy + hexHeight/4);
          ctx.closePath();
          ctx.fillStyle = '#b0bec5';
          ctx.globalAlpha = 0.5;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }
    }
  }, [canvasRef, noise2D, rows, cols, cell, getColor, getTerrain, offset, cities]);

  // 키보드 이동 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'W'].includes(e.key)) setOffset(o => ({ ...o, y: o.y + cell }));
      if (['ArrowDown', 's', 'S'].includes(e.key)) setOffset(o => ({ ...o, y: o.y - cell }));
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) setOffset(o => ({ ...o, x: o.x + cell }));
      if (['ArrowRight', 'd', 'D'].includes(e.key)) setOffset(o => ({ ...o, x: o.x - cell }));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cell]);

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ border: '2px solid #222', background: '#111', cursor: 'grab' }}
        tabIndex={0}
      />
    </div>
  );
}
import CityManagementPanel from "./CityManagementPanel";
import ResearchPanel from "./research-management/ResearchPanel";

// ResearchPanel: Research tab

import UnitPanel from "./unit-management/UnitPanel";
import DiplomacyPanel from "./diplomacy-management/DiplomacyPanel";
import ReligionPanel from "./religion-management/ReligionPanel";
import PolicyPanel from "./policy-management/PolicyPanel";
// UnitsPanel: Units tab
function UnitsPanel() {
  return (
    <div className="p-4 h-full overflow-auto">
      <h3 className="text-xl font-bold mb-4">유닛</h3>
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-bold">정착민</h4>
            <span className="text-sm px-2 py-1 bg-blue-900 rounded-full">민간 유닛</span>
          </div>
          <div className="text-gray-300 text-sm mb-3">
            <p>위치: 수도 인근</p>
            <p>이동력: 2/2</p>
          </div>
          <div className="flex space-x-2">
            <button className="bg-blue-600 px-3 py-1 rounded text-sm">이동</button>
            <button className="bg-green-600 px-3 py-1 rounded text-sm">도시 건설</button>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-bold">전사</h4>
            <span className="text-sm px-2 py-1 bg-red-900 rounded-full">군사 유닛</span>
          </div>
          <div className="text-gray-300 text-sm mb-3">
            <p>위치: 수도</p>
            <p>이동력: 2/2</p>
            <p>체력: 20/20</p>
          </div>
          <div className="flex space-x-2">
            <button className="bg-blue-600 px-3 py-1 rounded text-sm">이동</button>
            <button className="bg-red-600 px-3 py-1 rounded text-sm">경계</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// InfoPanel: Tile/city/unit info
function InfoPanelComponent({ infoPanel, setInfoPanel }: { infoPanel: InfoPanel, setInfoPanel: any }) {
  if (!infoPanel.open || !infoPanel.data) return null;
  return (
    <div className="bg-slate-700 p-3 rounded">
      <div className="flex justify-between mb-2">
        <h4 className="font-bold">타일 정보</h4>
        <button onClick={() => setInfoPanel({ open: false, type: null, data: null })}>✕</button>
      </div>
      <div className="text-sm space-y-1">
        <p>위치: ({infoPanel.data.q}, {infoPanel.data.r})</p>
        <p>지형: {infoPanel.data.terrain}</p>
        {infoPanel.data.resource && <p>자원: {infoPanel.data.resource}</p>}
        {infoPanel.data.city && <p>도시: {infoPanel.data.city.name} (인구: {infoPanel.data.city.population})</p>}
        {infoPanel.data.unit && <p>유닛: {infoPanel.data.unit}</p>}
      </div>
      {infoPanel.data.unit && (
        <div className="mt-3 space-x-2">
          <button className="bg-blue-600 text-xs px-2 py-1 rounded">이동</button>
          {infoPanel.data.unit === 'settler' && (
            <button className="bg-green-600 text-xs px-2 py-1 rounded">도시 건설</button>
          )}
        </div>
      )}
    </div>
  );
}

// LogPanel: Game log and command input
function LogPanel({ log, infoPanel, setInfoPanel, commandInput, setCommandInput, handleCommand }: any) {
  return (
    <div className="h-full bg-slate-800 border-t border-slate-700 flex">
      {/* 로그 영역 */}
      <div className="flex-1 p-3 flex flex-col-reverse h-full">
        <div className="space-y-3 h-full max-h-[40vh] overflow-y-auto flex flex-col-reverse">
          {log.slice().reverse().map((entry: LogEntry, idx: number) => (
            <div key={idx} className={cn(
              "p-2 rounded",
              entry.type === 'system' ? 'bg-slate-700 text-gray-300' :
              entry.type === 'advisor' ? 'bg-indigo-900' :
              entry.type === 'event' ? 'bg-amber-900' : 'bg-slate-600'
            )}>
              <div className="flex items-start">
                <div className="text-sm">
                  {entry.type === 'system' && '시스템: '}
                  {entry.type === 'advisor' && '조언자: '}
                  {entry.type === 'event' && '이벤트: '}
                  {entry.type === 'player' && '명령: '}
                  {entry.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* 명령 입력 영역 */}
      <div className="w-1/3 border-l border-slate-700 p-3 flex flex-col">
        <div className="flex-1 overflow-auto mb-3">
          <InfoPanelComponent infoPanel={infoPanel} setInfoPanel={setInfoPanel} />
        </div>
        <form onSubmit={handleCommand} className="flex">
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="명령을 입력하세요..."
            className="flex-1 bg-slate-700 rounded-l p-2 focus:outline-none"
          />
          <button 
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 px-4 rounded-r flex items-center"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function GamePage() {
  const searchParams = useSearchParams();
  const mapType = searchParams.get('map') || undefined; // 쿼리에서 map 파라미터 추출
  const router = useRouter();
  
  // 상태 관리
  const [turn, setTurn] = useState<number>(1);
  const [year, setYear] = useState<number>(-4000);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<string>('map');
  const [selectedHex, setSelectedHex] = useState<Hexagon | null>(null);
  const [resources, setResources] = useState<Resource>({
    food: 12,
    production: 8,
    gold: 50,
    science: 3,
    culture: 2,
    faith: 1
  });
  const [cities, setCities] = useState<City[]>([
    { id: 1, name: '수도', population: 3, production: '정착민', turnsLeft: 2 }
  ]);
  const [log, setLog] = useState<LogEntry[]>([
    { type: 'system', content: '게임이 시작되었습니다.', turn: 1 },
    { type: 'advisor', content: '새로운 문명의 지도자님, 환영합니다! 이제 우리는 새로운 문명을 건설하여 역사에 이름을 남길 것입니다.', turn: 1 },
    { type: 'advisor', content: '우선 정착민을 생산하여 새로운 도시를 건설하는 것이 좋을 것 같습니다.', turn: 1 }
  ]);
  const [commandInput, setCommandInput] = useState<string>('');
  const [infoPanel, setInfoPanel] = useState<InfoPanel>({ 
    open: false, 
    type: null, 
    data: null 
  });
  const [isHexGridLoaded, setIsHexGridLoaded] = useState(false);
  const [hexGridError, setHexGridError] = useState<Error | null>(null);
  const addLog = useCallback((type: LogEntry['type'], content: string, turn: number) => {
    setLog(prev => [...prev, { type, content, turn }]);
  }, []);
  // 초기 로딩 및 라이브러리 로드 확인
  useEffect(() => {
    // 초기 데이터 로딩 시뮬레이션
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // HexGrid 라이브러리 로드 확인
    if (typeof window !== 'undefined') {
      setIsHexGridLoaded(true);
    }

    return () => {
      clearTimeout(loadTimer);
    };
  }, []);

  // 맵 설정
  const mapSize = useMemo(() => ({ width: 15, height: 12 }), []);
  
  // 성능 최적화된 hexagons 생성 로직
  const hexagons = useMemo(() => {
    // 지도 유형별 지형 분포를 달리 생성
    const type = mapType || 'Continents';
    const generatedHexagons = GridGenerator.hexagon(12);
    // 랜덤 시드를 위해 Date.now() + mapType
    const seed = `${Date.now()}-${type}`;
    const noise2D = createNoise2D(seedrandom(seed));
    // 중심 좌표
    const centerQ = 0;
    const centerR = 0;
    // 도넛형 중앙 반지름
    const donutRadius = 5;
    return generatedHexagons.map(hex => {
      const { q, r, s } = hex;
      // noise 좌표 변환
      const nx = (q + 20) / 18;
      const ny = (r + 20) / 18;
      const noise = noise2D(nx, ny);
      let terrain = 'plains';
      // 지도 유형별 분기
      switch (type) {
        case 'Pangaea':
          terrain = Math.abs(q) + Math.abs(r) < 10 ? (noise > 0.3 ? 'forest' : 'grassland') : (noise > 0.2 ? 'hills' : 'ocean');
          break;
        case 'Fractal':
          terrain = noise > 0.5 ? 'mountain' : noise > 0.2 ? 'forest' : noise > -0.1 ? 'plains' : 'ocean';
          break;
        case 'SmallContinents':
          terrain = (Math.abs(q) % 8 < 5 && Math.abs(r) % 8 < 5 && noise > -0.2) ? (noise > 0.3 ? 'grassland' : 'plains') : 'ocean';
          break;
        case 'Terra':
          // 왼쪽(구대륙)은 육지, 오른쪽(신대륙)은 바다 많음
          terrain = q < 0 ? (noise > 0.2 ? 'grassland' : 'forest') : (noise > 0.5 ? 'plains' : 'ocean');
          break;
        case 'TiltedAxis':
          terrain = Math.abs(r) < 6 ? (noise > 0.2 ? 'grassland' : 'plains') : (noise > 0.4 ? 'forest' : 'ocean');
          break;
        case 'InlandSea':
          terrain = Math.sqrt(q * q + r * r) < 5 ? 'ocean' : (noise > 0.2 ? 'grassland' : 'plains');
          break;
        case 'Shuffle': {
          // 임의로 다른 타입 중 하나를 선택
          const types = ['Continents', 'Pangaea', 'Archipelago', 'Fractal', 'SmallContinents', 'Terra', 'TiltedAxis', 'InlandSea', 'Donut'];
          const pick = types[Math.floor(Math.abs(noise) * types.length) % types.length];
          // 재귀적으로 분기
          return { ...hex, ...((() => {
            switch (pick) {
              case 'Pangaea':
                return { terrain: Math.abs(q) + Math.abs(r) < 10 ? (noise > 0.3 ? 'forest' : 'grassland') : (noise > 0.2 ? 'hills' : 'ocean') };
              case 'Archipelago':
                return { terrain: noise > 0.55 ? 'grassland' : noise > 0.45 ? 'forest' : noise > 0.35 ? 'hills' : 'ocean' };
              case 'Fractal':
                return { terrain: noise > 0.5 ? 'mountain' : noise > 0.2 ? 'forest' : noise > -0.1 ? 'plains' : 'ocean' };
              case 'SmallContinents':
                return { terrain: (Math.abs(q) % 8 < 5 && Math.abs(r) % 8 < 5 && noise > -0.2) ? (noise > 0.3 ? 'grassland' : 'plains') : 'ocean' };
              case 'Terra':
                return { terrain: q < 0 ? (noise > 0.2 ? 'grassland' : 'forest') : (noise > 0.5 ? 'plains' : 'ocean') };
              case 'TiltedAxis':
                return { terrain: Math.abs(r) < 6 ? (noise > 0.2 ? 'grassland' : 'plains') : (noise > 0.4 ? 'forest' : 'ocean') };
              case 'InlandSea':
                return { terrain: Math.sqrt(q * q + r * r) < 5 ? 'ocean' : (noise > 0.2 ? 'grassland' : 'plains') };
              case 'Donut':
                return { terrain: (Math.sqrt(q * q + r * r) > donutRadius && Math.sqrt(q * q + r * r) < 10) ? (noise > 0.1 ? 'plains' : 'forest') : 'ocean' };
              default:
                return { terrain: noise > 0.3 ? 'grassland' : noise > 0 ? 'plains' : noise > -0.3 ? 'hills' : 'ocean' };
            }
          })()) };
        }
      }
      return {
        ...hex,
        terrain,
        resource: Math.random() < 0.1 
          ? ['iron', 'horses', 'wheat', 'cattle', 'deer', 'gold'][
              Math.floor(Math.random() * 6)
            ]
          : null,
        city: Math.random() < 0.05 ? { name: '도시', population: 3 } : null,
        unit: Math.random() < 0.05 ? 'settler' : null
      };
    });
  }, [mapType]);
  
  const getHexColor = useCallback((terrain: string) => {
    switch (terrain) {
      case 'grassland': return '#2ecc71';  // 밝은 녹색
      case 'plains': return '#f1c40f';     // 노란색
      case 'desert': return '#f39c12';     // 주황색
      case 'mountain': return '#7f8c8d';   // 회색
      case 'ocean': return '#3498db';      // 파란색
      case 'forest': return '#27ae60';     // 진한 녹색
      case 'hills': return '#2ecc71';      // 밝은 녹색
      default: return '#34495e';           // 어두운 회색
    }
  }, []);

  // 육각형 클릭 핸들러
  const handleHexClick = useCallback((hex: Hexagon) => {
    setSelectedHex(hex);
    setInfoPanel({ 
      open: true, 
      type: 'tile', 
      data: hex 
    });
  }, []);

  // 턴 진행
  const nextTurn = useCallback(() => {
    const newTurn = turn + 1;
    setTurn(newTurn);
    
    // 연도 진행 (고대: 턴당 40년, 후반부로 갈수록 감소)
    const newYear = year + (year < 0 ? 40 : 20);
    setYear(newYear);
    
    // 새 로그 추가
    addLog('system', `턴 ${newTurn}이 시작되었습니다.`, newTurn);
    
    // 랜덤 이벤트 (20% 확률)
    if (Math.random() < 0.2) {
      const events = [
        '야만인 캠프가 발견되었습니다.',
        '당신의 탐험대가 자연경이를 발견했습니다!',
        '시민들이 당신의 통치를 칭송합니다.',
        '폭풍이 몰아치며 일부 타일의 생산량이 감소했습니다.',
        '인근 도시국가가 사절을 보냈습니다.'
      ];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      addLog('event', randomEvent, newTurn);
    }
    
    // 자원 업데이트 (간단한 증가)
    setResources(prev => ({
      food: prev.food + 5,
      production: prev.production + 4,
      gold: prev.gold + 6,
      science: prev.science + 2,
      culture: prev.culture + 1,
      faith: prev.faith + 1
    }));
  }, [turn, year, addLog]);

  // 게임 로그 추가
  

  // 명령어 처리
  const handleCommand = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    
    // 사용자 메시지 로그 추가
    addLog('player', commandInput, turn);
    
    // 간단한 명령어 처리 로직
    const command = commandInput.toLowerCase();
    
    if (command.includes('턴') || command.includes('다음')) {
      nextTurn();
      addLog('system', '다음 턴으로 진행합니다.', turn);
    } else if (command.includes('도시') && command.includes('정보')) {
      addLog('advisor', '현재 당신의 도시는 총 1개입니다. 수도(인구: 3)는 현재 정착민을 2턴 남겨두고 생산 중입니다.', turn);
    } else if (command.includes('자원')) {
      addLog('advisor', `현재 보유 자원: 식량 ${resources.food}, 생산력 ${resources.production}, 금 ${resources.gold}, 과학 ${resources.science}, 문화 ${resources.culture}, 신앙 ${resources.faith}`, turn);
    } else if (command.includes('도움말') || command.includes('명령어')) {
      addLog('advisor', '가능한 명령어: "다음 턴", "도시 정보", "자원 정보", "유닛 이동", "건설 [건물명]", "연구 [기술명]"', turn);
    } else {
      // LLM 응답 시뮬레이션
      setTimeout(() => {
        const responses = [
          '당신의 명령을 수행하겠습니다.',
          '좋은 전략적 선택입니다.',
          '흥미로운 접근 방식이군요.',
          '그렇게 하겠습니다. 다른 명령이 있으신가요?',
          '알겠습니다. 다음 턴에 결과가 반영될 것입니다.'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addLog('advisor', randomResponse, turn);
      }, 500);
    }
    
    setCommandInput('');
  }, [commandInput, turn, resources, addLog, nextTurn]);

  // 로딩 중 화면
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">게임 로딩 중...</div>
      </div>
    );
  }

  // 탭 컨텐츠 렌더링 (modularized)
  let tabContent;
  if (selectedTab === 'map') {
    tabContent = <MapPanel hexagons={hexagons} getHexColor={getHexColor} handleHexClick={handleHexClick} selectedHex={selectedHex} />;
  } else if (selectedTab === 'cities') {
    tabContent = <CityManagementPanel cities={cities} />;
  } else if (selectedTab === 'research') {
    tabContent = <ResearchPanel />;
  } else if (selectedTab === 'units') {
    tabContent = <UnitPanel />;
  } else if (selectedTab === 'diplomacy') {
    tabContent = <DiplomacyPanel />;
  } else if (selectedTab === 'religion') {
    tabContent = <ReligionPanel />;
  } else if (selectedTab === 'policy') {
    tabContent = <PolicyPanel />;
  } else {
    tabContent = <div>선택된 탭이 없습니다</div>;
  }

  return (
    
      <div className="min-h-screen bg-slate-900 text-white flex flex-col">
        {/* 상단 네비게이션 */}
        <nav className="bg-slate-800 p-2 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center">
            <Menu className="mr-2" size={24} />
            <span className="font-bold text-lg">텍스트 문명</span>
          </div>
          <div className="flex space-x-6">
            <div className="flex items-center">
              <span className="font-bold">턴: {turn}</span>
            </div>
            <div className="flex items-center">
              <span>{year < 0 ? `BC ${Math.abs(year)}` : `AD ${year}`}</span>
            </div>
            <button 
              onClick={nextTurn}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-1 rounded font-bold"
            >
              다음 턴
            </button>
          </div>
          <div className="flex items-center">
            <Settings className="ml-2" size={20} />
          </div>
        </nav>
        <div className="h-full flex-1 flex flex-row">
          <TabNavigation selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
          <div className="h-full flex-1 flex flex-col overflow-hidden">
            {/* 상단 바/정보 패널 등 */}
            <div className="flex-1 flex overflow-hidden">
              {selectedTab === "map" && <MapPanel hexagons={hexagons} getHexColor={getHexColor} handleHexClick={handleHexClick} selectedHex={selectedHex} />}
              {selectedTab === "cities" && <CityManagementPanel cities={cities} />}
              {selectedTab === "research" && <ResearchPanel />}
              {selectedTab === "units" && <UnitPanel />}
              {selectedTab === "diplomacy" && <DiplomacyPanel />}
              {selectedTab === "religion" && <ReligionPanel />}
              {selectedTab === "policy" && <PolicyPanel />}
              {selectedTab === "turn" && <TurnManager />}
            </div>
            <LogPanel 
              log={log} 
              infoPanel={infoPanel} 
              setInfoPanel={setInfoPanel} 
              commandInput={commandInput} 
              setCommandInput={setCommandInput} 
              handleCommand={handleCommand}
            />
          </div>
        </div>
      </div>
  );
}