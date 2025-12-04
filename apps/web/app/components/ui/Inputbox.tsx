"use client";
import React, { forwardRef, useState } from 'react';
import { Mail, Key, Eye, EyeOff, User } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  startIcon?: "mail" | "password" | "user"; 
}

const iconMap = {
  mail: <Mail size={18} />,
  password: <Key size={18} />,
  user: <User size={18} />
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, startIcon, type = "text", className, ...props }, ref) => {
    
    const [isVisible, setIsVisible] = useState(false);

    const isPasswordType = type === 'password';
    const inputType = isPasswordType && isVisible ? 'text' : type;

    return (
      <div className="w-full flex flex-col gap-1.5 px-2 py-4">
        {label && (
          <label htmlFor={props.id} className="text-sm font-medium text-white">
            {label}
          </label>
        )}

        <div 
          className={`
            relative flex items-center gap-2 px-3 py-2 rounded-md border bg-white transition-all duration-200
            ${error 
              ? "border-red-500 focus-within:ring-2 focus-within:ring-red-200" 
              : "border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
            }
          `}
        >
          {startIcon && (
            <span className="text-gray-400 select-none">
              {iconMap[startIcon]}
            </span>
          )}

          <input
            ref={ref}
            type={inputType}
            className="w-full bg-transparent p-0 text-sm placeholder:text-gray-400 focus:outline-none text-gray-900"
            {...props}
          />

          {isPasswordType && (
            <button
              type="button" 
              onClick={() => setIsVisible(!isVisible)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
            >
              {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {error && (
          <span className="text-xs text-red-500 animate-pulse">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;