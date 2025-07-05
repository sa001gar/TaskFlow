import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users, 
  Tag, 
  Plus, 
  User, 
  LogOut, 
  Menu, 
  X,
  Settings,
  Bell,
  Building2,
  UserPlus,
  Shield
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useNotificationStore } from '../../store/notifications';
import { Button } from '../ui/Button';
import { NotificationCenter } from '../ui/Notification';

export const Navbar: React.FC = () => {
  const { user, company, logout } = useAuthStore();
  const { 
    notifications, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    dismissNotification,
    isLoading: notificationsLoading 
  } = useNotificationStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Teams', href: '/teams', icon: Users },
    { name: 'Tasks', href: '/tags', icon: Tag },
  ];

  const isActive = (path: string) => location.pathname === path;

  const canManageUsers = company?.user_role && ['superuser', 'admin'].includes(company.user_role);

  React.useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
    }
  }, [user, fetchNotifications]);

  return (
    <nav className="bg-navy border-b border-navy/20 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white">TaskFlow</span>
                {company && (
                  <span className="text-xs text-blue -mt-1">{company.name}</span>
                )}
              </div>
            </Link>

            <div className="hidden md:ml-10 md:flex md:space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'bg-blue text-white'
                        : 'text-blue hover:text-white hover:bg-navy/80'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-4">
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDismiss={dismissNotification}
              isLoading={notificationsLoading}
            />

            {canManageUsers && (
              <Link to="/company/users">
                <Button size="sm" variant="outline" className="flex items-center border-blue text-blue hover:bg-blue hover:text-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
            )}

            <Link to="/tags/new">
              <Button size="sm" variant="danger" className="flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </Link>

            <div className="relative group">
              <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-navy/80 transition-colors">
                <div className="w-8 h-8 bg-blue rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">{user?.name}</div>
                  {company?.user_role && (
                    <div className="text-xs text-blue flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      {company.user_role}
                    </div>
                  )}
                </div>
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-navy">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  {company && (
                    <p className="text-xs text-blue mt-1">{company.name}</p>
                  )}
                </div>
                <button className="w-full flex items-center px-4 py-2 text-sm text-navy hover:bg-cream">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center px-4 py-2 text-sm text-bright-red hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-blue hover:text-white hover:bg-navy/80"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div
        initial={false}
        animate={{ height: isMobileMenuOpen ? 'auto' : 0 }}
        className="md:hidden overflow-hidden bg-navy border-t border-navy/20"
      >
        <div className="px-4 py-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(item.href)
                    ? 'bg-blue text-white'
                    : 'text-blue hover:text-white hover:bg-navy/80'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.name}
              </Link>
            );
          })}
          
          <Link
            to="/tags/new"
            className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-bright-red hover:bg-red-50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Plus className="w-4 h-4 mr-3" />
            New Task
          </Link>

          {canManageUsers && (
            <Link
              to="/company/users"
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-blue hover:bg-blue/10"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <UserPlus className="w-4 h-4 mr-3" />
              Manage Users
            </Link>
          )}

          <div className="border-t border-navy/20 pt-4 mt-4">
            <div className="flex items-center px-3 py-2">
              <div className="w-8 h-8 bg-blue rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
                {company && (
                  <p className="text-xs text-blue">{company.name} • {company.user_role}</p>
                )}
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm text-bright-red hover:bg-red-50 rounded-lg"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </motion.div>
    </nav>
  );
};