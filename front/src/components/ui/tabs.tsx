import React from 'react';

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultValue, value, onValueChange, className = '', ...props }, ref) => {
    const [activeTab, setActiveTab] = React.useState(value || defaultValue || '');

    React.useEffect(() => {
      if (value) setActiveTab(value);
    }, [value]);

    const handleValueChange = (newValue: string) => {
      setActiveTab(newValue);
      if (onValueChange) onValueChange(newValue);
    };

    return (
      <div ref={ref} className={`${className}`} {...props} data-active-tab={activeTab} />
    );
  }
);
Tabs.displayName = 'Tabs';

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md bg-slate-800 p-1 ${className}`}
        {...props}
      />
    );
  }
);
TabsList.displayName = 'TabsList';

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, className = '', ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const tabs = e.currentTarget.closest('[data-active-tab]');
      if (tabs) {
        const currentValue = tabs.getAttribute('data-active-tab');
        if (currentValue !== value) {
          const event = new CustomEvent('tabChange', { detail: { value } });
          tabs.dispatchEvent(event);
          tabs.setAttribute('data-active-tab', value);
        }
      }
      if (props.onClick) props.onClick(e);
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-slate-700 data-[state=active]:text-white ${className}`}
        onClick={handleClick}
        data-value={value}
        data-state={(props.parentElement as Element)?.getAttribute('data-active-tab') === value ? 'active' : 'inactive'}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className = '', ...props }, ref) => {
    const [isActive, setIsActive] = React.useState(false);

    React.useEffect(() => {
      const tabs = document.querySelector(`[data-active-tab="${value}"]`);
      if (tabs) {
        setIsActive(true);
        const handleTabChange = (e: Event) => {
          const customEvent = e as CustomEvent;
          setIsActive(customEvent.detail.value === value);
        };
        tabs.addEventListener('tabChange', handleTabChange);
        return () => {
          tabs.removeEventListener('tabChange', handleTabChange);
        };
      }
    }, [value]);

    if (!isActive) return null;

    return (
      <div
        ref={ref}
        className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
        {...props}
      />
    );
  }
);
TabsContent.displayName = 'TabsContent'; 