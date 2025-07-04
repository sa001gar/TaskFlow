import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Users, 
  Plus,
  TrendingUp,
  Calendar,
  Zap,
  Target,
  Award,
  Sparkles,
  Rocket
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useTagsStore } from '../store/tags';
import { useTeamsStore } from '../store/teams';
import { StatsCard } from '../components/dashboard/StatsCard';
import { TagCard } from '../components/tags/TagCard';
import { Button } from '../components/ui/Button';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { tags, fetchTags, isLoading: tagsLoading } = useTagsStore();
  const { teams, fetchTeams, isLoading: teamsLoading } = useTeamsStore();

  useEffect(() => {
    if (user) {
      fetchTags(user.id);
      fetchTeams(user.id);
    }
  }, [user, fetchTags, fetchTeams]);

  const stats = {
    total: tags.length,
    completed: tags.filter(tag => tag.status === 'Completed').length,
    inProgress: tags.filter(tag => tag.status === 'In Progress').length,
    pending: tags.filter(tag => tag.status === 'Pending').length,
  };

  const recentTags = tags.slice(0, 6);
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl font-bold text-slate-900 flex items-center">
                Welcome back, {user?.name}! <Sparkles className="w-8 h-8 ml-3 text-yellow-500" />
              </h1>
              <p className="text-slate-600 mt-2 text-lg">
                Here's what's happening with your tasks today.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/teams/new">
                <Button variant="outline" size="md" className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  New Team
                </Button>
              </Link>
              <Link to="/tags/new">
                <Button size="md" className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  New Task
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Tasks"
            value={stats.total}
            icon={Target}
            color="bg-blue-600"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle}
            color="bg-green-600"
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="In Progress"
            value={stats.inProgress}
            icon={Clock}
            color="bg-purple-600"
            trend={{ value: 5, isPositive: true }}
          />
          <StatsCard
            title="Completion Rate"
            value={`${completionRate}%`}
            icon={Award}
            color="bg-orange-600"
            trend={{ value: 15, isPositive: true }}
          />
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-yellow-500" />
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/tags/new" className="group">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 hover:border-blue-300 transition-all duration-200 group-hover:shadow-sm">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Create Task</h3>
                    <p className="text-sm text-slate-600">Add a new task to your workflow</p>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link to="/teams/new" className="group">
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 hover:border-purple-300 transition-all duration-200 group-hover:shadow-sm">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Create Team</h3>
                    <p className="text-sm text-slate-600">Start collaborating with others</p>
                  </div>
                </div>
              </div>
            </Link>
            
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">View Analytics</h3>
                  <p className="text-sm text-slate-600">Track your productivity</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Tasks */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
              <Calendar className="w-7 h-7 mr-3 text-blue-600" />
              Recent Tasks
            </h2>
            <Link to="/tags" className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
              View all
              <TrendingUp className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {tagsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse border border-slate-200">
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : recentTags.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentTags.map((tag, index) => (
                <TagCard key={tag.id} tag={tag} index={index} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white rounded-xl border border-slate-200"
            >
              <Calendar className="w-20 h-20 text-slate-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-3">No tasks yet</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Get started by creating your first task and begin organizing your workflow.
              </p>
              <Link to="/tags/new">
                <Button size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Task
                </Button>
              </Link>
            </motion.div>
          )}
        </div>

        {/* Teams Overview */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
              <Users className="w-7 h-7 mr-3 text-purple-600" />
              Your Teams
            </h2>
            <Link to="/teams" className="text-purple-600 hover:text-purple-700 font-medium flex items-center">
              View all
              <TrendingUp className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {teamsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse border border-slate-200">
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.slice(0, 3).map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 p-6"
                >
                  <Link to={`/teams/${team.id}`}>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                        {team.name}
                      </h3>
                      {team.is_leader && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full flex items-center">
                          <Rocket className="w-3 h-3 mr-1" />
                          Leader
                        </span>
                      )}
                    </div>
                    {team.description && (
                      <p className="text-slate-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                        {team.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{team.member_count || 0} members</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(team.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white rounded-xl border border-slate-200"
            >
              <Users className="w-20 h-20 text-slate-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-3">No teams yet</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Create or join a team to start collaborating with others on shared projects.
              </p>
              <Link to="/teams/new">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Team
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};