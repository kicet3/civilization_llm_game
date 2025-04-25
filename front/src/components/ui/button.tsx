import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', className = '', children, ...props }, ref) => {
    // 기본 클래스
    let baseClasses = 'font-medium rounded focus:outline-none transition-colors';
    
    // 버튼 크기에 따른 클래스
    const sizeClasses = {
      default: 'px-4 py-2 text-sm',
      sm: 'px-3 py-1 text-xs',
      lg: 'px-6 py-3 text-base',
      icon: 'p-2'
    };
    
    // 버튼 타입에 따른 클래스
    const variantClasses = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed',
      outline: 'border border-slate-600 text-slate-200 bg-transparent hover:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed',
      ghost: 'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white disabled:text-slate-500 disabled:cursor-not-allowed'
    };
    
    const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
    
    return (
      <button className={classes} ref={ref} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button'; 