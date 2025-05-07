import React, { useState } from 'react';

interface TabsProps {
  defaultValue?: string; // Optional, for uncontrolled behavior
  value?: string; // For controlled behavior
  onValueChange?: (value: string) => void; // For controlled behavior
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className = '',
}) => {
  // If value is provided (controlled), use it; otherwise, use internal state (uncontrolled)
  const [internalActiveTab, setInternalActiveTab] = useState(defaultValue || '');
  const activeTab = controlledValue !== undefined ? controlledValue : internalActiveTab;
  const setActiveTab = (newValue: string) => {
    if (controlledValue !== undefined && onValueChange) {
      onValueChange(newValue); // Call the parent's onValueChange if controlled
    } else {
      setInternalActiveTab(newValue); // Use internal state if uncontrolled
    }
  };

  return (
    <div className={className}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement, {
              activeTab,
              setActiveTab,
            })
          : child
      )}
    </div>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
}

export const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex space-x-4 ${className}`}>
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
  disabled?: boolean; // Add disabled prop
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className = '',
  activeTab,
  setActiveTab,
  disabled,
}) => {
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab && setActiveTab(value)}
      className={`px-4 py-2 text-sm font-medium transition-all ${
        isActive
          ? 'border-b-2 border-[#1E3A8A] text-[#1E3A8A]'
          : 'text-[#4A4F57] hover:text-[#1E3A8A]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className = '',
  activeTab,
}) => {
  if (value !== activeTab) return null;

  return (
    <div className={className}>
      {children}
    </div>
  );
};