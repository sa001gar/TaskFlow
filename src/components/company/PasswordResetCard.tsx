import React from 'react';
import { motion } from 'framer-motion';
import { Key, Clock, User, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface PasswordResetRequest {
  id: string;
  user_id: string;
  requested_by: string;
  company_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface PasswordResetCardProps {
  requests: PasswordResetRequest[];
  isLoading: boolean;
}

export const PasswordResetCard: React.FC<PasswordResetCardProps> = ({
  requests,
  isLoading
}) => {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatExpiresIn = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((date.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 0) return 'Expired';
    if (diffInMinutes < 60) return `${diffInMinutes}m left`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h left`;
    return `${Math.floor(diffInMinutes / 1440)}d left`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="w-5 h-5 mr-2 text-orange-600" />
          Password Reset Requests ({requests.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue mx-auto"></div>
              <p className="text-sm text-slate-500 mt-2">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <Key className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No pending password reset requests</p>
              <p className="text-sm">Requests will appear here when created</p>
            </div>
          ) : (
            <div className="space-y-1">
              {requests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white">
                        <Key className="w-5 h-5" />
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-navy">
                            {request.user?.name || 'Unknown User'}
                          </h4>
                        </div>
                        <p className="text-sm text-slate-600">
                          {request.user?.email}
                        </p>
                        <div className="flex items-center space-x-3 mt-1">
                          <div className="flex items-center text-xs text-slate-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatTimeAgo(request.created_at)}
                          </div>
                          <div className="flex items-center text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            <Badge 
                              variant={formatExpiresIn(request.expires_at) === 'Expired' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {formatExpiresIn(request.expires_at)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};