import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  User, 
  Users, 
  MessageSquare, 
  ExternalLink, 
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Tag } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { PriorityBadge } from '../ui/PriorityBadge';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface TagCardProps {
  tag: Tag;
  index?: number;
}

export const TagCard: React.FC<TagCardProps> = ({ tag, index = 0 }) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getDueDateStatus = () => {
    if (!tag.due_date) return null;
    
    const dueDate = new Date(tag.due_date);
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    if (isBefore(dueDate, today)) {
      return { status: 'overdue', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
    } else if (isBefore(dueDate, tomorrow)) {
      return { status: 'due-today', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' };
    } else if (isBefore(dueDate, addDays(today, 3))) {
      return { status: 'due-soon', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' };
    }
    return { status: 'normal', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' };
  };

  const dueDateStatus = getDueDateStatus();
  const completedSubtasks = tag.subtasks?.filter(t => t.status === 'Completed').length || 0;
  const totalSubtasks = tag.subtasks?.length || 0;
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 overflow-hidden"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <Link
              to={`/tags/${tag.id}`}
              className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 group-hover:text-blue-600"
            >
              {tag.title}
            </Link>
            {tag.description && (
              <p className="text-slate-600 mt-2 line-clamp-2 text-sm leading-relaxed">
                {tag.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end space-y-2 ml-4">
            <StatusBadge status={tag.status} size="sm" />
            <PriorityBadge priority={tag.priority} size="sm" />
          </div>
        </div>

        {/* Progress Bar for Subtasks */}
        {totalSubtasks > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Progress</span>
              <span>{completedSubtasks}/{totalSubtasks} subtasks</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Assignment Info */}
        <div className="flex flex-wrap gap-2 text-sm text-slate-600 mb-4">
          {tag.assigned_user && (
            <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              <User className="w-3 h-3 mr-1" />
              <span className="font-medium">{tag.assigned_user.name}</span>
            </div>
          )}
          
          {tag.assigned_team && (
            <div className="flex items-center bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
              <Users className="w-3 h-3 mr-1" />
              <span className="font-medium">{tag.assigned_team.name}</span>
            </div>
          )}

          <div className="flex items-center bg-slate-50 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
            <Calendar className="w-3 h-3 mr-1" />
            <span>{formatDate(tag.created_at)}</span>
          </div>
        </div>

        {/* Due Date */}
        {tag.due_date && dueDateStatus && (
          <div className={`flex items-center text-sm mb-4 px-3 py-2 rounded-lg border ${dueDateStatus.bg}`}>
            <AlertCircle className={`w-4 h-4 mr-2 ${dueDateStatus.color}`} />
            <span className={`font-medium ${dueDateStatus.color}`}>
              Due: {formatDate(tag.due_date)}
              {dueDateStatus.status === 'overdue' && ' (Overdue)'}
              {dueDateStatus.status === 'due-today' && ' (Due Today)'}
              {dueDateStatus.status === 'due-soon' && ' (Due Soon)'}
            </span>
          </div>
        )}

        {/* Time Tracking */}
        {(tag.estimated_hours || tag.actual_hours > 0) && (
          <div className="flex items-center justify-between text-sm text-slate-600 mb-4 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>Time:</span>
            </div>
            <div className="flex items-center space-x-2">
              {tag.estimated_hours && (
                <span className="text-slate-500">Est: {tag.estimated_hours}h</span>
              )}
              {tag.actual_hours > 0 && (
                <span className="text-blue-600 font-medium">Actual: {tag.actual_hours}h</span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-4">
            {tag.responses && tag.responses.length > 0 && (
              <div className="flex items-center text-sm text-slate-500">
                <MessageSquare className="w-4 h-4 mr-1" />
                <span>{tag.responses.length} comments</span>
              </div>
            )}
            
            {totalSubtasks > 0 && (
              <div className="flex items-center text-sm text-slate-500">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                <span>{completedSubtasks}/{totalSubtasks} done</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {tag.link && (
              <a
                href={tag.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            
            <Link
              to={`/tags/${tag.id}`}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};