import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Company, CompanyUser, UserInvitation, InviteUserRequest, CompanyRole } from '../types';

interface CompanyState {
  companies: Company[];
  currentCompany: Company | null;
  companyUsers: CompanyUser[];
  invitations: UserInvitation[];
  isLoading: boolean;
  fetchCompanies: (userId: string) => Promise<void>;
  fetchCompany: (companyId: string) => Promise<void>;
  fetchCompanyUsers: (companyId: string) => Promise<void>;
  fetchInvitations: (companyId: string) => Promise<void>;
  inviteUser: (invitation: InviteUserRequest) => Promise<void>;
  updateUserRole: (userId: string, companyId: string, role: CompanyRole) => Promise<void>;
  removeUser: (userId: string, companyId: string) => Promise<void>;
  resendInvitation: (invitationId: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  companies: [],
  currentCompany: null,
  companyUsers: [],
  invitations: [],
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
}));