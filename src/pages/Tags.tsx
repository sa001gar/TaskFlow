import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Tag, 
  Plus, 
  Calendar
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useTagsStore } from '../store/tags';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskStatusTabs } from '../components/tasks/TaskStatusTabs';
import { Button } from '../components/ui/Button';
import { Dialog } from '../ui/Dialog';
import { TaskForm } from '../components/tasks/TaskForm';
import { TagStatus, TagPriority } from '../types';
import toast from 'react-hot-toast';

export const Tags: React.FC = () => {
  const { user } = useAuthStore();
  const { tags, fetchTags, updateTag, deleteTag, isLoading } = useTagsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TagStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TagPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'priority' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingTask, setEditingTask] = useState<Tag | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTags(user.id);
    }
  }, [user, fetchTags]);

  const handleEditTask = (task: Tag) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = async (data: any) => {
    if (!editingTask) return;

    try {
      await updateTag(editingTask.id, data);
      toast.success('Task updated successfully!');
      setIsEditDialogOpen(false);
      setEditingTask(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (task: Tag) => {
    if (!window.confirm(`Are you sure you want to delete "${task.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteTag(task.id);
      toast.success('Task deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete task');
    }
  };

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

  const canEditTask = (task: Tag) => {
    return user && (
      task.created_by === user.id || 
      task.assigned_to_user === user.id
    );
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-3xl font-bold text-navy flex items-center">
              <Tag className="w-8 h-8 mr-3 text-blue" />
              Tasks
            </h1>
            <p className="text-slate-600 mt-2">
              Manage and track all your tasks and assignments
            </p>
          </div>
          <Link to="/tags/new">
            <Button variant="danger" className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Create Task
            </Button>
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <TaskStatusTabs
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statusCounts={statusCounts}
        />

        {/* Filters and Search */}
        <div className="mb-8">
          <TaskFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          />
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
            {filteredAndSortedTags.map((task, index) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                index={index}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                canEdit={canEditTask(task)}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-xl border border-slate-200"
          >
            <Tag className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-navy mb-3">
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
              <Button variant="danger">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Task
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Edit Task Dialog */}
        <Dialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingTask(null);
          }}
          size="xl"
        >
          {editingTask && (
            <TaskForm
              onSubmit={handleUpdateTask}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingTask(null);
              }}
              isLoading={isLoading}
              initialData={{
                title: editingTask.title,
                description: editingTask.description,
                link: editingTask.link,
                priority: editingTask.priority,
                assigned_to_team: editingTask.assigned_to_team,
                due_date: editingTask.due_date,
                estimated_hours: editingTask.estimated_hours,
              }}
              mode="edit"
            />
          )}
        </Dialog>
      </div>
    </div>
  );
};