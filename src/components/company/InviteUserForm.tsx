import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  UserPlus, 
  Shield, 
  Users, 
  Crown, 
  User,
  Send,
  X,
  AlertCircle
} from 'lucide-react';
import { CompanyRole } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';

interface InviteUserFormProps {
  onInvite: (email: string, role: CompanyRole, teamId?: string, message?: string) => Promise<void>;
  onCancel: () => void;
  teams?: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

export const InviteUserForm: React.FC<InviteUserFormProps> = ({
  onInvite,
  onCancel,
  teams = [],
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'member' as CompanyRole,
    teamId: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onInvite(
        formData.email.trim(),
        formData.role,
        formData.teamId || undefined,
        formData.message.trim() || undefined
      );
      
      // Reset form
      setFormData({
        email: '',
        role: 'member',
        teamId: '',
        message: '',
      });
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const roleOptions = [
    { 
      value: 'member', 
      label: 'Member', 
      icon: User, 
      description: 'Basic access to assigned tasks and team collaboration',
      color: 'text-slate-600'
    },
    { 
      value: 'leader', 
      label: 'Team Leader', 
      icon: Users, 
      description: 'Can manage team members and lead project initiatives',
      color: 'text-green-600'
    },
    { 
      value: 'admin', 
      label: 'Administrator', 
      icon: Shield, 
      description: 'Full company management access and user administration',
      color: 'text-blue-600'
    },
  ];

  const selectedRoleOption = roleOptions.find(option => option.value === formData.role);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="w-6 h-6 text-blue mr-3" />
            Invite New Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter the user's email address"
                error={errors.email}
                required
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-navy mb-3">
                Select Role
              </label>
              <div className="space-y-3">
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = formData.role === option.value;
                  
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: option.value as CompanyRole }))}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-blue bg-blue/5 text-navy'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <Icon className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${isSelected ? 'text-blue' : option.color}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{option.label}</h3>
                            {isSelected && (
                              <Badge variant="secondary" size="sm">
                                Selected
                              </Badge>
                            )}
                          </div>
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
                <Select
                  label="Assign to Team (Optional)"
                  name="teamId"
                  value={formData.teamId}
                  onChange={handleInputChange}
                >
                  <option value="">No team assignment</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Personal Message */}
            <div>
              <Textarea
                label="Personal Message (Optional)"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Add a personal welcome message for the new team member..."
                rows={3}
              />
            </div>

            {/* Info Alert */}
            <Alert>
              <Mail className="w-4 h-4" />
              <div>
                <p className="font-medium">Invitation Process</p>
                <p className="text-sm mt-1">
                  The user will receive an email invitation with instructions to join your company. 
                  They can accept the invitation and create their account with the {selectedRoleOption?.label.toLowerCase()} role.
                </p>
              </div>
            </Alert>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="px-6 py-3"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                isLoading={isLoading}
                className="px-8 py-3"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};