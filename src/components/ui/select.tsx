import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import React from 'react';

export const Select = SelectPrimitive.Root;

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectPrimitive.SelectTriggerProps
>(({ children, className, ...props }, forwardedRef) => (
  <SelectPrimitive.Trigger
    ref={forwardedRef}
    className={`flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-peach-600 text-gray-900 ${className}`}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 ml-2 text-gray-500" />
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue = SelectPrimitive.Value;

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  SelectPrimitive.SelectContentProps
>(({ children, className, ...props }, forwardedRef) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={forwardedRef}
      className={`bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto ${className}`}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  SelectPrimitive.SelectItemProps
>(({ children, className, ...props }, forwardedRef) => (
  <SelectPrimitive.Item
    ref={forwardedRef}
    className={`flex items-center px-3 py-2 text-sm text-gray-900 hover:bg-peach-100 cursor-pointer rounded-md ${className}`}
    {...props}
  >
    <SelectPrimitive.ItemIndicator className="mr-2">
      <Check className="h-4 w-4 text-peach-600" />
    </SelectPrimitive.ItemIndicator>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';