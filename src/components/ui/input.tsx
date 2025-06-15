import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex w-full rounded-xl border border-[#544d3b] bg-[#27241c] text-white placeholder-[#b9b19d] focus:outline-none focus:ring-0 focus:border-[#dba10f] disabled:cursor-not-allowed disabled:opacity-50 text-base font-normal leading-normal px-4 py-2',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }