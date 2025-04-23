import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, show, onClose, duration = 2000 }: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;
  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-black bg-opacity-80 text-white px-6 py-3 rounded shadow-lg z-[9999] animate-fadein">
      {message}
    </div>
  );
}
