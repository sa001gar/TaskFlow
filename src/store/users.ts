import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, CreateUserRequest, PasswordReset } from '../types';

interface UsersState {
  users: User[];
  passwordResets: PasswordReset[];
  isLoading: boolean;
  fetchUsers: (companyId: string) => Promise<void>;
  fetchPasswordResets: (companyId: string) => Promise<void>;
  createUser: (userData: CreateUserRequest, companyId: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  requestPasswordReset: (userId: string, companyId: string) => Promise<void>;
  resetPassword: (userId: string, newPassword: string) => Promise<void>;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  passwordResets: [],
  isLoading: false,

  fetchUsers: async (companyId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ users: data || [], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchPasswordResets: async (companyId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('password_resets')
        .select(`
          *,
          user:users(*),
          requested_by_user:users!password_resets_requested_by_fkey(*)
        `)
        .eq('company_id', companyId)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ passwordResets: data || [], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createUser: async (userData: CreateUserRequest, companyId: string) => {
    set({ isLoading: true });
    try {
      // Create user account in Supabase Auth using Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              company_id: companyId,
            }
          ]);

        if (profileError) throw profileError;

        // Refresh users list
        await get().fetchUsers(companyId);
      }

      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateUser: async (userId: string, updates: Partial<User>) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      const currentUsers = get().users;
      const updatedUsers = currentUsers.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      );
      set({ users: updatedUsers, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteUser: async (userId: string) => {
    set({ isLoading: true });
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      const currentUsers = get().users;
      const updatedUsers = currentUsers.filter(user => user.id !== userId);
      set({ users: updatedUsers, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  requestPasswordReset: async (userId: string, companyId: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.rpc('request_password_reset', {
        target_user_id: userId,
        requesting_company_id: companyId
      });

      if (error) throw error;

      // Refresh password resets
      await get().fetchPasswordResets(companyId);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  resetPassword: async (userId: string, newPassword: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) throw error;

      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));