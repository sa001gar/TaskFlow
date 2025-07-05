import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Team, TeamMember, CreateTeamRequest } from '../types';

interface TeamsState {
  teams: Team[];
  currentTeam: Team | null;
  isLoading: boolean;
  fetchTeams: (companyId: string) => Promise<void>;
  fetchTeam: (teamId: string) => Promise<void>;
  createTeam: (team: CreateTeamRequest, companyId: string, userId: string) => Promise<void>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  addTeamMember: (teamId: string, userId: string, isLeader?: boolean) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  updateMemberRole: (teamId: string, userId: string, isLeader: boolean) => Promise<void>;
}

export const useTeamsStore = create<TeamsState>((set, get) => ({
  teams: [],
  currentTeam: null,
  isLoading: false,

  fetchTeams: async (companyId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          created_by_user:users!teams_created_by_fkey(*)
        `)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get member counts for each team
      const teamIds = data?.map(team => team.id) || [];
      
      if (teamIds.length > 0) {
        const { data: memberCounts, error: countError } = await supabase
          .from('user_teams')
          .select('team_id')
          .in('team_id', teamIds);

        if (countError) throw countError;

        const memberCountMap = memberCounts?.reduce((acc: any, item: any) => {
          acc[item.team_id] = (acc[item.team_id] || 0) + 1;
          return acc;
        }, {}) || {};

        const teamsWithCounts = data?.map(team => ({
          ...team,
          member_count: memberCountMap[team.id] || 0,
        })) || [];

        set({ teams: teamsWithCounts, isLoading: false });
      } else {
        set({ teams: [], isLoading: false });
      }
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
        .select(`
          *,
          created_by_user:users!teams_created_by_fkey(*)
        `)
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      const { data: membersData, error: membersError } = await supabase
        .from('user_teams')
        .select(`
          *,
          user:users(*)
        `)
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      const members: TeamMember[] = membersData?.map((item: any) => ({
        user_id: item.user_id,
        team_id: item.team_id,
        is_leader: item.is_leader,
        joined_at: item.joined_at,
        user: item.user,
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

  createTeam: async (teamData: CreateTeamRequest, companyId: string, userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([{
          ...teamData,
          company_id: companyId,
          created_by: userId,
        }])
        .select()
        .single();

      if (error) throw error;

      // Add creator as team leader
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

      await get().fetchTeams(companyId);
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
        .update({ is_active: false })
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

  addTeamMember: async (teamId: string, userId: string, isLeader = false) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('user_teams')
        .insert([
          {
            user_id: userId,
            team_id: teamId,
            is_leader: isLeader,
          },
        ]);

      if (error) throw error;

      await get().fetchTeam(teamId);
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

  updateMemberRole: async (teamId: string, userId: string, isLeader: boolean) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('user_teams')
        .update({ is_leader: isLeader })
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