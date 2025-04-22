'use client'

import React, { useState, useEffect } from 'react';
import { Hexagon, HexGrid, Layout, Text } from 'react-hexgrid';
import { Position } from '@/lib/types';

interface AnimationProps {
  position: Position;
  type: 'move' | 'attack' | 'build' | 'discover' | 'highlight';
  duration?: number;
  viewBox: string;
  onComplete?: () => void;
  color?: string;
}

interface TileAnimationsProps {
  animations: AnimationProps[];
  viewBox: string;
}

// 단일 애니메이션 컴포넌트
const TileAnimation: React.FC<AnimationProps> = ({ 
  position, 
  type, 
  duration = 1000, 
  viewBox,
  onComplete,
  color
}) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    const startTime = Date.now();
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(1, elapsed / duration);
      
      setProgress(newProgress);
      
      if (newProgress < 1) {
        requestAnimationFrame(updateProgress);
      } else {
        setIsComplete(true);
        if (onComplete) {
          onComplete();
        }
      }
    };
    
    const animationFrame = requestAnimationFrame(updateProgress);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [duration, onComplete]);
  
  // 애니메이션이 완료되면 렌더링하지 않음
  if (isComplete) {
    return null;
  }
  
  // 애니메이션 타입에 따른 시각적 효과
  const getAnimationStyles = () => {
    switch (type) {
      case 'move':
        return {
          fill: color || '#4299e1',
          fillOpacity: 0.5 - progress * 0.5,
          stroke: '#4299e1',
          strokeWidth: 0.3,
          strokeOpacity: 1 - progress,
          transform: `scale(${1 + progress * 0.3})`,
        };
      case 'attack':
        return {
          fill: color || '#f56565',
          fillOpacity: 0.7 - progress * 0.5,
          stroke: '#e53e3e',
          strokeWidth: 0.5,
          strokeOpacity: 1 - progress * 0.5,
          transform: `scale(${1 + Math.sin(progress * Math.PI * 2) * 0.2})`,
        };
      case 'build':
        return {
          fill: color || '#48bb78',
          fillOpacity: 0.5 - progress * 0.3,
          stroke: '#38a169',
          strokeWidth: 0.4,
          strokeOpacity: 1 - progress * 0.8,
          transform: `scale(${1 + progress * 0.5})`,
        };
      case 'discover':
        return {
          fill: color || '#ecc94b',
          fillOpacity: 0.7 - progress * 0.7,
          stroke: '#d69e2e',
          strokeWidth: 0.3,
          strokeOpacity: 1 - progress,
          transform: `scale(${1 + progress * 0.8})`,
        };
      case 'highlight':
        return {
          fill: color || '#9f7aea',
          fillOpacity: 0.5 - Math.abs(Math.sin(progress * Math.PI * 3)) * 0.4,
          stroke: '#805ad5',
          strokeWidth: 0.3,
          strokeOpacity: 1 - Math.abs(Math.sin(progress * Math.PI * 2)) * 0.8,
          transform: 'scale(1.1)',
        };
      default:
        return {
          fill: '#a0aec0',
          fillOpacity: 0.5 - progress * 0.5,
          stroke: '#a0aec0',
          strokeWidth: 0.2,
          strokeOpacity: 1 - progress,
        };
    }
  };
  
  // 애니메이션 텍스트
  const getAnimationText = () => {
    switch (type) {
      case 'move':
        return '⟩';
      case 'attack':
        return '⚔️';
      case 'build':
        return '🏗️';
      case 'discover':
        return '✨';
      case 'highlight':
        return '';
      default:
        return '';
    }
  };
  
  const styles = getAnimationStyles();
  const text = getAnimationText();
  
  return (
    <HexGrid width="100%" height="100%" viewBox={viewBox}>
      <Layout size={{ x: 5, y: 5 }} flat={true} spacing={1.05} origin={{ x: 0, y: 0 }}>
        <Hexagon
          q={position.q}
          r={position.r}
          s={-position.q-position.r}
          fill={styles.fill}
          fillOpacity={styles.fillOpacity}
          stroke={styles.stroke}
          strokeWidth={styles.strokeWidth}
          strokeOpacity={styles.strokeOpacity}
          style={{
            transition: 'all 0.05s ease-out',
            transform: styles.transform,
            transformOrigin: 'center',
          }}
          className="pointer-events-none"
        >
          {text && (
            <Text style={{ fontSize: '0.5em' }}>
              {text}
            </Text>
          )}
        </Hexagon>
      </Layout>
    </HexGrid>
  );
};

// 여러 애니메이션을 관리하는 컴포넌트
const TileAnimations: React.FC<TileAnimationsProps> = ({ animations, viewBox }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {animations.map((animation, index) => (
        <TileAnimation
          key={`${animation.type}-${animation.position.q}-${animation.position.r}-${index}`}
          position={animation.position}
          type={animation.type}
          duration={animation.duration}
          viewBox={viewBox}
          onComplete={animation.onComplete}
          color={animation.color}
        />
      ))}
    </div>
  );
};

export default TileAnimations;