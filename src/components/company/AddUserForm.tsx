import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  Shield, 
  Users, 
  User,
  Save,
  X,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { CompanyRole } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';

interface AddUserFormProps {
  onAddUser: (name: string, email: string, password: string, role: CompanyRole, teamId?: string) => Promise<void>;
  onCancel: () => void;
  teams?: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

export const AddUserForm: React.FC<AddUserFormProps> = ({
  onAddUser,
  onCancel,
  teams = [],
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'member' as CompanyRole,
    teamId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onAddUser(
        formData.name.trim(),
        formData.email.trim(),
        formData.password,
        formData.role,
        formData.teamId || undefined
      );
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'member',
        teamId: '',
      });
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({
      ...prev,
      password,
      confirmPassword: password
    }));
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
            Add New Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                error={errors.name}
                required
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                error={errors.email}
                required
              />
            </div>

            {/* Password Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-navy">
                  Password
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generatePassword}
                  className="text-blue hover:text-blue/80"
                >
                  Generate Password
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    error={errors.password}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    error={errors.confirmPassword}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
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

            {/* Info Alert */}
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <div>
                <p className="font-medium">Account Creation</p>
                <p className="text-sm mt-1">
                  The user account will be created immediately with the {selectedRoleOption?.label.toLowerCase()} role. 
                  Make sure to securely share the login credentials with the new team member.
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
                <Save className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};