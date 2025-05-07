// ui/progress.tsx
import React from 'react';

interface ProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, className, indicatorClassName }) => {
  return (
    <div className={`w-full h-2 bg-gray-200 rounded ${className}`}>
      <div
        className={`h-full rounded ${indicatorClassName}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
};