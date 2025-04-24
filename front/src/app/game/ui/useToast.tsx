import { useState } from 'react';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<(ToastOptions & { id: string })[]>([]);

  const showToast = (options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast = { ...options, id };
    
    setToasts((currentToasts) => [...currentToasts, toast]);
    
    // 자동으로 토스트 제거
    if (options.duration !== Infinity) {
      setTimeout(() => {
        dismissToast(id);
      }, options.duration || 3000);
    }
    
    return id;
  };
  
  const dismissToast = (id: string) => {
    setToasts((currentToasts) => 
      currentToasts.filter((toast) => toast.id !== id)
    );
  };
  
  const dismissAllToasts = () => {
    setToasts([]);
  };
  
  // 토스트 UI 컴포넌트
  const Toast = ({ 
    title, 
    description, 
    variant = 'default', 
    id,
    onDismiss
  }: ToastOptions & { id: string, onDismiss: () => void }) => {
    const bgColor = 
      variant === 'destructive' ? 'bg-red-800' :
      variant === 'success' ? 'bg-green-800' :
      'bg-slate-800';
    
    return (
      <div className={`${bgColor} p-4 rounded-md shadow-lg mb-2 border border-slate-700`}>
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold">{title}</h4>
            {description && <p className="text-sm opacity-80">{description}</p>}
          </div>
          <button 
            className="ml-4 text-gray-400 hover:text-white"
            onClick={onDismiss}
          >
            ✕
          </button>
        </div>
      </div>
    );
  };
  
  // 토스트 컨테이너 컴포넌트
  const ToastContainer = () => {
    if (toasts.length === 0) return null;
    
    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm space-y-2">
        {toasts.map((toast) => (
          <Toast 
            key={toast.id}
            {...toast}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    );
  };
  
  return {
    showToast,
    dismissToast,
    dismissAllToasts,
    ToastContainer,
    toasts
  };
} 