import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, UserPlus, Shield, Users, Crown } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CompanyRole } from '../../types';
import toast from 'react-hot-toast';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: CompanyRole, teamId?: string) => Promise<void>;
  teams?: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onInvite,
  teams = [],
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'member' as CompanyRole,
    teamId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      await onInvite(formData.email, formData.role, formData.teamId || undefined);
      setFormData({ email: '', role: 'member', teamId: '' });
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const roleOptions = [
    { value: 'member', label: 'Member', icon: Users, description: 'Basic access to assigned tasks' },
    { value: 'leader', label: 'Team Leader', icon: Shield, description: 'Can manage team members and tasks' },
    { value: 'admin', label: 'Admin', icon: Crown, description: 'Full company management access' },
  ];

  const getRoleColor = (role: CompanyRole) => {
    switch (role) {
      case 'admin': return 'border-purple-300 bg-purple-50 text-purple-700';
      case 'leader': return 'border-blue-300 bg-blue-50 text-blue-700';
      case 'member': return 'border-green-300 bg-green-50 text-green-700';
      default: return 'border-slate-300 bg-slate-50 text-slate-700';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Team Member" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter user's email address"
            className="pl-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Select Role
          </label>
          <div className="grid grid-cols-1 gap-3">
            {roleOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: option.value as CompanyRole }))}
                  className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                    formData.role === option.value
                      ? getRoleColor(option.value as CompanyRole)
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start">
                    <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">{option.label}</h3>
                      <p className="text-sm opacity-75 mt-1">{option.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Team Selection */}
        {teams.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assign to Team (Optional)
            </label>
            <select
              name="teamId"
              value={formData.teamId}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 appearance-none bg-white"
            >
              <option value="">No team assignment</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <UserPlus className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Invitation Process</p>
              <p>The user will receive an email invitation with instructions to join your company. They can accept the invitation and create their account.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-6 py-3 border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};