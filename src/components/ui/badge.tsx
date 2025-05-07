// ui/badge.tsx
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, className }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-sm border rounded-md ${className}`}
    >
      {children}
    </span>
  );
};