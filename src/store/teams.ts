import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Team, TeamMember, CreateTeamRequest } from '../types';

interface TeamsState {
  teams: Team[];
  currentTeam: Team | null;
  isLoading: boolean;
  fetchTeams: (userId: string) => Promise<void>;
  fetchTeam: (teamId: string) => Promise<void>;
  createTeam: (team: CreateTeamRequest, userId: string) => Promise<void>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  joinTeam: (teamId: string, userId: string) => Promise<void>;
  leaveTeam: (teamId: string, userId: string) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  promoteToLeader: (teamId: string, userId: string) => Promise<void>;
}

export const useTeamsStore = create<TeamsState>((set, get) => ({
  teams: [],
  currentTeam: null,
  isLoading: false,

  fetchTeams: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('user_teams')
        .select(`
          team_id,
          is_leader,
          joined_at,
          teams (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const teams = data?.filter((item: any) => item.teams).map((item: any) => ({
        ...item.teams,
        is_leader: item.is_leader,
        member_count: 0, // Temporarily set to 0 to avoid RLS recursion
      })) || [];

      set({ teams, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchTeam: async (teamId: string) => {
    set({ isLoading: true });
    try {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      const { data: membersData, error: membersError } = await supabase
        .from('user_teams')
        .select(`
          user_id,
          team_id,
          is_leader,
          joined_at,
          users (
            id,
            name,
            email,
            created_at
          )
        `)
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      const members: TeamMember[] = membersData?.map((item: any) => ({
        user_id: item.user_id,
        team_id: item.team_id,
        is_leader: item.is_leader,
        joined_at: item.joined_at,
        user: item.users,
      })) || [];

      const team: Team = {
        ...teamData,
        members,
        member_count: members.length,
      };

      set({ currentTeam: team, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createTeam: async (teamData: CreateTeamRequest, userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([teamData])
        .select()
        .single();

      if (error) throw error;

      const { error: memberError } = await supabase
        .from('user_teams')
        .insert([
          {
            user_id: userId,
            team_id: data.id,
            is_leader: true,
          },
        ]);

      if (memberError) throw memberError;

      await get().fetchTeams(userId);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateTeam: async (teamId: string, updates: Partial<Team>) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId);

      if (error) throw error;

      // Update local state
      const currentTeams = get().teams;
      const updatedTeams = currentTeams.map(team => 
        team.id === teamId ? { ...team, ...updates } : team
      );
      set({ teams: updatedTeams });

      if (get().currentTeam?.id === teamId) {
        await get().fetchTeam(teamId);
      }

      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteTeam: async (teamId: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      // Update local state
      const currentTeams = get().teams;
      const updatedTeams = currentTeams.filter(team => team.id !== teamId);
      set({ teams: updatedTeams });

      if (get().currentTeam?.id === teamId) {
        set({ currentTeam: null });
      }

      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  joinTeam: async (teamId: string, userId: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('user_teams')
        .insert([
          {
            user_id: userId,
            team_id: teamId,
            is_leader: false,
          },
        ]);

      if (error) throw error;

      await get().fetchTeams(userId);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  leaveTeam: async (teamId: string, userId: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('user_teams')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      await get().fetchTeams(userId);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  removeTeamMember: async (teamId: string, userId: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('user_teams')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      await get().fetchTeam(teamId);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  promoteToLeader: async (teamId: string, userId: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('user_teams')
        .update({ is_leader: true })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      await get().fetchTeam(teamId);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));