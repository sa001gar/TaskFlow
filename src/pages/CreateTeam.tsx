import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, FileText, Sparkles, Target, Zap, TrendingUp, Award } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useTeamsStore } from '../store/teams';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

export const CreateTeam: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createTeam, isLoading } = useTeamsStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createTeam(formData, user.id);
      toast.success('Team created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create team');
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Create New Team</h1>
                <p className="text-purple-100 mt-1">Build your collaborative workspace</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
              {/* Team Name */}
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  label="Team Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter a memorable team name"
                  className="pl-12 text-lg font-medium"
                  required
                />
              </div>

              {/* Team Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline w-4 h-4 mr-2" />
                  Team Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your team's purpose, goals, or focus area..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 resize-none"
                />
              </div>

              {/* Team Benefits Card */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-200">
                <div className="flex items-center mb-3">
                  <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800">Team Benefits</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-start">
                    <Target className="w-4 h-4 text-purple-400 mt-1 mr-3 flex-shrink-0" />
                    <span>Collaborative task management</span>
                  </div>
                  <div className="flex items-start">
                    <Zap className="w-4 h-4 text-blue-400 mt-1 mr-3 flex-shrink-0" />
                    <span>Shared project visibility</span>
                  </div>
                  <div className="flex items-start">
                    <Award className="w-4 h-4 text-purple-400 mt-1 mr-3 flex-shrink-0" />
                    <span>Team leader permissions</span>
                  </div>
                  <div className="flex items-start">
                    <TrendingUp className="w-4 h-4 text-blue-400 mt-1 mr-3 flex-shrink-0" />
                    <span>Progress tracking together</span>
                  </div>
                </div>
              </div>

              {/* Leadership Info */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">You'll be the team leader</p>
                    <p className="text-xs text-gray-600">You can manage members, assign tasks, and split work into subtasks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-8 border-t border-gray-200 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Create Team
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};