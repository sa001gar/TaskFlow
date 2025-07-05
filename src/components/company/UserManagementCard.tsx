import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  Users, 
  Crown, 
  Shield, 
  User,
  Mail,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  X,
  Check
} from 'lucide-react';
import { CompanyUser, CompanyRole } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';

interface UserManagementCardProps {
  users: CompanyUser[];
  onInviteUser: () => void;
  onUpdateUserRole: (userId: string, role: CompanyRole) => void;
  onRemoveUser: (userId: string, userName: string) => void;
  canManageUsers: boolean;
  currentUserId?: string;
}

export const UserManagementCard: React.FC<UserManagementCardProps> = ({
  users,
  onInviteUser,
  onUpdateUserRole,
  onRemoveUser,
  canManageUsers,
  currentUserId
}) => {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

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

  const getRoleName = (role: CompanyRole) => {
    switch (role) {
      case 'superuser': return 'Super Admin';
      case 'admin': return 'Administrator';
      case 'leader': return 'Team Leader';
      case 'member': return 'Member';
      default: return 'Member';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 text-blue mr-2" />
            Team Members ({users.length})
          </CardTitle>
          {canManageUsers && (
            <Button
              size="sm"
              variant="danger"
              onClick={onInviteUser}
              className="flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <Alert>
            <Users className="w-4 h-4" />
            <div>
              <p className="font-medium">No team members yet</p>
              <p className="text-sm mt-1">Start by inviting users to join your company.</p>
            </div>
          </Alert>
        ) : (
          <div className="space-y-3">
            {users.map((companyUser) => {
              const RoleIcon = getRoleIcon(companyUser.role);
              const isCurrentUser = companyUser.user_id === currentUserId;
              const isExpanded = expandedUser === companyUser.user_id;
              
              return (
                <motion.div
                  key={companyUser.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-cream rounded-xl border border-slate-200 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue to-navy rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {companyUser.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-navy">
                              {companyUser.user.name}
                              {isCurrentUser && (
                                <Badge variant="outline" size="sm" className="ml-2">
                                  You
                                </Badge>
                              )}
                            </h3>
                          </div>
                          <p className="text-sm text-slate-600">{companyUser.user.email}</p>
                          <div className="flex items-center mt-1">
                            <Badge 
                              variant="outline" 
                              size="sm" 
                              className={getRoleColor(companyUser.role)}
                            >
                              <RoleIcon className="w-3 h-3 mr-1" />
                              {getRoleName(companyUser.role)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedUser(isExpanded ? null : companyUser.user_id)}
                          className="p-2"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-slate-200"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600 mb-1">Joined Date</p>
                            <p className="font-medium text-navy">
                              {new Date(companyUser.joined_at || companyUser.invited_at).toLocaleDateString()}
                            </p>
                          </div>
                          {companyUser.invited_by_user && (
                            <div>
                              <p className="text-slate-600 mb-1">Invited By</p>
                              <p className="font-medium text-navy">
                                {companyUser.invited_by_user.name}
                              </p>
                            </div>
                          )}
                        </div>

                        {canManageUsers && !isCurrentUser && (
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                            <div className="flex items-center space-x-2">
                              <label className="text-sm font-medium text-slate-700">Role:</label>
                              <select
                                value={companyUser.role}
                                onChange={(e) => onUpdateUserRole(companyUser.user_id, e.target.value as CompanyRole)}
                                className="text-sm border border-slate-300 rounded px-2 py-1 bg-white"
                              >
                                <option value="member">Member</option>
                                <option value="leader">Team Leader</option>
                                <option value="admin">Administrator</option>
                              </select>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onRemoveUser(companyUser.user_id, companyUser.user.name)}
                              className="text-bright-red border-bright-red hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};