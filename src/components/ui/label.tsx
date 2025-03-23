import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';

interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  htmlFor?: string;
}

export function Label({ htmlFor, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      htmlFor={htmlFor}
      {...props}
    />
  );
} 