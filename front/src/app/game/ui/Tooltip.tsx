import React from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = React.useState(false);
  return (
    <span className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-xs text-white rounded shadow-lg z-50 whitespace-nowrap">
          {content}
        </div>
      )}
    </span>
  );
}
