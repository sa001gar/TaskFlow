import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { User, Company, CreateCompanyRequest } from '../types';
import Cookies from 'js-cookie';

interface AuthState {
  user: User | null;
  company: Company | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, company: CreateCompanyRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      token: null,
      isLoading: false,
      isInitialized: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          if (data.user && data.session) {
            // Get user profile from users table
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();

            if (userError) {
              // Create user profile if it doesn't exist
              const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([
                  {
                    id: data.user.id,
                    name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
                    email: data.user.email!,
                  },
                ])
                .select()
                .single();

              if (insertError) throw insertError;
              
              // Get user's default company
              const { data: companyData } = await supabase
                .from('company_memberships')
                .select(`
                  role,
                  companies (*)
                `)
                .eq('user_id', data.user.id)
                .eq('is_active', true)
                .order('role', { ascending: true })
                .limit(1)
                .maybeSingle();

              Cookies.set('token', data.session.access_token, { expires: 7 });
              set({ 
                user: newUser, 
                company: companyData?.companies ? { ...companyData.companies, user_role: companyData.role } : null,
                token: data.session.access_token, 
                isLoading: false,
                isInitialized: true 
              });
            } else {
              // Get user's default company
              const { data: companyData } = await supabase
                .from('company_memberships')
                .select(`
                  role,
                  companies (*)
                `)
                .eq('user_id', data.user.id)
                .eq('is_active', true)
                .order('role', { ascending: true })
                .limit(1)
                .maybeSingle();

              Cookies.set('token', data.session.access_token, { expires: 7 });
              set({ 
                user: userData, 
                company: companyData?.companies ? { ...companyData.companies, user_role: companyData.role } : null,
                token: data.session.access_token, 
                isLoading: false,
                isInitialized: true 
              });
            }
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (name: string, email: string, password: string, companyData: CreateCompanyRequest) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name,
              },
            },
          });

          if (error) throw error;

          if (data.user && data.session) {
            // Create user profile
            const { data: newUser, error: insertError } = await supabase
              .from('users')
              .insert([
                {
                  id: data.user.id,
                  name,
                  email,
                },
              ])
              .select()
              .single();

            if (insertError) throw insertError;

            // Create company
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert([companyData])
              .select()
              .single();

            if (companyError) throw companyError;

            // Add user as superuser of the company
            const { error: companyUserError } = await supabase
              .from('company_memberships')
              .insert([
                {
                  user_id: data.user.id,
                  company_id: newCompany.id,
                  role: 'owner',
                  joined_at: new Date().toISOString(),
                },
              ]);

            if (companyUserError) throw companyUserError;

            // Update user's default company
            await supabase
              .from('users')
              .update({ default_company_id: newCompany.id })
              .eq('id', data.user.id);

            Cookies.set('token', data.session.access_token, { expires: 7 });
            set({ 
              user: newUser, 
              company: { ...newCompany, user_role: 'owner' },
              token: data.session.access_token, 
              isLoading: false,
              isInitialized: true 
            });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        Cookies.remove('token');
        set({ user: null, company: null, token: null, isInitialized: true });
      },

      checkAuth: async () => {
        if (get().isInitialized) return;
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (userData) {
              // Get user's default company
              const { data: companyData } = await supabase
                .from('company_memberships')
                .select(`
                  role,
                  companies (*)
                `)
                .eq('user_id', session.user.id)
                .eq('is_active', true)
                .order('role', { ascending: true })
                .limit(1)
                .maybeSingle();

              Cookies.set('token', session.access_token, { expires: 7 });
              set({ 
                user: userData, 
                company: companyData?.companies ? { ...companyData.companies, user_role: companyData.role } : null,
                token: session.access_token,
                isInitialized: true 
              });
            } else {
              set({ isInitialized: true });
            }
          } else {
            set({ isInitialized: true });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          Cookies.remove('token');
          set({ user: null, company: null, token: null, isInitialized: true });
        }
      },

      switchCompany: async (companyId: string) => {
        const { user } = get();
        if (!user) return;

        try {
          const { data: companyData } = await supabase
            .from('company_memberships')
            .select(`
              role,
              companies (*)
            `)
            .eq('user_id', user.id)
            .eq('company_id', companyId)
            .eq('is_active', true)
            .single();

          if (companyData?.companies) {
            set({ 
              company: { ...companyData.companies, user_role: companyData.role }
            });
          }
        } catch (error) {
          console.error('Failed to switch company:', error);
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        company: state.company,
        token: state.token 
      }),
    }
  )
);