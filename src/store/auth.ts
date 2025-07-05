import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { User, Company, CreateCompanyRequest } from '../types';

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
              .select(`
                *,
                company:companies(*)
              `)
              .eq('id', data.user.id)
              .single();

            if (userError) throw userError;

            set({ 
              user: userData, 
              company: userData.company,
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

      register: async (name: string, email: string, password: string, companyData: CreateCompanyRequest) => {
        set({ isLoading: true });
        try {
          // Create company first
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert([companyData])
            .select()
            .single();

          if (companyError) throw companyError;

          // Create user account in Supabase Auth
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
                  role: 'admin',
                  company_id: newCompany.id,
                },
              ])
              .select()
              .single();

            if (insertError) throw insertError;

            set({ 
              user: newUser, 
              company: newCompany,
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
        set({ user: null, company: null, token: null, isInitialized: true });
      },

      checkAuth: async () => {
        if (get().isInitialized) return;
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            const { data: userData } = await supabase
              .from('users')
              .select(`
                *,
                company:companies(*)
              `)
              .eq('id', session.user.id)
              .single();

            if (userData) {
              set({ 
                user: userData, 
                company: userData.company,
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
          set({ user: null, company: null, token: null, isInitialized: true });
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