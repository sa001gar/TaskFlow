import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Company, CompanyUser, UserInvitation, InviteUserRequest, CompanyRole } from '../types';

interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: CompanyRole;
  teamId?: string;
}

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

interface CompanyState {
  companies: Company[];
  currentCompany: Company | null;
  companyUsers: CompanyUser[];
  invitations: UserInvitation[];
  passwordResetRequests: PasswordResetRequest[];
  isLoading: boolean;
  fetchCompanies: (userId: string) => Promise<void>;
  fetchCompany: (companyId: string) => Promise<void>;
  fetchCompanyUsers: (companyId: string) => Promise<void>;
  fetchInvitations: (companyId: string) => Promise<void>;
  fetchPasswordResetRequests: (companyId: string) => Promise<void>;
  inviteUser: (invitation: InviteUserRequest) => Promise<void>;
  createUser: (userData: CreateUserRequest, companyId: string) => Promise<void>;
  updateUserRole: (userId: string, companyId: string, role: CompanyRole) => Promise<void>;
  removeUser: (userId: string, companyId: string) => Promise<void>;
  resendInvitation: (invitationId: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  requestPasswordReset: (userId: string, companyId: string) => Promise<void>;
  generateTemporaryPassword: (userId: string, companyId: string) => Promise<string>;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  companies: [],
  currentCompany: null,
  companyUsers: [],
  invitations: [],
  passwordResetRequests: [],
  isLoading: false,

  fetchCompanies: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('company_users')
        .select(`
          role,
          companies (
            id,
            name,
            description,
            domain,
            logo_url,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      const companies = data?.map((item: any) => ({
        ...item.companies,
        user_role: item.role,
      })) || [];

      set({ companies, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchCompany: async (companyId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) throw error;

      // Get member count
      const { count } = await supabase
        .from('company_users')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_active', true);

      const company: Company = {
        ...data,
        member_count: count || 0,
      };

      set({ currentCompany: company, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchCompanyUsers: async (companyId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('company_users')
        .select(`
          *,
          user:users!company_users_user_id_fkey (
            id,
            name,
            email,
            created_at
          ),
          invited_by_user:users!company_users_invited_by_fkey (
            id,
            name,
            email,
            created_at
          )
        `)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('role', { ascending: true });

      if (error) throw error;

      set({ companyUsers: data || [], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchInvitations: async (companyId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select(`
          *,
          company:companies (
            id,
            name,
            description,
            created_at
          ),
          team:teams (
            id,
            name,
            description,
            created_at
          ),
          invited_by_user:users (
            id,
            name,
            email,
            created_at
          )
        `)
        .eq('company_id', companyId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ invitations: data || [], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchPasswordResetRequests: async (companyId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select(`
          *,
          user:users!password_reset_requests_user_id_fkey (
            id,
            name,
            email
          )
        `)
        .eq('company_id', companyId)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ passwordResetRequests: data || [], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  inviteUser: async (invitation: InviteUserRequest) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('user_invitations')
        .insert([invitation]);

      if (error) throw error;

      // Refresh invitations
      await get().fetchInvitations(invitation.company_id);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createUser: async (userData: CreateUserRequest, companyId: string) => {
    set({ isLoading: true });
    try {
      // Create user account in Supabase Auth
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
              default_company_id: companyId
            }
          ]);

        if (profileError) throw profileError;

        // Add user to company
        const { error: companyUserError } = await supabase
          .from('company_users')
          .insert([
            {
              user_id: authData.user.id,
              company_id: companyId,
              role: userData.role,
              joined_at: new Date().toISOString(),
              is_active: true
            }
          ]);

        if (companyUserError) throw companyUserError;

        // Add to team if specified
        if (userData.teamId) {
          const { error: teamError } = await supabase
            .from('user_teams')
            .insert([
              {
                user_id: authData.user.id,
                team_id: userData.teamId,
                is_leader: userData.role === 'leader'
              }
            ]);

          if (teamError) throw teamError;
        }

        // Refresh company users
        await get().fetchCompanyUsers(companyId);
      }

      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateUserRole: async (userId: string, companyId: string, role: CompanyRole) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('company_users')
        .update({ role })
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (error) throw error;

      // Refresh company users
      await get().fetchCompanyUsers(companyId);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  removeUser: async (userId: string, companyId: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('company_users')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (error) throw error;

      // Refresh company users
      await get().fetchCompanyUsers(companyId);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  resendInvitation: async (invitationId: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({ 
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;

      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  cancelInvitation: async (invitationId: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      // Remove from local state
      const currentInvitations = get().invitations;
      const updatedInvitations = currentInvitations.filter(inv => inv.id !== invitationId);
      set({ invitations: updatedInvitations, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  requestPasswordReset: async (userId: string, companyId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.rpc('request_password_reset', {
        target_user_id: userId,
        company_id_param: companyId
      });

      if (error) throw error;

      // Refresh password reset requests
      await get().fetchPasswordResetRequests(companyId);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  generateTemporaryPassword: async (userId: string, companyId: string) => {
    set({ isLoading: true });
    try {
      // Generate a random temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
      
      const { data, error } = await supabase.rpc('generate_temporary_password', {
        target_user_id: userId,
        company_id_param: companyId,
        new_password: tempPassword
      });

      if (error) throw error;

      set({ isLoading: false });
      return tempPassword;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));