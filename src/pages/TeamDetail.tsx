import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Users, 
  Crown, 
  Calendar,
  UserMinus,
  Settings,
  Tag,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useTeamsStore } from '../store/teams';
import { useTagsStore } from '../store/tags';
import { Button } from '../components/ui/Button';
import { TagCard } from '../components/tags/TagCard';
import toast from 'react-hot-toast';

export const TeamDetail: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTeam, fetchTeam, removeTeamMember, deleteTeam, isLoading: teamLoading } = useTeamsStore();
  const { tags, fetchTags, isLoading: tagsLoading } = useTagsStore();

  useEffect(() => {
    if (teamId && user) {
      fetchTeam(teamId);
      fetchTags(user.id);
    }
  }, [teamId, user, fetchTeam, fetchTags]);

  const teamTags = tags.filter(tag => tag.assigned_to_team === teamId);
  const isLeader = currentTeam?.members?.some(member => 
    member.user_id === user?.id && member.is_leader
  );

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!teamId || !isLeader) return;
    
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return;
    }
    
    try {
      await removeTeamMember(teamId, memberId);
      toast.success('Member removed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamId || !isLeader || !currentTeam) return;
    
    if (!window.confirm(`Are you sure you want to delete "${currentTeam.name}"? This action cannot be undone and will remove all team data.`)) {
      return;
    }
    
    try {
      await deleteTeam(teamId);
      toast.success('Team deleted successfully!');
      navigate('/teams');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete team');
    }
  };

  if (teamLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading team details...</p>
        </div>
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-20 h-20 text-slate-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Team not found</h3>
          <p className="text-slate-600 mb-8">The team you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/teams')} className="bg-blue-600 hover:bg-blue-700">
            Back to Teams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/teams')}
            className="mr-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              {currentTeam.name}
            </h1>
            {currentTeam.description && (
              <p className="text-slate-600 mt-2">{currentTeam.description}</p>
            )}
          </div>
          {isLeader && (
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                className="flex items-center border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                <Edit className="w-5 h-5 mr-2" />
                Edit Team
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteTeam}
                className="flex items-center"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete Team
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Team Info & Members */}
          <div className="lg:col-span-1 space-y-6">
            {/* Team Stats */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Team Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Members</span>
                  <span className="font-medium text-slate-900">{currentTeam.members?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Active Tasks</span>
                  <span className="font-medium text-slate-900">{teamTags.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Completed</span>
                  <span className="font-medium text-green-600">
                    {teamTags.filter(tag => tag.status === 'Completed').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Created</span>
                  <span className="font-medium text-slate-900">
                    {new Date(currentTeam.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Members</h3>
              </div>
              <div className="space-y-3">
                {currentTeam.members?.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-medium text-sm">
                          {member.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 flex items-center">
                          {member.user.name}
                          {member.is_leader && (
                            <Crown className="w-4 h-4 ml-2 text-amber-500" />
                          )}
                        </p>
                        <p className="text-sm text-slate-600">{member.user.email}</p>
                      </div>
                    </div>
                    {isLeader && !member.is_leader && member.user_id !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.user_id, member.user.name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Tasks */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                <Tag className="w-6 h-6 mr-2 text-blue-600" />
                Team Tasks ({teamTags.length})
              </h3>
            </div>

            {tagsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : teamTags.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teamTags.map((tag, index) => (
                  <TagCard key={tag.id} tag={tag} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                <Tag className="w-20 h-20 text-slate-300 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-slate-900 mb-3">No team tasks yet</h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  Start collaborating by creating tasks assigned to this team.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};