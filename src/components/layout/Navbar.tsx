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
    { name: 'Dashboard', href: user?.role === 'admin' ? '/admin/dashboard' : '/dashboard', icon: Home },
    { name: 'Teams', href: user?.role === 'admin' ? '/admin/teams' : '/teams', icon: Users },
    { name: 'Tasks', href: user?.role === 'admin' ? '/admin/tags' : '/tags', icon: Tag },
  ];

  const adminNavigation = [
    { name: 'Users', href: '/admin/users', icon: UserPlus },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-primary-dark border-b-2 border-primary-700 sticky top-0 z-40 shadow-strong">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent-red rounded-2xl flex items-center justify-center shadow-medium">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white">TaskFlow</span>
                {company && (
                  <span className="text-xs text-gray -mt-1">{company.name}</span>
                )}
              </div>
            </Link>

            <div className="hidden md:ml-10 md:flex md:space-x-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-accent-red text-white shadow-medium'
                        : 'text-gray hover:text-white hover:bg-primary-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
              
              {user?.role === 'admin' && adminNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-accent-red text-white shadow-medium'
                        : 'text-gray hover:text-white hover:bg-primary-700'
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
            <Link to={user?.role === 'admin' ? '/admin/tags/new' : '/tags/new'}>
              <Button size="sm" variant="secondary" className="flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </Link>

            <div className="relative group">
              <button className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-primary-700 transition-colors">
                <div className="w-10 h-10 bg-accent-red rounded-2xl flex items-center justify-center shadow-medium">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">{user?.name}</div>
                  <div className="text-xs text-gray flex items-center">
                    <Shield className="w-3 h-3 mr-1" />
                    {user?.role}
                  </div>
                </div>
              </button>

              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-strong border-2 border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="px-4 py-3 border-b border-light-bg">
                  <p className="text-sm font-semibold text-primary-dark">{user?.name}</p>
                  <p className="text-xs text-gray">{user?.email}</p>
                  {company && (
                    <p className="text-xs text-accent-red mt-1 font-medium">{company.name}</p>
                  )}
                </div>
                <button className="w-full flex items-center px-4 py-3 text-sm text-primary-dark hover:bg-light-bg transition-colors">
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center px-4 py-3 text-sm text-accent-red hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-2xl text-gray hover:text-white hover:bg-primary-700 transition-colors"
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
        className="md:hidden overflow-hidden bg-primary-800 border-t border-primary-700"
      >
        <div className="px-4 py-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                  isActive(item.href)
                    ? 'bg-accent-red text-white'
                    : 'text-gray hover:text-white hover:bg-primary-700'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
          
          {user?.role === 'admin' && adminNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                  isActive(item.href)
                    ? 'bg-accent-red text-white'
                    : 'text-gray hover:text-white hover:bg-primary-700'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
          
          <Link
            to={user?.role === 'admin' ? '/admin/tags/new' : '/tags/new'}
            className="flex items-center px-3 py-3 rounded-2xl text-sm font-semibold text-accent-red hover:bg-red-50 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Plus className="w-5 h-5 mr-3" />
            New Task
          </Link>

          <div className="border-t border-primary-700 pt-4 mt-4">
            <div className="flex items-center px-3 py-3">
              <div className="w-10 h-10 bg-accent-red rounded-2xl flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-gray">{user?.email}</p>
                {company && (
                  <p className="text-xs text-accent-red font-medium">{company.name} • {user?.role}</p>
                )}
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-3 text-sm text-accent-red hover:bg-red-50 rounded-2xl transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </motion.div>
    </nav>
  );
};