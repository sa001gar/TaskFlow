import React from 'react';
import { Search, Filter, SortAsc } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { TagStatus, TagPriority } from '../../types';

interface TaskFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: TagStatus | 'all';
  onStatusFilterChange: (value: TagStatus | 'all') => void;
  priorityFilter: TagPriority | 'all';
  onPriorityFilterChange: (value: TagPriority | 'all') => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: () => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as TagStatus | 'all')}
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Rejected">Rejected</option>
          </Select>

          <Select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value as TagPriority | 'all')}
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </Select>

          <div className="flex space-x-2">
            <Select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="flex-1"
            >
              <option value="created_at">Created Date</option>
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </Select>

            <Button
              variant="outline"
              onClick={onSortOrderChange}
              className="px-3"
            >
              <SortAsc className={`w-5 h-5 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};