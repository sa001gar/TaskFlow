import React from 'react';
import { TagStatus } from '../../types';
import { CheckCircle, Clock, AlertCircle, XCircle, Circle } from 'lucide-react';

interface StatusBadgeProps {
  status: TagStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = (status: TagStatus) => {
    switch (status) {
      case 'Pending':
        return {
          color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          icon: AlertCircle,
          iconColor: 'text-yellow-600'
        };
      case 'Accepted':
        return {
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Circle,
          iconColor: 'text-blue-600'
        };
      case 'In Progress':
        return {
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Clock,
          iconColor: 'text-purple-600'
        };
      case 'Completed':
        return {
          color: 'bg-green-50 text-green-700 border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600'
        };
      case 'Rejected':
        return {
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: XCircle,
          iconColor: 'text-red-600'
        };
      default:
        return {
          color: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: Circle,
          iconColor: 'text-slate-600'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.color} ${sizeClasses}`}
    >
      <Icon className={`w-3 h-3 mr-1 ${config.iconColor}`} />
      {status}
    </span>
  );
};