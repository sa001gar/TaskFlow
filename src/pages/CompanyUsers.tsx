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
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Dialog } from '../components/ui/Dialog';
import { UserManagementCard } from '../components/company/UserManagementCard';
import { InviteUserForm } from '../components/company/InviteUserForm';
import { PendingInvitationsCard } from '../components/company/PendingInvitationsCard';
import { PasswordResetCard } from '../components/company/PasswordResetCard';
import { CompanyRole } from '../types';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const CompanyUsers: React.FC = () => {
  const { user, company } = useAuthStore();
  const { 
    companyUsers, 
    invitations,
    passwordResetRequests,
    fetchCompanyUsers, 
    fetchInvitations,
    fetchPasswordResetRequests,
    inviteUser, 
    updateUserRole, 
    removeUser,
    resendInvitation,
    cancelInvitation,
    requestPasswordReset,
    generateTemporaryPassword,
    isLoading 
  } = useCompanyStore();
  const { teams, fetchTeams } = useTeamsStore();

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  useEffect(() => {
    if (user && company) {
      fetchCompanyUsers(company.id);
      fetchInvitations(company.id);
      fetchPasswordResetRequests(company.id);
      fetchTeams(user.id);
    }
  }, [user, company, fetchCompanyUsers, fetchInvitations, fetchPasswordResetRequests, fetchTeams]);

  const handleInviteUser = async (email: string, role: CompanyRole, teamId?: string, message?: string) => {
    if (!company || !user) return;

    try {
      await inviteUser({
        email,
        company_id: company.id,
        team_id: teamId,
        role,
      });
      toast.success('Invitation sent successfully!');
      setIsInviteDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation');
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

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await resendInvitation(invitationId);
      toast.success('Invitation resent successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation(invitationId);
      toast.success('Invitation cancelled successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel invitation');
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Users</p>
                  <p className="text-2xl font-bold text-blue-900">{companyUsers.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Admins</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {companyUsers.filter(u => ['superuser', 'admin'].includes(u.role)).length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Team Leaders</p>
                  <p className="text-2xl font-bold text-green-900">
                    {companyUsers.filter(u => u.role === 'leader').length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Pending Invites</p>
                  <p className="text-2xl font-bold text-orange-900">{invitations.length}</p>
                </div>
                <Mail className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Password Resets</p>
                  <p className="text-2xl font-bold text-red-900">{passwordResetRequests.length}</p>
                </div>
                <Key className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
              onInviteUser={() => setIsInviteDialogOpen(true)}
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
            {/* Pending Invitations */}
            <PendingInvitationsCard
              invitations={invitations}
              onResendInvitation={handleResendInvitation}
              onCancelInvitation={handleCancelInvitation}
              isLoading={isLoading}
            />

            {/* Password Reset Requests */}
            <PasswordResetCard
              requests={passwordResetRequests}
              isLoading={isLoading}
            />
          </motion.div>
        </div>

        {/* Invite User Dialog */}
        <Dialog
          isOpen={isInviteDialogOpen}
          onClose={() => setIsInviteDialogOpen(false)}
          size="lg"
        >
          <InviteUserForm
            onInvite={handleInviteUser}
            onCancel={() => setIsInviteDialogOpen(false)}
            teams={teams}
            isLoading={isLoading}
          />
        </Dialog>
      </div>
    </div>
  );
};