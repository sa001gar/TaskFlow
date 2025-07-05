import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  title?: string;
}

export const Alert: React.FC<AlertProps> = ({ 
  children, 
  variant = 'default',
  title,
  className = '', 
  ...props 
}) => {
  const variants = {
    default: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: Info,
      iconColor: 'text-blue-600'
    },
    destructive: {
      container: 'bg-red-50 border-bright-red text-red-800',
      icon: XCircle,
      iconColor: 'text-bright-red'
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: AlertCircle,
      iconColor: 'text-amber-600'
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div
      className={`border rounded-lg p-4 ${config.container} ${className}`}
      {...props}
    >
      <div className="flex items-start">
        <Icon className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${config.iconColor}`} />
        <div className="flex-1">
          {title && (
            <h5 className="font-medium mb-1">{title}</h5>
          )}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
};