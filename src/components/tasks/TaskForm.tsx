import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Users, 
  User,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  Save,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useTeamsStore } from '../../store/teams';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { UserSearch } from '../ui/UserSearch';
import { TagPriority, User as UserType, CreateTagRequest } from '../../types';

interface TaskFormProps {
  onSubmit: (data: CreateTagRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<CreateTagRequest>;
  mode?: 'create' | 'edit';
}

export const TaskForm: React.FC<TaskFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  mode = 'create'
}) => {
  const { user, company } = useAuthStore();
  const { teams, fetchTeams } = useTeamsStore();

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    link: initialData?.link || '',
    priority: (initialData?.priority || 'Medium') as TagPriority,
    assigned_to_team: initialData?.assigned_to_team || '',
    due_date: initialData?.due_date || '',
    estimated_hours: initialData?.estimated_hours?.toString() || '',
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
    if (!validateForm()) return;

    const taskData = {
      ...formData,
      assigned_to_user: selectedUser?.id,
      assigned_to_team: formData.assigned_to_team || undefined,
      due_date: formData.due_date || undefined,
      estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : undefined,
    };

    await onSubmit(taskData);
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
          color: 'border-bright-red bg-red-50 text-bright-red', 
          icon: AlertTriangle,
          iconColor: 'text-bright-red'
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
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 bg-navy text-white">
            <h1 className="text-2xl font-bold">
              {mode === 'create' ? 'Create New Task' : 'Edit Task'}
            </h1>
            <p className="text-blue mt-1">
              {mode === 'create' ? 'Add a new task to your workflow' : 'Update task details'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="w-2 h-2 bg-blue rounded-full mr-3"></div>
                    Task Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Input
                    label="Task Title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter a clear, descriptive title"
                    className={`text-lg font-medium ${errors.title ? 'border-bright-red focus:border-bright-red focus:ring-bright-red' : ''}`}
                    error={errors.title}
                    required
                  />

                  <Textarea
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide detailed information about this task..."
                    rows={4}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Input
                      label="Reference Link (Optional)"
                      name="link"
                      value={formData.link}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                      type="url"
                      error={errors.link}
                    />

                    <div>
                      <label className="block text-sm font-medium text-navy mb-2">
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
                </CardContent>
              </Card>

              {/* Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 text-blue mr-2" />
                    Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <UserSearch
                      onUserSelect={setSelectedUser}
                      selectedUser={selectedUser}
                      placeholder="Search for users to assign..."
                      label="Assign to User"
                    />

                    <Select
                      label="Assign to Team"
                      name="assigned_to_team"
                      value={formData.assigned_to_team}
                      onChange={handleInputChange}
                    >
                      <option value="">Select a team (optional)</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline & Estimation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 text-blue mr-2" />
                    Timeline & Estimation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Input
                      label="Due Date (Optional)"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleInputChange}
                      type="date"
                    />

                    <Input
                      label="Estimated Hours (Optional)"
                      name="estimated_hours"
                      value={formData.estimated_hours}
                      onChange={handleInputChange}
                      type="number"
                      min="1"
                      placeholder="e.g., 8"
                      error={errors.estimated_hours}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="bg-blue/5 border-blue/20">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold text-navy mb-3 flex items-center">
                    <div className="w-2 h-2 bg-blue rounded-full mr-2"></div>
                    Pro Tips for Better Task Management
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-navy/80">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Use clear, action-oriented titles</span>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Set realistic due dates and estimates</span>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Assign to teams for collaborative work</span>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Higher priority tasks get more visibility</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-8 border-t border-slate-200 mt-8">
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
                {mode === 'create' ? 'Create Task' : 'Update Task'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};