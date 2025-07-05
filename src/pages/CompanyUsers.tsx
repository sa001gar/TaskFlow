import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Crown, 
  Shield, 
  User,
  Mail,
  Calendar,
  ArrowLeft,
  Building2,
  Key,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useCompanyStore } from '../store/company';
import { useTeamsStore } from '../store/teams';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { UserManagementCard } from '../components/company/UserManagementCard';
import { AddUserForm } from '../components/company/AddUserForm';
import { PasswordResetCard } from '../components/company/PasswordResetCard';
import { Card, CardContent } from '../components/ui/Card';
import { CompanyRole } from '../types';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const CompanyUsers: React.FC = () => {
  const { user, company } = useAuthStore();
  const { 
    companyUsers, 
    passwordResetRequests,
    fetchCompanyUsers, 
    fetchPasswordResetRequests,
    createUser,
    updateUserRole, 
    removeUser,
    resendInvitation,
    cancelInvitation,
    requestPasswordReset,
    generateTemporaryPassword,
    isLoading 
  } = useCompanyStore();
  const { teams, fetchTeams } = useTeamsStore();

  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  useEffect(() => {
    if (user && company) {
      fetchCompanyUsers(company.id);
      fetchPasswordResetRequests(company.id);
      fetchTeams(user.id);
    }
  }, [user, company, fetchCompanyUsers, fetchInvitations, fetchPasswordResetRequests, fetchTeams]);

  const handleAddUser = async (name: string, email: string, password: string, role: CompanyRole, teamId?: string) => {
    if (!company || !user) return;

    try {
      await createUser({
        name,
        email,
        password,
        role,
        teamId,
      }, company.id);
      toast.success('User created successfully!');
      setIsAddUserDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: CompanyRole) => {
    if (!company) return;

    try {
      await updateUserRole(userId, company.id, newRole);
      toast.success('User role updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user role');
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!company) return;

    if (!window.confirm(`Are you sure you want to remove ${userName} from the company?`)) {
      return;
    }

    try {
      await removeUser(userId, company.id);
      toast.success('User removed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove user');
    }
  };

  const handleRequestPasswordReset = async (userId: string) => {
    if (!company) return;

    try {
      await requestPasswordReset(userId, company.id);
    } catch (error: any) {
      throw error;
    }
  };

  const handleGenerateTemporaryPassword = async (userId: string) => {
    if (!company) return '';

    try {
      return await generateTemporaryPassword(userId, company.id);
    } catch (error: any) {
      throw error;
    }
  };

  const canManageUsers = company?.user_role && ['superuser', 'admin'].includes(company.user_role);

  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Shield className="w-20 h-20 text-slate-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-navy mb-3">Access Denied</h3>
          <p className="text-slate-600 mb-6">You don't have permission to manage users.</p>
          <Link to="/dashboard">
            <Button variant="primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="mr-4 hover:bg-white/50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-navy">User Management</h1>
                <p className="text-slate-600 mt-1">
                  Manage your team members, permissions, and security
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {[
            {
              title: "Total Users",
              value: companyUsers.length,
              icon: Users,
              gradient: "from-blue-500 to-blue-600",
              bgGradient: "from-blue-50 to-blue-100",
              textColor: "text-blue-700",
              iconColor: "text-blue-600"
            },
            {
              title: "Admins",
              value: companyUsers.filter(u => ['superuser', 'admin'].includes(u.role)).length,
              icon: Shield,
              gradient: "from-purple-500 to-purple-600",
              bgGradient: "from-purple-50 to-purple-100",
              textColor: "text-purple-700",
              iconColor: "text-purple-600"
            },
            {
              title: "Team Leaders",
              value: companyUsers.filter(u => u.role === 'leader').length,
              icon: Users,
              gradient: "from-green-500 to-green-600",
              bgGradient: "from-green-50 to-green-100",
              textColor: "text-green-700",
              iconColor: "text-green-600"
            },
            {
              title: "Password Resets",
              value: passwordResetRequests.length,
              icon: Key,
              gradient: "from-red-500 to-red-600",
              bgGradient: "from-red-50 to-red-100",
              textColor: "text-red-700",
              iconColor: "text-red-600"
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card className={`bg-gradient-to-br ${stat.bgGradient} border-opacity-20 hover:shadow-lg transition-all duration-300`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs sm:text-sm font-medium ${stat.textColor}`}>{stat.title}</p>
                      <p className={`text-xl sm:text-2xl font-bold ${stat.textColor.replace('700', '900')}`}>
                        {stat.value}
                      </p>
                    </div>
                    <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.iconColor}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Management */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <UserManagementCard
              users={companyUsers}
              onAddUser={() => setIsAddUserDialogOpen(true)}
              onUpdateUserRole={handleUpdateRole}
              onRemoveUser={handleRemoveUser}
              onRequestPasswordReset={handleRequestPasswordReset}
              onGenerateTemporaryPassword={handleGenerateTemporaryPassword}
              canManageUsers={canManageUsers}
              currentUserId={user?.id}
            />
          </motion.div>

          {/* Side Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Password Reset Requests */}
            <PasswordResetCard
              requests={passwordResetRequests}
              isLoading={isLoading}
            />
          </motion.div>
        </div>

        {/* Add User Dialog */}
        <Dialog
          isOpen={isAddUserDialogOpen}
          onClose={() => setIsAddUserDialogOpen(false)}
          size="lg"
        >
          <AddUserForm
            onAddUser={handleAddUser}
            onCancel={() => setIsAddUserDialogOpen(false)}
            teams={teams}
            isLoading={isLoading}
          />
        </Dialog>
      </div>
    </div>
  );
};