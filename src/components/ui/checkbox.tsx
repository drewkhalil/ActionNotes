import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onCheckedChange, id, className }) => {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={`h-5 w-5 border-2 border-black rounded focus:ring-2 focus:ring-black focus:ring-offset-2 ${
        checked ? 'bg-black text-white' : 'bg-white'
      } ${className}`}
    />
  );
};