import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  Link as LinkIcon, 
  Users, 
  Clock,
  Flag,
  FileText,
  Target,
  Save,
  X,
  User,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  Lightbulb
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useTagsStore } from '../store/tags';
import { useTeamsStore } from '../store/teams';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UserSearch } from '../components/ui/UserSearch';
import { TagPriority } from '../types';
import { User as UserType } from '../types';
import toast from 'react-hot-toast';

export const CreateTag: React.FC = () => {
  const navigate = useNavigate();
  const { user, company } = useAuthStore();
  const { createTag, isLoading } = useTagsStore();
  const { teams, fetchTeams } = useTeamsStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    priority: 'Medium' as TagPriority,
    assigned_to_team: '',
    due_date: '',
    estimated_hours: '',
  });

  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && company) {
      fetchTeams(user.id);
    }
  }, [user, company, fetchTeams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (formData.link && !isValidUrl(formData.link)) {
      newErrors.link = 'Please enter a valid URL';
    }

    if (formData.estimated_hours && (isNaN(Number(formData.estimated_hours)) || Number(formData.estimated_hours) <= 0)) {
      newErrors.estimated_hours = 'Please enter a valid number of hours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validateForm()) return;

    try {
      const tagData = {
        ...formData,
        assigned_to_user: selectedUser?.id,
        assigned_to_team: formData.assigned_to_team || undefined,
        due_date: formData.due_date || undefined,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : undefined,
      };

      await createTag(tagData, user.id);
      toast.success('Task created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const priorityOptions: TagPriority[] = ['Low', 'Medium', 'High', 'Critical'];

  const getPriorityConfig = (priority: TagPriority) => {
    switch (priority) {
      case 'Critical': 
        return { 
          color: 'border-red-300 bg-red-50 text-red-700', 
          icon: AlertTriangle,
          iconColor: 'text-red-600'
        };
      case 'High': 
        return { 
          color: 'border-orange-300 bg-orange-50 text-orange-700', 
          icon: ArrowUp,
          iconColor: 'text-orange-600'
        };
      case 'Medium': 
        return { 
          color: 'border-yellow-300 bg-yellow-50 text-yellow-700', 
          icon: Minus,
          iconColor: 'text-yellow-600'
        };
      case 'Low': 
        return { 
          color: 'border-green-300 bg-green-50 text-green-700', 
          icon: ArrowDown,
          iconColor: 'text-green-600'
        };
      default: 
        return { 
          color: 'border-slate-300 bg-slate-50 text-slate-700', 
          icon: Minus,
          iconColor: 'text-slate-600'
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 bg-slate-900 text-white">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Create New Task</h1>
                <p className="text-slate-300 mt-1">Add a new task to your workflow</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <Target className="w-5 h-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold text-slate-900">Task Details</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <Input
                      label="Task Title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter a clear, descriptive title"
                      className={`text-lg font-medium ${errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'}`}
                      error={errors.title}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Provide detailed information about this task..."
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="Reference Link (Optional)"
                        name="link"
                        value={formData.link}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                        type="url"
                        className={errors.link ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'}
                        error={errors.link}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Priority Level
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {priorityOptions.map((priority) => {
                          const config = getPriorityConfig(priority);
                          const Icon = config.icon;
                          return (
                            <button
                              key={priority}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, priority }))}
                              className={`p-3 border-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                formData.priority === priority
                                  ? config.color
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <div className="text-center">
                                <Icon className={`w-4 h-4 mx-auto mb-1 ${config.iconColor}`} />
                                {priority}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment */}
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <Users className="w-5 h-5 text-purple-600 mr-2" />
                  <h2 className="text-lg font-semibold text-slate-900">Assignment</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <UserSearch
                    onUserSelect={setSelectedUser}
                    selectedUser={selectedUser}
                    placeholder="Search for users to assign..."
                    label="Assign to User"
                  />

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Assign to Team
                    </label>
                    <select
                      name="assigned_to_team"
                      value={formData.assigned_to_team}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 appearance-none bg-white"
                    >
                      <option value="">Select a team (optional)</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Timeline & Estimation */}
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <Clock className="w-5 h-5 text-green-600 mr-2" />
                  <h2 className="text-lg font-semibold text-slate-900">Timeline & Estimation</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <Input
                      label="Due Date (Optional)"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleInputChange}
                      type="date"
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Input
                      label="Estimated Hours (Optional)"
                      name="estimated_hours"
                      value={formData.estimated_hours}
                      onChange={handleInputChange}
                      type="number"
                      min="1"
                      placeholder="e.g., 8"
                      className={errors.estimated_hours ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'}
                      error={errors.estimated_hours}
                    />
                  </div>
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Pro Tips for Better Task Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Use clear, action-oriented titles</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Set realistic due dates and estimates</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Assign to teams for collaborative work</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Higher priority tasks get more visibility</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-8 border-t border-slate-200 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};