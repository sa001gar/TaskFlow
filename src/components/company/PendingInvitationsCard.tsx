import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Clock, 
  Send, 
  X, 
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react';
import { UserInvitation } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';

interface PendingInvitationsCardProps {
  invitations: UserInvitation[];
  onResendInvitation: (invitationId: string) => void;
  onCancelInvitation: (invitationId: string) => void;
  isLoading?: boolean;
}

export const PendingInvitationsCard: React.FC<PendingInvitationsCardProps> = ({
  invitations,
  onResendInvitation,
  onCancelInvitation,
  isLoading = false
}) => {
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'leader': return 'bg-green-100 text-green-800 border-green-200';
      case 'member': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="w-5 h-5 text-blue mr-2" />
          Pending Invitations ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invitations.map((invitation) => {
            const expired = isExpired(invitation.expires_at);
            const daysLeft = getDaysUntilExpiry(invitation.expires_at);
            
            return (
              <motion.div
                key={invitation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border ${
                  expired 
                    ? 'bg-red-50 border-bright-red' 
                    : 'bg-orange-50 border-orange-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      expired ? 'bg-red-100' : 'bg-orange-100'
                    }`}>
                      {expired ? (
                        <AlertTriangle className="w-6 h-6 text-bright-red" />
                      ) : (
                        <Mail className="w-6 h-6 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-navy">{invitation.email}</h3>
                        <Badge 
                          variant="outline" 
                          size="sm" 
                          className={getRoleColor(invitation.role)}
                        >
                          {invitation.role}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          Invited by {invitation.invited_by_user.name}
                        </p>
                        <p className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Sent {new Date(invitation.created_at).toLocaleDateString()}
                        </p>
                        {invitation.team && (
                          <p className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            Team: {invitation.team.name}
                          </p>
                        )}
                      </div>
                      
                      {expired ? (
                        <Badge variant="destructive" size="sm" className="mt-2">
                          Expired
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm" className="mt-2">
                          <Clock className="w-3 h-3 mr-1" />
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Expires today'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onResendInvitation(invitation.id)}
                      disabled={isLoading}
                      className="text-blue border-blue hover:bg-blue hover:text-white"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      {expired ? 'Resend' : 'Remind'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCancelInvitation(invitation.id)}
                      disabled={isLoading}
                      className="text-bright-red border-bright-red hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};