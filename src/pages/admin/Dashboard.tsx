import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Tag, 
  Plus,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  UserPlus,
  Target,
  Award
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useTagsStore } from '../../store/tags';
import { useTeamsStore } from '../../store/teams';
import { useUsersStore } from '../../store/users';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const AdminDashboard: React.FC = () => {
  const { user, company } = useAuthStore();
  const { tags, fetchTags, isLoading: tagsLoading } = useTagsStore();
  const { teams, fetchTeams, isLoading: teamsLoading } = useTeamsStore();
  const { users, fetchUsers, isLoading: usersLoading } = useUsersStore();

  useEffect(() => {
    if (user && company) {
      fetchTags(company.id);
      fetchTeams(company.id);
      fetchUsers(company.id);
    }
  }, [user, company, fetchTags, fetchTeams, fetchUsers]);

  const stats = {
    totalTags: tags.length,
    completedTags: tags.filter(tag => tag.status === 'Completed').length,
    inProgressTags: tags.filter(tag => tag.status === 'In Progress').length,
    pendingTags: tags.filter(tag => tag.status === 'Pending').length,
    totalTeams: teams.length,
    totalUsers: users.length,
  };

  const completionRate = stats.totalTags > 0 ? Math.round((stats.completedTags / stats.totalTags) * 100) : 0;

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <Card hover variant="elevated" className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray mb-1">{title}</p>
            <p className="text-3xl font-bold text-primary-dark">{value}</p>
            {trend && (
              <div className={`flex items-center mt-2 text-sm ${
                trend.isPositive ? 'text-green-600' : 'text-accent-red'
              }`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
                <span className="text-gray ml-1">vs last week</span>
              </div>
            )}
          </div>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${color} shadow-medium`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-light-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl font-bold text-primary-dark flex items-center">
                <Building2 className="w-10 h-10 mr-4 text-accent-red" />
                Admin Dashboard
              </h1>
              <p className="text-gray mt-2 text-lg">
                Welcome back, {user?.name}! Here's your company overview.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/admin/users">
                <Button variant="outline" size="md" className="flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Add User
                </Button>
              </Link>
              <Link to="/admin/tags/new">
                <Button size="md" variant="secondary" className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  New Task
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <StatCard
              title="Total Tasks"
              value={stats.totalTags}
              icon={Target}
              color="bg-gradient-to-br from-primary-dark to-primary-800"
              trend={{ value: 12, isPositive: true }}
            />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <StatCard
              title="Completed"
              value={stats.completedTags}
              icon={CheckCircle}
              color="bg-gradient-to-br from-green-500 to-green-600"
              trend={{ value: 8, isPositive: true }}
            />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <StatCard
              title="Teams"
              value={stats.totalTeams}
              icon={Users}
              color="bg-gradient-to-br from-accent-red to-deep-red"
              trend={{ value: 5, isPositive: true }}
            />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <StatCard
              title="Team Members"
              value={stats.totalUsers}
              icon={UserPlus}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              trend={{ value: 15, isPositive: true }}
            />
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-6 h-6 mr-3 text-accent-red" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/admin/users" className="group">
                  <div className="p-6 bg-gradient-to-br from-primary-dark/5 to-primary-dark/10 rounded-2xl border-2 border-primary-dark/20 hover:border-primary-dark/40 transition-all duration-200 group-hover:shadow-medium">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-dark rounded-2xl flex items-center justify-center mr-4 shadow-medium">
                        <UserPlus className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-primary-dark">Add User</h3>
                        <p className="text-sm text-gray">Create new staff accounts</p>
                      </div>
                    </div>
                  </div>
                </Link>
                
                <Link to="/admin/teams" className="group">
                  <div className="p-6 bg-gradient-to-br from-accent-red/5 to-accent-red/10 rounded-2xl border-2 border-accent-red/20 hover:border-accent-red/40 transition-all duration-200 group-hover:shadow-medium">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent-red rounded-2xl flex items-center justify-center mr-4 shadow-medium">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-primary-dark">Manage Teams</h3>
                        <p className="text-sm text-gray">Create and organize teams</p>
                      </div>
                    </div>
                  </div>
                </Link>
                
                <Link to="/admin/tags" className="group">
                  <div className="p-6 bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-2xl border-2 border-green-500/20 hover:border-green-500/40 transition-all duration-200 group-hover:shadow-medium">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center mr-4 shadow-medium">
                        <Tag className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-primary-dark">View All Tasks</h3>
                        <p className="text-sm text-gray">Monitor task progress</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Tasks */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Tag className="w-6 h-6 mr-3 text-accent-red" />
                    Recent Tasks
                  </CardTitle>
                  <Link to="/admin/tags" className="text-accent-red hover:text-deep-red font-semibold text-sm">
                    View All
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {tagsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : tags.slice(0, 5).length > 0 ? (
                  <div className="space-y-4">
                    {tags.slice(0, 5).map((tag) => (
                      <div key={tag.id} className="flex items-center justify-between p-3 bg-light-bg rounded-2xl">
                        <div>
                          <h4 className="font-semibold text-primary-dark">{tag.title}</h4>
                          <p className="text-sm text-gray">
                            {tag.assigned_user?.name || tag.assigned_team?.name || 'Unassigned'}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          tag.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          tag.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          tag.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {tag.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Tag className="w-12 h-12 text-gray mx-auto mb-3" />
                    <p className="text-gray">No tasks yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Team Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Users className="w-6 h-6 mr-3 text-accent-red" />
                    Teams Overview
                  </CardTitle>
                  <Link to="/admin/teams" className="text-accent-red hover:text-deep-red font-semibold text-sm">
                    View All
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {teamsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : teams.slice(0, 5).length > 0 ? (
                  <div className="space-y-4">
                    {teams.slice(0, 5).map((team) => (
                      <div key={team.id} className="flex items-center justify-between p-3 bg-light-bg rounded-2xl">
                        <div>
                          <h4 className="font-semibold text-primary-dark">{team.name}</h4>
                          <p className="text-sm text-gray">
                            {team.member_count || 0} members
                          </p>
                        </div>
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray mx-auto mb-3" />
                    <p className="text-gray">No teams yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};