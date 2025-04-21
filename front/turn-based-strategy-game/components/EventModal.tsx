'use client'

import React from 'react';
import { GameEvent } from '@/lib/types';

interface EventModalProps {
  event: GameEvent;
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
  // 이벤트 타입에 따른 배경색 설정
  const getEventTypeClass = (): string => {
    switch (event.type) {
      case 'science': return 'bg-blue-700';
      case 'disaster': return 'bg-red-700';
      case 'diplomatic': return 'bg-purple-700';
      case 'cultural': return 'bg-yellow-700';
      default: return 'bg-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-lg w-full">
        <div className={`mb-4 p-2 rounded ${getEventTypeClass()}`}>
          <h3 className="text-xl font-bold">{event.title}</h3>
        </div>
        <p className="mb-4">{event.description}</p>
        <div className="flex justify-end">
          <button 
            className="game-button-blue"
            onClick={onClose}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;