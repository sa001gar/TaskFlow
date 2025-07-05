import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle,
  Tag
} from 'lucide-react';
import { TagStatus } from '../../types';

interface TaskStatusTabsProps {
  statusFilter: TagStatus | 'all';
  onStatusFilterChange: (status: TagStatus | 'all') => void;
  statusCounts: Record<TagStatus | 'all', number>;
}

export const TaskStatusTabs: React.FC<TaskStatusTabsProps> = ({
  statusFilter,
  onStatusFilterChange,
  statusCounts,
}) => {
  const getStatusIcon = (status: TagStatus | 'all') => {
    switch (status) {
      case 'Pending': return AlertCircle;
      case 'Accepted': return CheckCircle;
      case 'In Progress': return Clock;
      case 'Completed': return CheckCircle;
      case 'Rejected': return XCircle;
      default: return Tag;
    }
  };

  const getStatusColor = (status: TagStatus | 'all') => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Accepted': return 'text-blue bg-blue/10 border-blue/20';
      case 'In Progress': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'Completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'Rejected': return 'text-bright-red bg-red-50 border-bright-red';
      default: return 'text-navy bg-navy/10 border-navy/20';
    }
  };

  const statusOptions: (TagStatus | 'all')[] = ['all', 'Pending', 'Accepted', 'In Progress', 'Completed', 'Rejected'];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {statusOptions.map((status) => {
        const StatusIcon = getStatusIcon(status);
        const isActive = statusFilter === status;
        
        return (
          <button
            key={status}
            onClick={() => onStatusFilterChange(status)}
            className={`flex items-center px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${
              isActive 
                ? getStatusColor(status)
                : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <StatusIcon className="w-4 h-4 mr-2" />
            {status === 'all' ? 'All' : status} ({statusCounts[status] || 0})
          </button>
        );
      })}
    </div>
  );
};