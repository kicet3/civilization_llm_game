'use client'

import React, { useState } from 'react';
import { Unit, UnitType, Position } from '@/lib/types';
import { useGameStore } from '@/lib/store';
import { getNeighbors, isSamePosition } from '@/lib/utils';

interface UnitManagementProps {
  selectedUnitId: number | null;
}

const UnitManagement: React.FC<UnitManagementProps> = ({ selectedUnitId }) => {
  const { units, unitTypes, hexMap, moveUnit, selectTile } = useGameStore();
  const [showMoveOptions, setShowMoveOptions] = useState(false);
  
  // 선택된 유닛 찾기
  const selectedUnit = selectedUnitId ? units.find(unit => unit.id === selectedUnitId) : null;
  const unitType = selectedUnit ? unitTypes.find(type => type.name === selectedUnit.name) : null;
  
  // 이동 가능한 타일 계산
  const calculateMovableTiles = () => {
    if (!selectedUnit) return [];
    
    // BFS로 이동 가능한 타일 찾기
    const visited = new Set<string>();
    const queue: { pos: Position, movementLeft: number }[] = [{ 
      pos: selectedUnit.position, 
      movementLeft: selectedUnit.movementLeft 
    }];
    const movableTiles: Position[] = [];
    
    while (queue.length > 0) {
      const { pos, movementLeft } = queue.shift()!;
      
      if (movementLeft <= 0) continue;
      
      const key = `${pos.q},${pos.r}`;
      if (visited.has(key)) continue;
      
      visited.add(key);
      
      // 이 위치가 이동 가능한 타일이면 결과에 추가
      const tile = hexMap.find(t => t.q === pos.q && t.r === pos.r);
      
      if (tile && tile !== hexMap.find(t => 
        t.q === selectedUnit.position.q && 
        t.r === selectedUnit.position.r
      )) {
        // 이동 가능한 타일인지 확인 (물 위에는 육상 유닛이 갈 수 없음)
        if (selectedUnit.type !== 'military' || tile.terrain !== 'water') {
          movableTiles.push(pos);
        }
      }
      
      // 이웃 타일 탐색
      const neighbors = getNeighbors(pos);
      for (const neighbor of neighbors) {
        const neighborTile = hexMap.find(t => t.q === neighbor.q && t.r === neighbor.r);
        
        // 이웃 타일이 존재하고 방문하지 않았으면 큐에 추가
        if (neighborTile) {
          // 지형에 따른 이동 비용 계산
          let movementCost = 1;
          if (neighborTile.terrain === 'mountain') {
            movementCost = 2;
          } else if (neighborTile.terrain === 'forest') {
            movementCost = 1.5;
          }
          
          if (movementLeft >= movementCost) {
            queue.push({ 
              pos: neighbor, 
              movementLeft: movementLeft - movementCost 
            });
          }
        }
      }
    }
    
    return movableTiles;
  };
  
  const movableTiles = calculateMovableTiles();
  
  // 유닛 이동 처리
  const handleMove = (destination: Position) => {
    if (selectedUnitId) {
      moveUnit(selectedUnitId, destination);
      setShowMoveOptions(false);
      
      // 이동 후 해당 타일 선택
      const tile = hexMap.find(t => t.q === destination.q && t.r === destination.r);
      if (tile) {
        selectTile(tile);
      }
    }
  };
  
  // 유닛이 선택되지 않았다면 아무것도 보여주지 않음
  if (!selectedUnit) {
    return null;
  }
  
  return (
    <div className="bg-gray-800 p-4 rounded">
      <h3 className="text-lg font-bold mb-2">유닛 관리</h3>
      
      {/* 유닛 정보 */}
      <div className="mb-4">
        <p><strong>이름:</strong> {selectedUnit.name}</p>
        <p><strong>유형:</strong> {selectedUnit.type === 'military' ? '군사' : 
                              selectedUnit.type === 'civilian' ? '민간' : '특수'}</p>
        {selectedUnit.strength && (
          <p><strong>전투력:</strong> {selectedUnit.strength}</p>
        )}
        <p><strong>이동력:</strong> {selectedUnit.movementLeft} / {selectedUnit.movement}</p>
        {selectedUnit.level && (
          <p><strong>레벨:</strong> {selectedUnit.level}</p>
        )}
        {selectedUnit.experience && (
          <p><strong>경험치:</strong> {selectedUnit.experience}</p>
        )}
        {selectedUnit.abilities && selectedUnit.abilities.length > 0 && (
          <div>
            <strong>능력:</strong>
            <ul className="list-disc list-inside">
              {selectedUnit.abilities.map((ability, index) => (
                <li key={index}>{ability}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* 유닛 행동 버튼 */}
      <div className="flex flex-col gap-2">
        <button
          className="game-button-blue"
          onClick={() => setShowMoveOptions(!showMoveOptions)}
          disabled={selectedUnit.movementLeft <= 0}
        >
          {showMoveOptions ? '이동 취소' : '이동'}
        </button>
        
        {selectedUnit.type === 'military' && (
          <button className="game-button-red" disabled={selectedUnit.movementLeft <= 0}>
            공격
          </button>
        )}
        
        {selectedUnit.type === 'civilian' && selectedUnit.name === '정착민' && (
          <button className="game-button-green" disabled={selectedUnit.movementLeft <= 0}>
            도시 건설
          </button>
        )}
        
        {selectedUnit.type === 'civilian' && selectedUnit.name === '노동자' && (
          <button className="game-button-purple" disabled={selectedUnit.movementLeft <= 0}>
            지형 개선
          </button>
        )}
      </div>
      
      {/* 이동 가능한 타일 표시 */}
      {showMoveOptions && movableTiles.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">이동 가능한 위치:</h4>
          <div className="grid grid-cols-3 gap-2">
            {movableTiles.map((tile, index) => {
              const hexTile = hexMap.find(t => t.q === tile.q && t.r === tile.r);
              return (
                <button
                  key={index}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                  onClick={() => handleMove(tile)}
                >
                  ({tile.q}, {tile.r})
                  {hexTile?.terrain && ` - ${
                    hexTile.terrain === 'plain' ? '평지' :
                    hexTile.terrain === 'mountain' ? '산' :
                    hexTile.terrain === 'forest' ? '숲' :
                    hexTile.terrain === 'water' ? '물' : '사막'
                  }`}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitManagement;