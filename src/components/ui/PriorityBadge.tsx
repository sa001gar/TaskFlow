import React from 'react';
import { TagPriority } from '../../types';
import { AlertTriangle, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface PriorityBadgeProps {
  priority: TagPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const getPriorityConfig = (priority: TagPriority) => {
    switch (priority) {
      case 'Critical':
        return {
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: AlertTriangle,
          iconColor: 'text-red-600'
        };
      case 'High':
        return {
          color: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: ArrowUp,
          iconColor: 'text-orange-600'
        };
      case 'Medium':
        return {
          color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          icon: Minus,
          iconColor: 'text-yellow-600'
        };
      case 'Low':
        return {
          color: 'bg-green-50 text-green-700 border-green-200',
          icon: ArrowDown,
          iconColor: 'text-green-600'
        };
      default:
        return {
          color: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: Minus,
          iconColor: 'text-slate-600'
        };
    }
  };

  const config = getPriorityConfig(priority);
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.color} ${sizeClasses}`}
    >
      <Icon className={`w-3 h-3 mr-1 ${config.iconColor}`} />
      {priority}
    </span>
  );
};