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
  MoreVertical,
  Edit,
  Trash2,
  Send,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useCompanyStore } from '../store/company';
import { useTeamsStore } from '../store/teams';
import { Button } from '../components/ui/Button';
import { InviteUserModal } from '../components/company/InviteUserModal';
import { CompanyRole } from '../types';
import toast from 'react-hot-toast';

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

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    if (user && company) {
      fetchCompanyUsers(company.id);
      fetchInvitations(company.id);
      fetchTeams(user.id);
    }
  }, [user, company, fetchCompanyUsers, fetchInvitations, fetchTeams]);

  const handleInviteUser = async (email: string, role: CompanyRole, teamId?: string) => {
    if (!company || !user) return;

    try {
      await inviteUser({
        email,
        company_id: company.id,
        team_id: teamId,
        role,
      });
      toast.success('Invitation sent successfully!');
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

  const getRoleIcon = (role: CompanyRole) => {
    switch (role) {
      case 'superuser': return Crown;
      case 'admin': return Shield;
      case 'leader': return Users;
      case 'member': return User;
      default: return User;
    }
  };

  const getRoleColor = (role: CompanyRole) => {
    switch (role) {
      case 'superuser': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'leader': return 'bg-green-100 text-green-800 border-green-200';
      case 'member': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const canManageUsers = company?.user_role && ['superuser', 'admin'].includes(company.user_role);

  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-20 h-20 text-slate-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Access Denied</h3>
          <p className="text-slate-600">You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              Company Users
            </h1>
            <p className="text-slate-600 mt-2">
              Manage your team members and their permissions
            </p>
          </div>
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Invite User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Users</p>
                <p className="text-2xl font-bold text-slate-900">{companyUsers.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Admins</p>
                <p className="text-2xl font-bold text-slate-900">
                  {companyUsers.filter(u => ['superuser', 'admin'].includes(u.role)).length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Team Leaders</p>
                <p className="text-2xl font-bold text-slate-900">
                  {companyUsers.filter(u => u.role === 'leader').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending Invites</p>
                <p className="text-2xl font-bold text-slate-900">{invitations.length}</p>
              </div>
              <Mail className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-xl border border-slate-200 mb-8">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Active Users</h2>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 animate-pulse">
                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                    </div>
                    <div className="h-6 bg-slate-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : companyUsers.length > 0 ? (
              <div className="space-y-4">
                {companyUsers.map((companyUser) => {
                  const RoleIcon = getRoleIcon(companyUser.role);
                  return (
                    <motion.div
                      key={companyUser.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {companyUser.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{companyUser.user.name}</h3>
                          <p className="text-sm text-slate-600">{companyUser.user.email}</p>
                          <p className="text-xs text-slate-500 flex items-center mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            Joined {new Date(companyUser.joined_at || companyUser.invited_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(companyUser.role)}`}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {companyUser.role}
                        </span>
                        
                        {companyUser.user_id !== user?.id && company?.user_role === 'superuser' && (
                          <div className="flex items-center space-x-2">
                            <select
                              value={companyUser.role}
                              onChange={(e) => handleUpdateRole(companyUser.user_id, e.target.value as CompanyRole)}
                              className="text-xs border border-slate-300 rounded px-2 py-1"
                            >
                              <option value="member">Member</option>
                              <option value="leader">Leader</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleRemoveUser(companyUser.user_id, companyUser.user.name)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No users found</h3>
                <p className="text-slate-600">Start by inviting team members to your company.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Pending Invitations</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <motion.div
                    key={invitation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Mail className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{invitation.email}</h3>
                        <p className="text-sm text-slate-600">
                          Invited as {invitation.role} • {new Date(invitation.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          Expires {new Date(invitation.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleResendInvitation(invitation.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Resend invitation"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cancel invitation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Invite User Modal */}
        <InviteUserModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onInvite={handleInviteUser}
          teams={teams}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};