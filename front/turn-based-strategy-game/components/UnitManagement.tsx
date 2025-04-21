'use client'

import React, { useState } from 'react';
import { Unit, HexTile, Position } from '@/lib/types';
import { getDistance, getNeighbors, isSamePosition } from '@/lib/utils';

interface UnitManagementProps {
  selectedUnit: Unit | null;
  selectedTile: HexTile | null;
  units: Unit[];
  hexMap: HexTile[];
  onUnitMove: (unit: Unit, destination: Position) => void;
  onUnitAttack: (attacker: Unit, defender: Unit) => void;
  onClose: () => void;
}

const UnitManagement: React.FC<UnitManagementProps> = ({
  selectedUnit,
  selectedTile,
  units,
  hexMap,
  onUnitMove,
  onUnitAttack,
  onClose,
}) => {
  const [showMoveOptions, setShowMoveOptions] = useState<boolean>(false);
  const [possibleMoves, setPossibleMoves] = useState<Position[]>([]);
  const [actionPoints, setActionPoints] = useState<number>(
    selectedUnit ? selectedUnit.movement : 0
  );

  // 선택된 유닛이 없을 경우 null 반환
  if (!selectedUnit) {
    return null;
  }

  // 이동 가능한 타일 계산
  const calculatePossibleMoves = () => {
    if (!selectedUnit) return;
    
    const currentPos = selectedUnit.position;
    const movementRange = actionPoints;
    const validMoves: Position[] = [];
    
    // 근처 타일들을 탐색
    hexMap.forEach(tile => {
      const distance = getDistance(currentPos, { q: tile.q, r: tile.r });
      
      // 이동 범위 내에 있고 이동 가능한 타일인지 확인
      if (distance <= movementRange && distance > 0) {
        // 물 지형이면 해상 유닛만 이동 가능
        if (tile.terrain === 'water' && selectedUnit.type !== 'naval') {
          return;
        }
        
        // 산악 지형이면 이동력이 더 필요함
        if (tile.terrain === 'mountain' && movementRange < 2) {
          return;
        }
        
        // 다른 유닛이 있는지 확인
        const unitAtPosition = units.find(u => 
          isSamePosition(u.position, { q: tile.q, r: tile.r })
        );
        
        // 적 유닛이 있으면 공격 가능, 아군 유닛이 있으면 이동 불가
        if (unitAtPosition) {
          if (unitAtPosition.id !== selectedUnit.id) {
            return;
          }
        }
        
        validMoves.push({ q: tile.q, r: tile.r });
      }
    });
    
    setPossibleMoves(validMoves);
    setShowMoveOptions(true);
  };

  // 유닛 이동 처리
  const handleMove = (destination: Position) => {
    if (!selectedUnit) return;
    
    // 이동 실행
    onUnitMove(selectedUnit, destination);
    
    // 이동 옵션 닫기
    setShowMoveOptions(false);
    
    // 행동 포인트 감소
    const distance = getDistance(selectedUnit.position, destination);
    setActionPoints(prev => Math.max(0, prev - distance));
  };

  // 공격 가능한 유닛 찾기
  const findAttackableUnits = () => {
    if (!selectedUnit || selectedUnit.type !== 'military') return [];
    
    // 군사 유닛만 공격 가능
    const attackableUnits: Unit[] = [];
    const neighbors = getNeighbors(selectedUnit.position);
    
    units.forEach(unit => {
      // 자신의 유닛은 공격 불가
      if (unit.id === selectedUnit.id) return;
      
      // 인접한 타일의 유닛만 공격 가능
      const isNeighbor = neighbors.some(neighbor => 
        isSamePosition(neighbor, unit.position)
      );
      
      if (isNeighbor) {
        attackableUnits.push(unit);
      }
    });
    
    return attackableUnits;
  };

  // 공격 처리
  const handleAttack = (defender: Unit) => {
    if (!selectedUnit || selectedUnit.type !== 'military') return;
    
    onUnitAttack(selectedUnit, defender);
    setActionPoints(0); // 공격 후 행동력 소진
  };

  // 공격 가능한 유닛들
  const attackableUnits = findAttackableUnits();

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {selectedUnit.name} ({selectedUnit.type})
        </h3>
        <button 
          className="text-white p-1 rounded hover:bg-red-700" 
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="mb-4">
        <p>위치: ({selectedUnit.position.q}, {selectedUnit.position.r})</p>
        <p>이동력: {actionPoints}/{selectedUnit.movement}</p>
        {selectedUnit.type === 'military' && (
          <p>전투력: {selectedUnit.strength}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {actionPoints > 0 && (
          <button 
            className="game-button-blue"
            onClick={calculatePossibleMoves}
            disabled={showMoveOptions}
          >
            이동
          </button>
        )}
        
        {selectedUnit.type === 'military' && attackableUnits.length > 0 && actionPoints > 0 && (
          <div>
            <p className="mb-2 font-semibold">공격 가능 대상:</p>
            {attackableUnits.map(unit => (
              <button
                key={unit.id}
                className="game-button-red w-full mb-2 text-left flex justify-between"
                onClick={() => handleAttack(unit)}
              >
                <span>{unit.name}</span>
                <span>전투력: {unit.strength || 0}</span>
              </button>
            ))}
          </div>
        )}
        
        {selectedUnit.type === 'civilian' && actionPoints > 0 && (
          <button 
            className="game-button-green"
          >
            도시 건설
          </button>
        )}
      </div>

      {showMoveOptions && possibleMoves.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 font-semibold">이동 가능 타일:</p>
          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {possibleMoves.map((pos, idx) => (
              <button
                key={idx}
                className="game-button-blue"
                onClick={() => handleMove(pos)}
              >
                ({pos.q}, {pos.r})
              </button>
            ))}
          </div>
          <button 
            className="game-button-gray mt-2 w-full"
            onClick={() => setShowMoveOptions(false)}
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
};

export default UnitManagement;