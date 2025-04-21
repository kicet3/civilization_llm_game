'use client'

import React from 'react';
import { NpcDialog as NpcDialogType } from '@/lib/types';

interface NpcDialogProps {
  dialog: NpcDialogType;
  onClose: () => void;
}

const NpcDialog: React.FC<NpcDialogProps> = ({ dialog, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{dialog.npcName}</h3>
          <span className={`px-2 py-1 rounded text-sm ${
            dialog.relationship === "동맹" ? "bg-green-700" :
            dialog.relationship === "적대" ? "bg-red-700" : "bg-yellow-700"
          }`}>
            {dialog.relationship}
          </span>
        </div>
        <p className="mb-4">{dialog.message}</p>
        <div className="flex justify-end gap-2">
          <button 
            className="game-button-blue"
            onClick={onClose}
          >
            답변하기
          </button>
          <button 
            className="game-button-gray"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default NpcDialog;