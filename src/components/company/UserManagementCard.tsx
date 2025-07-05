import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Crown, 
  Shield, 
  User,
  MoreVertical,
  Mail,
  Key,
  Trash2,
  Edit3,
  Copy,
  RefreshCw
} from 'lucide-react';
import { CompanyUser, CompanyRole } from '../../types';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

interface UserManagementCardProps {
  users: CompanyUser[];
  onInviteUser: () => void;
  onUpdateUserRole: (userId: string, role: CompanyRole) => Promise<void>;
  onRemoveUser: (userId: string, userName: string) => Promise<void>;
  onRequestPasswordReset?: (userId: string) => Promise<void>;
  onGenerateTemporaryPassword?: (userId: string) => Promise<string>;
  canManageUsers: boolean;
  currentUserId?: string;
}

interface UserActionsMenuProps {
  user: CompanyUser;
  onUpdateRole: (role: CompanyRole) => void;
  onRemove: () => void;
  onPasswordReset: () => void;
  onGeneratePassword: () => void;
  canManageUsers: boolean;
  isCurrentUser: boolean;
}

const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  user,
  onUpdateRole,
  onRemove,
  onPasswordReset,
  onGeneratePassword,
  canManageUsers,
  isCurrentUser
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CompanyRole>(user.role);

  const handleRoleUpdate = () => {
    onUpdateRole(selectedRole);
    setIsRoleDialogOpen(false);
    setIsOpen(false);
  };

  const roleOptions = [
    { value: 'member', label: 'Member' },
    { value: 'leader', label: 'Team Leader' },
    { value: 'admin', label: 'Administrator' },
    { value: 'superuser', label: 'Super Admin' }
  ];

  if (!canManageUsers) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 h-8 w-8"
      >
        <MoreVertical className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50 min-w-48">
          <button
            onClick={() => {
              setIsRoleDialogOpen(true);
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Change Role
          </button>
          
          <button
            onClick={() => {
              onPasswordReset();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center"
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Password Reset
          </button>
          
          <button
            onClick={() => {
              onGeneratePassword();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center"
          >
            <Key className="w-4 h-4 mr-2" />
            Generate Temp Password
          </button>
          
          {!isCurrentUser && (
            <button
              onClick={() => {
                onRemove();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove User
            </button>
          )}
        </div>
      )}

      <Dialog
        isOpen={isRoleDialogOpen}
        onClose={() => setIsRoleDialogOpen(false)}
        size="sm"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-navy mb-4">
            Change Role for {user.user?.name}
          </h3>
          
          <div className="space-y-4">
            <Select
              label="New Role"
              value={selectedRole}
              onChange={(value) => setSelectedRole(value as CompanyRole)}
              options={roleOptions}
            />
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setIsRoleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRoleUpdate}
              >
                Update Role
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

const getRoleIcon = (role: CompanyRole) => {
  switch (role) {
    case 'superuser':
      return <Crown className="w-4 h-4" />;
    case 'admin':
      return <Shield className="w-4 h-4" />;
    case 'leader':
      return <Users className="w-4 h-4" />;
    default:
      return <User className="w-4 h-4" />;
  }
};

const getRoleBadgeColor = (role: CompanyRole) => {
  switch (role) {
    case 'superuser':
      return 'bg-purple-100 text-purple-800';
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'leader':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const UserManagementCard: React.FC<UserManagementCardProps> = ({
  users,
  onInviteUser,
  onUpdateUserRole,
  onRemoveUser,
  onRequestPasswordReset,
  onGenerateTemporaryPassword,
  canManageUsers,
  currentUserId
}) => {
  const [tempPasswordDialog, setTempPasswordDialog] = useState<{
    isOpen: boolean;
    password: string;
    userName: string;
  }>({
    isOpen: false,
    password: '',
    userName: ''
  });

  const handlePasswordReset = async (userId: string, userName: string) => {
    try {
      if (onRequestPasswordReset) {
        await onRequestPasswordReset(userId);
        toast.success(`Password reset email sent to ${userName}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send password reset email');
    }
  };

  const handleGeneratePassword = async (userId: string, userName: string) => {
    try {
      if (onGenerateTemporaryPassword) {
        const tempPassword = await onGenerateTemporaryPassword(userId);
        setTempPasswordDialog({
          isOpen: true,
          password: tempPassword,
          userName
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate temporary password');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Password copied to clipboard');
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue" />
              Team Members ({users.length})
            </CardTitle>
            {canManageUsers && (
              <Button
                variant="primary"
                size="sm"
                onClick={onInviteUser}
                className="flex items-center"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite User
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {users.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No team members yet</p>
                <p className="text-sm">Invite users to get started</p>
              </div>
            ) : (
              <div className="space-y-1">
                {users.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-navy">
                              {user.user?.name || 'Unknown User'}
                            </h4>
                            {user.user_id === currentUserId && (
                              <Badge variant="secondary" className="text-xs">
                                You
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">
                            {user.user?.email}
                          </p>
                          <div className="flex items-center mt-1">
                            <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                              <span className="flex items-center">
                                {getRoleIcon(user.role)}
                                <span className="ml-1 capitalize">{user.role}</span>
                              </span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <UserActionsMenu
                        user={user}
                        onUpdateRole={(role) => onUpdateUserRole(user.user_id, role)}
                        onRemove={() => onRemoveUser(user.user_id, user.user?.name || 'Unknown User')}
                        onPasswordReset={() => handlePasswordReset(user.user_id, user.user?.name || 'Unknown User')}
                        onGeneratePassword={() => handleGeneratePassword(user.user_id, user.user?.name || 'Unknown User')}
                        canManageUsers={canManageUsers}
                        isCurrentUser={user.user_id === currentUserId}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Temporary Password Dialog */}
      <Dialog
        isOpen={tempPasswordDialog.isOpen}
        onClose={() => setTempPasswordDialog({ isOpen: false, password: '', userName: '' })}
        size="sm"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-navy mb-4">
            Temporary Password Generated
          </h3>
          
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              A temporary password has been generated for <strong>{tempPasswordDialog.userName}</strong>:
            </p>
            
            <div className="bg-slate-50 p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono text-navy">
                  {tempPasswordDialog.password}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(tempPasswordDialog.password)}
                  className="ml-2"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-slate-500">
              Please share this password securely with the user. They should change it upon first login.
            </p>
            
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => setTempPasswordDialog({ isOpen: false, password: '', userName: '' })}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};