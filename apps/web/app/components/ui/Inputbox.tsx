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
      <div className="w-full flex flex-col gap-1.5 px-2 py-3">
        {label && (
          <label htmlFor={props.id} className="text-xs font-semibold text-[#9ca3af]">
            {label}
          </label>
        )}

        <div 
          className={`
            relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-[#1e2025] transition-all duration-200
            ${error 
              ? "border-rose-500/60 focus-within:ring-2 focus-within:ring-rose-500/20" 
              : "border-[#2a2c33] focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20"
            }
          `}
        >
          {startIcon && (
            <span className="text-[#6b7280] select-none">
              {iconMap[startIcon]}
            </span>
          )}

          <input
            ref={ref}
            type={inputType}
            className="w-full bg-transparent p-0 text-sm placeholder:text-[#6b7280] focus:outline-none text-white"
            {...props}
          />

          {isPasswordType && (
            <button
              type="button" 
              onClick={() => setIsVisible(!isVisible)}
              className="text-[#6b7280] hover:text-white focus:outline-none transition-colors"
            >
              {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {error && (
          <span className="text-xs text-rose-400">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;