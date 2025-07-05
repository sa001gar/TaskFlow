import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
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
      <textarea
        className={`w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition-colors duration-200 resize-none text-navy ${
          error ? 'border-bright-red focus:ring-bright-red' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-bright-red">{error}</p>
      )}
    </div>
  );
};