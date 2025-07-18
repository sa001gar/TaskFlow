import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Crown, 
  Calendar,
  Settings,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Shield
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useTeamsStore } from '../../store/teams';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export const AdminTeams: React.FC = () => {
  const { user } = useAuthStore();
  const { teams, fetchTeams, deleteTeam, isLoading } = useTeamsStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchTeams(user.id);
    }
  }, [user, fetchTeams]);

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteTeam(teamId);
      toast.success('Team deleted successfully!');
      if (user) {
        fetchTeams(user.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete team');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              Team Management
            </h1>
            <p className="text-slate-600 mt-2">
              Create and manage teams for your organization
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/admin/teams/new">
              <Button className="flex items-center bg-blue-600 hover:bg-blue-700">
                <Plus className="w-5 h-5 mr-2" />
                Create Team
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {[
            {
              title: "Total Teams",
              value: teams.length,
              icon: Users,
              gradient: "from-blue-500 to-blue-600",
              bgGradient: "from-blue-50 to-blue-100",
              textColor: "text-blue-700",
              iconColor: "text-blue-600"
            },
            {
              title: "Active Teams",
              value: teams.filter(t => t.is_active !== false).length,
              icon: Shield,
              gradient: "from-green-500 to-green-600",
              bgGradient: "from-green-50 to-green-100",
              textColor: "text-green-700",
              iconColor: "text-green-600"
            },
            {
              title: "Teams with Leaders",
              value: teams.filter(t => t.is_leader).length,
              icon: Crown,
              gradient: "from-amber-500 to-amber-600",
              bgGradient: "from-amber-50 to-amber-100",
              textColor: "text-amber-700",
              iconColor: "text-amber-600"
            },
            {
              title: "Total Members",
              value: teams.reduce((sum, team) => sum + (team.member_count || 0), 0),
              icon: UserPlus,
              gradient: "from-purple-500 to-purple-600",
              bgGradient: "from-purple-50 to-purple-100",
              textColor: "text-purple-700",
              iconColor: "text-purple-600"
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card className={`bg-gradient-to-br ${stat.bgGradient} border-opacity-20 hover:shadow-lg transition-all duration-300`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs sm:text-sm font-medium ${stat.textColor}`}>{stat.title}</p>
                      <p className={`text-xl sm:text-2xl font-bold ${stat.textColor.replace('700', '900')}`}>
                        {stat.value}
                      </p>
                    </div>
                    <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.iconColor}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Teams Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {team.name}
                      </h3>
                      {team.description && (
                        <p className="text-slate-600 mt-1 text-sm line-clamp-2">
                          {team.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {team.is_leader && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          <Crown className="w-3 h-3 mr-1" />
                          Leader
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{team.member_count || 0} members</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{new Date(team.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <Link
                      to={`/admin/teams/${team.id}`}
                      className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Link>
                    <div className="flex items-center space-x-2">
                      <Link to={`/admin/teams/${team.id}/edit`}>
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                      <button 
                        onClick={() => handleDeleteTeam(team.id, team.name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
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
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              {searchTerm ? 'No teams found' : 'No teams yet'}
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {searchTerm 
                ? 'Try adjusting your search terms or create a new team.'
                : 'Create your first team to start organizing your workforce.'
              }
            </p>
            <Link to="/admin/teams/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Team
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};