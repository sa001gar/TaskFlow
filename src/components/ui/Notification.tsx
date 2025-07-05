import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Clock,
  User,
  Tag,
  Users
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';

interface Notification {
  id: string;
  type: 'task_assigned' | 'task_due_soon' | 'task_overdue' | 'task_status_changed' | 'task_comment_added' | 'team_invitation' | 'team_member_added' | 'company_invitation';
  title: string;
  message: string;
  data?: any;
  read_at?: string;
  created_at: string;
  expires_at?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (notificationId: string) => void;
  isLoading?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read_at).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
      case 'task_status_changed':
        return Tag;
      case 'task_due_soon':
      case 'task_overdue':
        return Clock;
      case 'task_comment_added':
        return Info;
      case 'team_invitation':
      case 'team_member_added':
        return Users;
      case 'company_invitation':
        return User;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return 'text-blue-600 bg-blue-50';
      case 'task_due_soon':
        return 'text-yellow-600 bg-yellow-50';
      case 'task_overdue':
        return 'text-red-600 bg-red-50';
      case 'task_status_changed':
        return 'text-green-600 bg-green-50';
      case 'task_comment_added':
        return 'text-purple-600 bg-purple-50';
      case 'team_invitation':
      case 'team_member_added':
        return 'text-indigo-600 bg-indigo-50';
      case 'company_invitation':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-navy/10"
      >
        <Bell className="w-5 h-5 text-blue" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0 min-w-0"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-96 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-navy">Notifications</h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onMarkAllAsRead}
                        className="text-xs text-blue hover:text-blue/80"
                      >
                        Mark all read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue mx-auto"></div>
                    <p className="text-sm text-slate-500 mt-2">Loading...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No notifications</p>
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      const colorClasses = getNotificationColor(notification.type);
                      const isUnread = !notification.read_at;
                      
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                            isUnread ? 'bg-blue-50/50' : ''
                          }`}
                          onClick={() => {
                            if (isUnread) {
                              onMarkAsRead(notification.id);
                            }
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4 className={`text-sm font-medium text-navy ${isUnread ? 'font-semibold' : ''}`}>
                                  {notification.title}
                                </h4>
                                <div className="flex items-center space-x-2 ml-2">
                                  {isUnread && (
                                    <div className="w-2 h-2 bg-blue rounded-full"></div>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDismiss(notification.id);
                                    }}
                                    className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              
                              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              
                              <p className="text-xs text-slate-500 mt-2">
                                {formatTimeAgo(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};