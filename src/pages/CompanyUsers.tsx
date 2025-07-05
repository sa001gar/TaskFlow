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
  Building2
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
import { CompanyRole } from '../types';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const CompanyUsers: React.FC = () => {
  const { user, company } = useAuthStore();
  const { 
    companyUsers, 
    invitations, 
    fetchCompanyUsers, 
    fetchInvitations, 
    inviteUser, 
    updateUserRole, 
    removeUser,
    resendInvitation,
    cancelInvitation,
    isLoading 
  } = useCompanyStore();
  const { teams, fetchTeams } = useTeamsStore();

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  useEffect(() => {
    if (user && company) {
      fetchCompanyUsers(company.id);
      fetchInvitations(company.id);
      fetchTeams(user.id);
    }
  }, [user, company, fetchCompanyUsers, fetchInvitations, fetchTeams]);

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
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-blue mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-navy">User Management</h1>
                <p className="text-slate-600 mt-1">
                  Manage your team members and their permissions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Users</p>
                  <p className="text-2xl font-bold text-navy">{companyUsers.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Admins</p>
                  <p className="text-2xl font-bold text-navy">
                    {companyUsers.filter(u => ['superuser', 'admin'].includes(u.role)).length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Team Leaders</p>
                  <p className="text-2xl font-bold text-navy">
                    {companyUsers.filter(u => u.role === 'leader').length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending Invites</p>
                  <p className="text-2xl font-bold text-navy">{invitations.length}</p>
                </div>
                <Mail className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management */}
          <div>
            <UserManagementCard
              users={companyUsers}
              onInviteUser={() => setIsInviteDialogOpen(true)}
              onUpdateUserRole={handleUpdateRole}
              onRemoveUser={handleRemoveUser}
              canManageUsers={canManageUsers}
              currentUserId={user?.id}
            />
          </div>

          {/* Pending Invitations */}
          <div>
            <PendingInvitationsCard
              invitations={invitations}
              onResendInvitation={handleResendInvitation}
              onCancelInvitation={handleCancelInvitation}
              isLoading={isLoading}
            />
          </div>
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