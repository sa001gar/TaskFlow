import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-primary-dark mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray">
            {icon}
          </div>
        )}
        <input
          className={`w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-red focus:border-transparent transition-all duration-200 text-primary-dark placeholder-gray bg-white ${
            icon ? 'pl-12' : ''
          } ${
            error ? 'border-accent-red focus:ring-accent-red' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-accent-red font-medium">{error}</p>
      )}
    </div>
  );
};