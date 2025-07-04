import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Users,
  ExternalLink,
  MessageSquare,
  Plus,
  Send,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Target,
  Flag,
  Timer,
  FileText,
  Link as LinkIcon,
  Save,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useTagsStore } from '../store/tags';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { Modal } from '../components/ui/Modal';
import { TagStatus, TagPriority } from '../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const TagDetail: React.FC = () => {
  const { tagId } = useParams<{ tagId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    currentTag, 
    fetchTag, 
    updateTag, 
    deleteTag, 
    addResponse, 
    createSubtask,
    updateTagStatus,
    isLoading 
  } = useTagsStore();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [timeLogged, setTimeLogged] = useState('');
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    link: '',
    priority: 'Medium' as TagPriority,
    due_date: '',
    estimated_hours: '',
  });
  const [subtaskData, setSubtaskData] = useState({
    title: '',
    description: '',
    priority: 'Medium' as TagPriority,
  });

  useEffect(() => {
    if (tagId) {
      fetchTag(tagId);
    }
  }, [tagId, fetchTag]);

  useEffect(() => {
    if (currentTag) {
      setEditFormData({
        title: currentTag.title,
        description: currentTag.description || '',
        link: currentTag.link || '',
        priority: currentTag.priority,
        due_date: currentTag.due_date || '',
        estimated_hours: currentTag.estimated_hours?.toString() || '',
      });
    }
  }, [currentTag]);

  const handleStatusUpdate = async (newStatus: TagStatus) => {
    if (!tagId) return;

    try {
      await updateTagStatus(tagId, newStatus);
      toast.success('Status updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagId || !user || (!newComment.trim() && !timeLogged)) return;

    try {
      await addResponse(
        tagId, 
        user.id, 
        newComment.trim() || undefined,
        undefined,
        timeLogged ? parseInt(timeLogged) : undefined
      );
      setNewComment('');
      setTimeLogged('');
      toast.success('Comment added successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add comment');
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagId) return;

    try {
      await updateTag(tagId, {
        ...editFormData,
        estimated_hours: editFormData.estimated_hours ? parseInt(editFormData.estimated_hours) : undefined,
      });
      setIsEditModalOpen(false);
      toast.success('Task updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task');
    }
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagId || !user) return;

    try {
      await createSubtask(tagId, subtaskData, user.id);
      setSubtaskData({ title: '', description: '', priority: 'Medium' });
      setIsSubtaskModalOpen(false);
      toast.success('Subtask created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create subtask');
    }
  };

  const handleDeleteTask = async () => {
    if (!tagId || !currentTag) return;

    if (!window.confirm(`Are you sure you want to delete "${currentTag.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteTag(tagId);
      toast.success('Task deleted successfully!');
      navigate('/tags');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete task');
    }
  };

  const canEdit = currentTag && user && (
    currentTag.created_by === user.id || 
    currentTag.assigned_to_user === user.id
  );

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy • h:mm a');
  };

  const completedSubtasks = currentTag?.subtasks?.filter(t => t.status === 'Completed').length || 0;
  const totalSubtasks = currentTag?.subtasks?.length || 0;
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!currentTag) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Target className="w-20 h-20 text-slate-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Task not found</h3>
          <p className="text-slate-600 mb-8">The task you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/tags')} className="bg-blue-600 hover:bg-blue-700">
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/tags')}
              className="mr-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                <Target className="w-8 h-8 mr-3 text-blue-600" />
                {currentTag.title}
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <StatusBadge status={currentTag.status} />
                <PriorityBadge priority={currentTag.priority} />
              </div>
            </div>
          </div>
          
          {canEdit && (
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                <Edit className="w-5 h-5 mr-2" />
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteTask}
                className="flex items-center"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Task Details */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Task Details
              </h2>
              
              {currentTag.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Description</h3>
                  <p className="text-slate-600 leading-relaxed">{currentTag.description}</p>
                </div>
              )}

              {currentTag.link && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Reference Link</h3>
                  <a
                    href={currentTag.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Open Link
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
              )}

              {/* Progress Bar for Subtasks */}
              {totalSubtasks > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                    <span className="font-medium">Progress</span>
                    <span>{completedSubtasks}/{totalSubtasks} subtasks completed</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status Update Buttons */}
              {canEdit && (
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {(['Pending', 'Accepted', 'In Progress', 'Completed', 'Rejected'] as TagStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(status)}
                        disabled={currentTag.status === status}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentTag.status === status
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subtasks */}
            {(totalSubtasks > 0 || canEdit) && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Subtasks ({totalSubtasks})
                  </h2>
                  {canEdit && (
                    <Button
                      size="sm"
                      onClick={() => setIsSubtaskModalOpen(true)}
                      className="flex items-center bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subtask
                    </Button>
                  )}
                </div>

                {currentTag.subtasks && currentTag.subtasks.length > 0 ? (
                  <div className="space-y-3">
                    {currentTag.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            subtask.status === 'Completed' 
                              ? 'bg-green-600 border-green-600' 
                              : 'border-slate-300'
                          }`}>
                            {subtask.status === 'Completed' && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className={`font-medium ${
                              subtask.status === 'Completed' ? 'text-slate-500 line-through' : 'text-slate-900'
                            }`}>
                              {subtask.title}
                            </h4>
                            {subtask.description && (
                              <p className="text-sm text-slate-600">{subtask.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <PriorityBadge priority={subtask.priority} size="sm" />
                          <StatusBadge status={subtask.status} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : canEdit ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No subtasks yet</h3>
                    <p className="text-slate-600 mb-4">Break down this task into smaller, manageable pieces.</p>
                    <Button
                      onClick={() => setIsSubtaskModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Subtask
                    </Button>
                  </div>
                ) : null}
              </div>
            )}

            {/* Comments & Activity */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                Comments & Activity
              </h2>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="mb-6 p-4 bg-slate-50 rounded-lg">
                <div className="space-y-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment or update..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Input
                        type="number"
                        placeholder="Time logged (hours)"
                        value={timeLogged}
                        onChange={(e) => setTimeLogged(e.target.value)}
                        className="w-40 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        min="0"
                        step="0.5"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={!newComment.trim() && !timeLogged}
                      className="flex items-center bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Add Comment
                    </Button>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              {currentTag.responses && currentTag.responses.length > 0 ? (
                <div className="space-y-4">
                  {currentTag.responses.map((response) => (
                    <div key={response.id} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-slate-900">{response.user.name}</span>
                          {response.time_logged > 0 && (
                            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              <Timer className="w-3 h-3 inline mr-1" />
                              {response.time_logged}h logged
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-slate-500">{formatDateTime(response.created_at)}</span>
                      </div>
                      {response.comment && (
                        <p className="text-slate-600 leading-relaxed">{response.comment}</p>
                      )}
                      {response.status_update && (
                        <p className="text-sm text-blue-600 font-medium mt-1">
                          Status updated to: {response.status_update}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No comments yet</h3>
                  <p className="text-slate-600">Be the first to add a comment or update.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Task Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Created by</span>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {currentTag.created_by_user?.name || 'Unknown'}
                    </span>
                  </div>
                </div>

                {currentTag.assigned_user && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Assigned to</span>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-blue-400" />
                      <span className="font-medium text-blue-900">
                        {currentTag.assigned_user.name}
                      </span>
                    </div>
                  </div>
                )}

                {currentTag.assigned_team && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Team</span>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-purple-400" />
                      <Link
                        to={`/teams/${currentTag.assigned_team.id}`}
                        className="font-medium text-purple-900 hover:text-purple-700"
                      >
                        {currentTag.assigned_team.name}
                      </Link>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Created</span>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {formatDate(currentTag.created_at)}
                    </span>
                  </div>
                </div>

                {currentTag.due_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Due date</span>
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-orange-400" />
                      <span className="font-medium text-orange-900">
                        {formatDate(currentTag.due_date)}
                      </span>
                    </div>
                  </div>
                )}

                {(currentTag.estimated_hours || currentTag.actual_hours > 0) && (
                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Time Tracking</h4>
                    {currentTag.estimated_hours && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-600">Estimated</span>
                        <span className="font-medium text-slate-900">{currentTag.estimated_hours}h</span>
                      </div>
                    )}
                    {currentTag.actual_hours > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Logged</span>
                        <span className="font-medium text-blue-900">{currentTag.actual_hours}h</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {canEdit && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditModalOpen(true)}
                      className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Task
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsSubtaskModalOpen(true)}
                      className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subtask
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => navigate('/tags')}
                  className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tasks
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Task" size="lg">
          <form onSubmit={handleEditSave} className="space-y-6">
            <Input
              label="Task Title"
              value={editFormData.title}
              onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Reference Link"
                value={editFormData.link}
                onChange={(e) => setEditFormData(prev => ({ ...prev, link: e.target.value }))}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                type="url"
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                <select
                  value={editFormData.priority}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, priority: e.target.value as TagPriority }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <Input
                label="Due Date"
                type="date"
                value={editFormData.due_date}
                onChange={(e) => setEditFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />

              <Input
                label="Estimated Hours"
                type="number"
                value={editFormData.estimated_hours}
                onChange={(e) => setEditFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                min="1"
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="px-6 py-3 border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>

        {/* Subtask Modal */}
        <Modal isOpen={isSubtaskModalOpen} onClose={() => setIsSubtaskModalOpen(false)} title="Create Subtask" size="md">
          <form onSubmit={handleCreateSubtask} className="space-y-6">
            <Input
              label="Subtask Title"
              value={subtaskData.title}
              onChange={(e) => setSubtaskData(prev => ({ ...prev, title: e.target.value }))}
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                value={subtaskData.description}
                onChange={(e) => setSubtaskData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
              <select
                value={subtaskData.priority}
                onChange={(e) => setSubtaskData(prev => ({ ...prev, priority: e.target.value as TagPriority }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSubtaskModalOpen(false)}
                className="px-6 py-3 border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Subtask
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};