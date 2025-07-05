import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Shield, 
  User,
  Mail,
  Key,
  Trash2,
  Edit,
  MoreVertical,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useUsersStore } from '../../store/users';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { CreateUserRequest } from '../../types';
import toast from 'react-hot-toast';

export const AdminUsers: React.FC = () => {
  const { user, company } = useAuthStore();
  const { 
    users, 
    passwordResets,
    fetchUsers, 
    fetchPasswordResets,
    createUser, 
    updateUser, 
    deleteUser,
    requestPasswordReset,
    resetPassword,
    isLoading 
  } = useUsersStore();

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<CreateUserRequest>({
    name: '',
    email: '',
    password: '',
    role: 'staff',
  });

  useEffect(() => {
    if (user && company) {
      fetchUsers(company.id);
      fetchPasswordResets(company.id);
    }
  }, [user, company, fetchUsers, fetchPasswordResets]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    try {
      await createUser(formData, company.id);
      toast.success('User created successfully!');
      setIsAddUserModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'staff' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleRequestPasswordReset = async (userId: string, userName: string) => {
    if (!company) return;

    try {
      await requestPasswordReset(userId, company.id);
      toast.success(`Password reset email sent to ${userName}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send password reset email');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await resetPassword(selectedUser.id, newPassword);
      toast.success(`Password updated for ${selectedUser.name}`);
      setIsResetPasswordModalOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(userId);
      toast.success('User deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const generateNewPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-accent-red" />;
      default:
        return <User className="w-4 h-4 text-gray" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-accent-red/10 text-accent-red border-accent-red/20';
      default:
        return 'bg-gray/10 text-gray border-gray/20';
    }
  };

  return (
    <div className="min-h-screen bg-light-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-primary-dark flex items-center">
                <Users className="w-10 h-10 mr-4 text-accent-red" />
                User Management
              </h1>
              <p className="text-gray mt-2 text-lg">
                Manage your team members and their access
              </p>
            </div>
            <Button
              onClick={() => setIsAddUserModalOpen(true)}
              variant="secondary"
              size="lg"
              className="flex items-center"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Add User
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray mb-1">Total Users</p>
                    <p className="text-3xl font-bold text-primary-dark">{users.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-dark to-primary-800 rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray mb-1">Admins</p>
                    <p className="text-3xl font-bold text-primary-dark">
                      {users.filter(u => u.role === 'admin').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-red to-deep-red rounded-2xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray mb-1">Password Resets</p>
                    <p className="text-3xl font-bold text-primary-dark">{passwordResets.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Users List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-primary-dark mb-2">No users yet</h3>
                  <p className="text-gray mb-6">Add your first team member to get started</p>
                  <Button
                    onClick={() => setIsAddUserModalOpen(true)}
                    variant="secondary"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Add First User
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((userItem, index) => (
                    <motion.div
                      key={userItem.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-light-bg rounded-2xl hover:shadow-medium transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-dark to-primary-800 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                          {userItem.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="font-bold text-primary-dark">{userItem.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(userItem.role)}`}>
                              {getRoleIcon(userItem.role)}
                              <span className="ml-1 capitalize">{userItem.role}</span>
                            </span>
                          </div>
                          <p className="text-gray">{userItem.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRequestPasswordReset(userItem.id, userItem.name)}
                          className="flex items-center"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Reset Email
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(userItem);
                            setIsResetPasswordModalOpen(true);
                          }}
                          className="flex items-center"
                        >
                          <Key className="w-4 h-4 mr-1" />
                          Change Password
                        </Button>
                        {userItem.id !== user?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(userItem.id, userItem.name)}
                            className="flex items-center text-accent-red hover:text-deep-red"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Add User Modal */}
        <Modal
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
          title="Add New User"
          size="lg"
        >
          <form onSubmit={handleCreateUser} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                icon={<User className="w-5 h-5" />}
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                icon={<Mail className="w-5 h-5" />}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-primary-dark">
                  Password
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generatePassword}
                  className="text-accent-red hover:text-deep-red"
                >
                  Generate Password
                </Button>
              </div>
              
              <Input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                icon={<Key className="w-5 h-5" />}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary-dark mb-3">
                Role
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'staff' }))}
                  className={`p-4 border-2 rounded-2xl text-left transition-all duration-200 ${
                    formData.role === 'staff'
                      ? 'border-primary-dark bg-primary-dark/5 text-primary-dark'
                      : 'border-gray-300 bg-white text-gray hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center">
                    <User className="w-5 h-5 mr-3" />
                    <div>
                      <h3 className="font-semibold">Staff</h3>
                      <p className="text-sm opacity-75">Basic access to assigned tasks</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                  className={`p-4 border-2 rounded-2xl text-left transition-all duration-200 ${
                    formData.role === 'admin'
                      ? 'border-accent-red bg-accent-red/5 text-accent-red'
                      : 'border-gray-300 bg-white text-gray hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 mr-3" />
                    <div>
                      <h3 className="font-semibold">Admin</h3>
                      <p className="text-sm opacity-75">Full company management access</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t-2 border-light-bg">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddUserModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="secondary"
                isLoading={isLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </div>
          </form>
        </Modal>

        {/* Reset Password Modal */}
        <Modal
          isOpen={isResetPasswordModalOpen}
          onClose={() => {
            setIsResetPasswordModalOpen(false);
            setSelectedUser(null);
            setNewPassword('');
          }}
          title={`Reset Password for ${selectedUser?.name}`}
          size="md"
        >
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-primary-dark">
                  New Password
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateNewPassword}
                  className="text-accent-red hover:text-deep-red"
                >
                  Generate Password
                </Button>
              </div>
              
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  icon={<Key className="w-5 h-5" />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray hover:text-primary-dark transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t-2 border-light-bg">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsResetPasswordModalOpen(false);
                  setSelectedUser(null);
                  setNewPassword('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="secondary"
                isLoading={isLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                Update Password
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};