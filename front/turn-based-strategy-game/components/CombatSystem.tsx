'use client'

import React, { useState, useEffect } from 'react';
import { Unit, HexTile } from '@/lib/types';
import { simulateCombat } from '@/lib/mockData';

interface CombatSystemProps {
  attacker: Unit;
  defender: Unit;
  terrainBonus?: number;
  onCombatEnd: (result: {
    winner: 'attacker' | 'defender';
    destroyedUnit: Unit | null;
    damagedUnit: Unit | null;
  }) => void;
}

const CombatSystem: React.FC<CombatSystemProps> = ({
  attacker,
  defender,
  terrainBonus = 0,
  onCombatEnd
}) => {
  const [step, setStep] = useState<'preview' | 'combat' | 'result'>('preview');
  const [combatResult, setCombatResult] = useState<{ 
    winner: 'attacker' | 'defender';
    remainingStrength: number;
  } | null>(null);
  const [animation, setAnimation] = useState<string>('');

  // 전투 미리보기
  const combatPreview = simulateCombat(attacker, defender, terrainBonus);
  
  // 전투 실행
  const executeCombat = () => {
    setStep('combat');
    setAnimation('animate-battle');
    
    // 애니메이션 시간 후 전투 결과 표시
    setTimeout(() => {
      const result = simulateCombat(attacker, defender, terrainBonus);
      setCombatResult(result);
      setStep('result');
    }, 1500);
  };
  
  // 전투 결과 처리
  const handleCombatEnd = () => {
    if (!combatResult) return;
    
    // 전투 결과에 따라 파괴된 유닛과 피해받은 유닛 결정
    const destroyedUnit = combatResult.winner === 'attacker' ? defender : attacker;
    const damagedUnit = combatResult.winner === 'attacker' 
      ? { ...attacker, strength: combatResult.remainingStrength }
      : { ...defender, strength: combatResult.remainingStrength };
    
    onCombatEnd({
      winner: combatResult.winner,
      destroyedUnit: destroyedUnit,
      damagedUnit: damagedUnit
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">전투</h2>
        
        {/* 전투 미리보기 */}
        {step === 'preview' && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-6">
              <div className="text-center">
                <div className="text-2xl mb-2">
                  {attacker.type === 'military' ? '⚔️' : attacker.type === 'naval' ? '⛵' : '👤'}
                </div>
                <div className="font-bold">{attacker.name}</div>
                <div>전투력: {attacker.strength}</div>
              </div>
              
              <div className="text-xl font-bold">VS</div>
              
              <div className="text-center">
                <div className="text-2xl mb-2">
                  {defender.type === 'military' ? '⚔️' : defender.type === 'naval' ? '⛵' : '👤'}
                </div>
                <div className="font-bold">{defender.name}</div>
                <div>전투력: {defender.strength} {terrainBonus > 0 ? `(+${terrainBonus} 지형 보너스)` : ''}</div>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2">전투 예상 결과</h3>
              <p>
                승리 가능성: {combatPreview.winner === 'attacker' ? 
                  '아군 유닛 우세' : '적 유닛 우세'}
              </p>
              <div className="w-full bg-gray-600 h-2 rounded-full mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    combatPreview.winner === 'attacker' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${
                      combatPreview.winner === 'attacker' ? 
                      Math.min(100, (combatPreview.remainingStrength / attacker.strength!) * 100) : 
                      Math.min(100, (combatPreview.remainingStrength / defender.strength!) * 100)
                    }%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button 
                className="game-button-gray"
                onClick={() => onCombatEnd({ winner: 'attacker', destroyedUnit: null, damagedUnit: null })}
              >
                취소
              </button>
              <button 
                className="game-button-red"
                onClick={executeCombat}
              >
                전투 시작
              </button>
            </div>
          </div>
        )}
        
        {/* 전투 진행 중 */}
        {step === 'combat' && (
          <div className="flex justify-center items-center h-64">
            <div className={`flex justify-between items-center w-full ${animation}`}>
              <div className="text-center">
                <div className="text-4xl mb-2">
                  {attacker.type === 'military' ? '⚔️' : attacker.type === 'naval' ? '⛵' : '👤'}
                </div>
                <div className="font-bold">{attacker.name}</div>
              </div>
              
              <div className="text-red-500 text-4xl">⚡</div>
              
              <div className="text-center">
                <div className="text-4xl mb-2">
                  {defender.type === 'military' ? '⚔️' : defender.type === 'naval' ? '⛵' : '👤'}
                </div>
                <div className="font-bold">{defender.name}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* 전투 결과 */}
        {step === 'result' && combatResult && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-6">
              <div className={`text-center ${combatResult.winner === 'attacker' ? 'text-green-400' : 'text-red-400 opacity-50'}`}>
                <div className="text-2xl mb-2">
                  {attacker.type === 'military' ? '⚔️' : attacker.type === 'naval' ? '⛵' : '👤'}
                </div>
                <div className="font-bold">{attacker.name}</div>
                <div>
                  {combatResult.winner === 'attacker' 
                    ? `전투력: ${combatResult.remainingStrength}/${attacker.strength}`
                    : '패배'}
                </div>
              </div>
              
              <div className="text-xl font-bold">
                {combatResult.winner === 'attacker' ? '승리' : '패배'}
              </div>
              
              <div className={`text-center ${combatResult.winner === 'defender' ? 'text-green-400' : 'text-red-400 opacity-50'}`}>
                <div className="text-2xl mb-2">
                  {defender.type === 'military' ? '⚔️' : defender.type === 'naval' ? '⛵' : '👤'}
                </div>
                <div className="font-bold">{defender.name}</div>
                <div>
                  {combatResult.winner === 'defender'
                    ? `전투력: ${combatResult.remainingStrength}/${defender.strength}`
                    : '패배'}
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-gray-700 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">전투 결과</h3>
              <p>
                {combatResult.winner === 'attacker'
                  ? `아군 ${attacker.name}이(가) 승리했습니다. 적 ${defender.name}이(가) 제거되었습니다.`
                  : `아군 ${attacker.name}이(가) 패배했습니다.`}
              </p>
              {combatResult.winner === 'attacker' && (
                <p className="mt-2">경험치를 획득했습니다.</p>
              )}
            </div>
            
            <div className="flex justify-end">
              <button 
                className="game-button-blue"
                onClick={handleCombatEnd}
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CombatSystem;