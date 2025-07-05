import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-navy mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition-colors duration-200 appearance-none bg-white text-navy ${
            error ? 'border-bright-red focus:ring-bright-red' : ''
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
      </div>
      {error && (
        <p className="mt-1 text-sm text-bright-red">{error}</p>
      )}
    </div>
  );
};