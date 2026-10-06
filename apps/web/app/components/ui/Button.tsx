import React, { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  bgColor?: string;
  textColor?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  variant?: 'solid' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      text,
      size = 'md',
      bgColor = 'bg-white',
      textColor = 'text-black',
      rounded = '2xl',
      variant = 'solid',
      fullWidth = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    // Size classes
    const sizeClasses = {
      sm: 'px-3.5 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg',
    };

    // Rounded classes
    const roundedClasses = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      full: 'rounded-full',
    };

    // Variant styles
    const getVariantClasses = () => {
      switch (variant) {
        case 'outline':
          return `border border-[#2a2c33] bg-transparent text-gray-200 hover:border-gray-400 hover:bg-[#1e2025] hover:text-white`;
        case 'ghost':
          return `text-[#9ca3af] bg-transparent hover:text-white hover:bg-[#1e2025]`;
        case 'solid':
        default:
          return `${bgColor} ${textColor} hover:opacity-90 shadow-sm active:scale-[0.98]`;
      }
    };

    const baseClasses = 'inline-flex items-center justify-center font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none cursor-pointer';
    const widthClass = fullWidth ? 'w-full' : '';

    const buttonClasses = `
      ${baseClasses}
      ${sizeClasses[size]}
      ${roundedClasses[rounded]}
      ${getVariantClasses()}
      ${widthClass}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <button
        ref={ref}
        type="button"
        className={buttonClasses}
        {...props}
      >
        {children || text}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;