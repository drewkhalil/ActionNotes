import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'default',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeStyles = {
      default: 'px-4 py-2',
      sm: 'px-3 py-1.5 text-sm',
      lg: 'px-6 py-3 text-lg',
      icon: 'p-2',
    };

    const variantStyles = {
      primary: 'bg-[#152152] hover:bg-[#1A2A6C] text-white focus:ring-[#152152]',
      secondary: 'bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-500',
      outline:
        'border border-[#152152] text-[#152152] hover:bg-[#152152] hover:text-white focus:ring-[#152152]',
      ghost: 'hover:bg-[#152152] hover:text-white text-[#152152] focus:ring-[#152152]',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';