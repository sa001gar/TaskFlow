import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Tag, 
  Plus, 
  Search, 
  Filter,
  SortAsc,
  Calendar,
  User,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useTagsStore } from '../store/tags';
import { TagCard } from '../components/tags/TagCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TagStatus, TagPriority } from '../types';

export const Tags: React.FC = () => {
  const { user } = useAuthStore();
  const { tags, fetchTags, isLoading } = useTagsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TagStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TagPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'priority' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (user) {
      fetchTags(user.id);
    }
  }, [user, fetchTags]);

  const filteredAndSortedTags = tags
    .filter(tag => {
      const matchesSearch = tag.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tag.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || tag.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || tag.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case 'priority':
          const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'status':
          const statusOrder = { 'Pending': 1, 'Accepted': 2, 'In Progress': 3, 'Completed': 4, 'Rejected': 5 };
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const statusCounts = {
    all: tags.length,
    Pending: tags.filter(t => t.status === 'Pending').length,
    Accepted: tags.filter(t => t.status === 'Accepted').length,
    'In Progress': tags.filter(t => t.status === 'In Progress').length,
    Completed: tags.filter(t => t.status === 'Completed').length,
    Rejected: tags.filter(t => t.status === 'Rejected').length,
  };

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
      case 'Accepted': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'In Progress': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'Completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'Rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center">
              <Tag className="w-8 h-8 mr-3 text-blue-600" />
              Tasks
            </h1>
            <p className="text-slate-600 mt-2">
              Manage and track all your tasks and assignments
            </p>
          </div>
          <Link to="/tags/new">
            <Button className="flex items-center bg-blue-600 hover:bg-blue-700">
              <Plus className="w-5 h-5 mr-2" />
              Create Task
            </Button>
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(Object.keys(statusCounts) as (keyof typeof statusCounts)[]).map((status) => {
            const StatusIcon = getStatusIcon(status as TagStatus | 'all');
            const isActive = statusFilter === status;
            
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status as TagStatus | 'all')}
                className={`flex items-center px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${
                  isActive 
                    ? getStatusColor(status as TagStatus | 'all')
                    : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <StatusIcon className="w-4 h-4 mr-2" />
                {status === 'all' ? 'All' : status} ({statusCounts[status]})
              </button>
            );
          })}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TagPriority | 'all')}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="created_at">Created Date</option>
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center justify-center px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <SortAsc className={`w-5 h-5 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
              <span className="ml-2">{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            </button>
          </div>
        </div>

        {/* Tasks Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedTags.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTags.map((tag, index) => (
              <TagCard key={tag.id} tag={tag} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-xl border border-slate-200"
          >
            <Tag className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                ? 'No tasks found' 
                : 'No tasks yet'
              }
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Create your first task to get started with task management.'
              }
            </p>
            <Link to="/tags/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Task
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};