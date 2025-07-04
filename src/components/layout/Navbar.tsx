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
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, company, logout } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Teams', href: '/teams', icon: Users },
    { name: 'Tasks', href: '/tags', icon: Tag },
  ];

  const isActive = (path: string) => location.pathname === path;

  const canManageUsers = company?.user_role && ['superuser', 'admin'].includes(company.user_role);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-slate-900">TaskFlow</span>
                {company && (
                  <span className="text-xs text-slate-500 -mt-1">{company.name}</span>
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
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            {canManageUsers && (
              <Link to="/company/users">
                <Button size="sm" variant="outline" className="flex items-center border-slate-300 text-slate-700 hover:bg-slate-100">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
            )}

            <Link to="/tags/new">
              <Button size="sm" className="flex items-center bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </Link>

            <div className="relative group">
              <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-700">{user?.name}</div>
                  {company?.user_role && (
                    <div className="text-xs text-slate-500 flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      {company.user_role}
                    </div>
                  )}
                </div>
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  {company && (
                    <p className="text-xs text-blue-600 mt-1">{company.name}</p>
                  )}
                </div>
                <button className="w-full flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
        className="md:hidden overflow-hidden bg-white border-t border-slate-200"
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
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
            className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Plus className="w-4 h-4 mr-3" />
            New Task
          </Link>

          {canManageUsers && (
            <Link
              to="/company/users"
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <UserPlus className="w-4 h-4 mr-3" />
              Manage Users
            </Link>
          )}

          <div className="border-t border-slate-200 pt-4 mt-4">
            <div className="flex items-center px-3 py-2">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
                {company && (
                  <p className="text-xs text-blue-600">{company.name} • {company.user_role}</p>
                )}
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
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