import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read_at?: string;
  created_at: string;
  expires_at?: string;
}

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  createNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,

  fetchNotifications: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      set({ notifications: data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      const notifications = get().notifications;
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
      );
      set({ notifications: updatedNotifications });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const notifications = get().notifications;
      const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;

      // Update local state
      const updatedNotifications = notifications.map(n => 
        unreadIds.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n
      );
      set({ notifications: updatedNotifications });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  dismissNotification: async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      const notifications = get().notifications;
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      set({ notifications: updatedNotifications });
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  },

  createNotification: async (notification: Omit<Notification, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([notification]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },
}));