import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Building2, Globe, FileText, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyDescription: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      await register(
        formData.name,
        formData.email,
        formData.password,
        {
          name: formData.companyName,
          description: formData.companyDescription,
        }
      );
      toast.success('Company and account created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-bg via-white to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-3xl shadow-strong border-2 border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-8 py-8 bg-gradient-to-r from-primary-dark to-primary-800 text-white">
            <div className="text-center">
              <div className="w-20 h-20 bg-accent-red rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-medium">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Create Your Company</h1>
              <p className="text-gray-300">Start your team collaboration journey</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
              {/* Company Information */}
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <Building2 className="w-6 h-6 text-accent-red mr-3" />
                  <h2 className="text-xl font-bold text-primary-dark">Company Information</h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <Input
                    label="Company Name"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Enter your company name"
                    icon={<Building2 className="w-5 h-5" />}
                    required
                  />

                  <div>
                    <label className="block text-sm font-semibold text-primary-dark mb-2">
                      Company Description (Optional)
                    </label>
                    <textarea
                      name="companyDescription"
                      value={formData.companyDescription}
                      onChange={handleInputChange}
                      placeholder="Describe what your company does..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-red focus:border-transparent transition-all duration-200 resize-none text-primary-dark placeholder-gray"
                    />
                  </div>
                </div>
              </div>

              {/* Admin Account */}
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <User className="w-6 h-6 text-accent-red mr-3" />
                  <h2 className="text-xl font-bold text-primary-dark">Admin Account</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    icon={<User className="w-5 h-5" />}
                    required
                  />

                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    icon={<Mail className="w-5 h-5" />}
                    required
                  />

                  <div className="relative">
                    <Input
                      label="Password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a strong password"
                      icon={<Lock className="w-5 h-5" />}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-11 text-gray hover:text-primary-dark transition-colors"
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
                      placeholder="Confirm your password"
                      icon={<Lock className="w-5 h-5" />}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-11 text-gray hover:text-primary-dark transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Features Info */}
              <div className="bg-gradient-to-r from-accent-red/10 to-deep-red/10 border-2 border-accent-red/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-primary-dark mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  What you'll get as a company admin:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-primary-dark">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-accent-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Full company management control</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-accent-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Create and manage staff users</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-accent-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Create and assign teams</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-accent-red rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Advanced task management</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-8 border-t-2 border-light-bg mt-8">
              <Link
                to="/login"
                className="text-gray hover:text-primary-dark font-semibold transition-colors"
              >
                Already have an account?
              </Link>
              <Button
                type="submit"
                isLoading={isLoading}
                variant="primary"
                size="lg"
              >
                Create Company & Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};