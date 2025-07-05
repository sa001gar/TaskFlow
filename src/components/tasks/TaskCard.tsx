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
  AlertCircle,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { Tag } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { PriorityBadge } from '../ui/PriorityBadge';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface TaskCardProps {
  task: Tag;
  index?: number;
  onEdit?: (task: Tag) => void;
  onDelete?: (task: Tag) => void;
  canEdit?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  index = 0, 
  onEdit, 
  onDelete, 
  canEdit = false 
}) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getDueDateStatus = () => {
    if (!task.due_date) return null;
    
    const dueDate = new Date(task.due_date);
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    if (isBefore(dueDate, today)) {
      return { status: 'overdue', color: 'text-bright-red', bg: 'bg-red-50 border-bright-red' };
    } else if (isBefore(dueDate, tomorrow)) {
      return { status: 'due-today', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' };
    } else if (isBefore(dueDate, addDays(today, 3))) {
      return { status: 'due-soon', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' };
    }
    return { status: 'normal', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' };
  };

  const dueDateStatus = getDueDateStatus();
  const completedSubtasks = task.subtasks?.filter(t => t.status === 'Completed').length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <Card hover className="h-full">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <Link
                to={`/tags/${task.id}`}
                className="text-lg font-semibold text-navy hover:text-blue transition-colors line-clamp-2 group-hover:text-blue"
              >
                {task.title}
              </Link>
              {task.description && (
                <p className="text-slate-600 mt-2 line-clamp-2 text-sm leading-relaxed">
                  {task.description}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end space-y-2 ml-4">
              <div className="flex items-center space-x-2">
                <StatusBadge status={task.status} size="sm" />
                {canEdit && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center space-x-1">
                      {onEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(task)}
                          className="p-1 h-auto"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(task)}
                          className="p-1 h-auto text-bright-red hover:text-bright-red"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <PriorityBadge priority={task.priority} size="sm" />
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
                  className="bg-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Assignment Info */}
          <div className="flex flex-wrap gap-2 text-sm text-slate-600 mb-4">
            {task.assigned_user && (
              <Badge variant="outline" size="sm" className="border-blue text-blue">
                <User className="w-3 h-3 mr-1" />
                {task.assigned_user.name}
              </Badge>
            )}
            
            {task.assigned_team && (
              <Badge variant="secondary" size="sm">
                <Users className="w-3 h-3 mr-1" />
                {task.assigned_team.name}
              </Badge>
            )}

            <Badge variant="outline" size="sm" className="border-slate-300 text-slate-600">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(task.created_at)}
            </Badge>
          </div>

          {/* Due Date */}
          {task.due_date && dueDateStatus && (
            <div className={`flex items-center text-sm mb-4 px-3 py-2 rounded-lg border ${dueDateStatus.bg}`}>
              <AlertCircle className={`w-4 h-4 mr-2 ${dueDateStatus.color}`} />
              <span className={`font-medium ${dueDateStatus.color}`}>
                Due: {formatDate(task.due_date)}
                {dueDateStatus.status === 'overdue' && ' (Overdue)'}
                {dueDateStatus.status === 'due-today' && ' (Due Today)'}
                {dueDateStatus.status === 'due-soon' && ' (Due Soon)'}
              </span>
            </div>
          )}

          {/* Time Tracking */}
          {(task.estimated_hours || task.actual_hours > 0) && (
            <div className="flex items-center justify-between text-sm text-slate-600 mb-4 bg-cream px-3 py-2 rounded-lg border border-slate-200">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>Time:</span>
              </div>
              <div className="flex items-center space-x-2">
                {task.estimated_hours && (
                  <span className="text-slate-500">Est: {task.estimated_hours}h</span>
                )}
                {task.actual_hours > 0 && (
                  <span className="text-blue font-medium">Actual: {task.actual_hours}h</span>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-4">
              {task.responses && task.responses.length > 0 && (
                <div className="flex items-center text-sm text-slate-500">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  <span>{task.responses.length} comments</span>
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
              {task.link && (
                <a
                  href={task.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-blue hover:bg-blue/10 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              
              <Link to={`/tags/${task.id}`}>
                <Button size="sm" variant="danger" className="text-sm">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};