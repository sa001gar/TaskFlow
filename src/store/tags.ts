import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Tag, TagResponse, CreateTagRequest, TagStatus } from '../types';

interface TagsState {
  tags: Tag[];
  currentTag: Tag | null;
  isLoading: boolean;
  fetchTags: (userId: string) => Promise<void>;
  fetchTag: (tagId: string) => Promise<void>;
  createTag: (tag: CreateTagRequest, userId: string) => Promise<void>;
  updateTag: (tagId: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (tagId: string) => Promise<void>;
  updateTagStatus: (tagId: string, status: TagStatus) => Promise<void>;
  addResponse: (tagId: string, userId: string, comment?: string, statusUpdate?: string, timeLogged?: number) => Promise<void>;
  createSubtask: (parentTagId: string, subtask: CreateTagRequest, userId: string) => Promise<void>;
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  currentTag: null,
  isLoading: false,

  fetchTags: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('tags')
        .select(`
          *,
          created_by_user:users!tags_created_by_fkey (
            id,
            name,
            email,
            created_at
          ),
          assigned_user:users!tags_assigned_to_user_fkey (
            id,
            name,
            email,
            created_at
          ),
          assigned_team:teams!tags_assigned_to_team_fkey (
            id,
            name,
            description,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch subtasks count for each tag
      const tagsWithSubtasks = await Promise.all(
        (data || []).map(async (tag) => {
          const { data: subtasks } = await supabase
            .from('tags')
            .select('id, status')
            .eq('parent_tag_id', tag.id);

          return {
            ...tag,
            subtasks: subtasks || [],
          };
        })
      );

      set({ tags: tagsWithSubtasks, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchTag: async (tagId: string) => {
    set({ isLoading: true });
    try {
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select(`
          *,
          created_by_user:users!tags_created_by_fkey (
            id,
            name,
            email,
            created_at
          ),
          assigned_user:users!tags_assigned_to_user_fkey (
            id,
            name,
            email,
            created_at
          ),
          assigned_team:teams!tags_assigned_to_team_fkey (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq('id', tagId)
        .single();

      if (tagError) throw tagError;

      const { data: subtasksData, error: subtasksError } = await supabase
        .from('tags')
        .select(`
          *,
          assigned_user:users!tags_assigned_to_user_fkey (
            id,
            name,
            email,
            created_at
          )
        `)
        .eq('parent_tag_id', tagId);

      if (subtasksError) throw subtasksError;

      const { data: responsesData, error: responsesError } = await supabase
        .from('tag_responses')
        .select(`
          *,
          user:users (
            id,
            name,
            email,
            created_at
          )
        `)
        .eq('tag_id', tagId)
        .order('created_at', { ascending: true });

      if (responsesError) throw responsesError;

      const tag: Tag = {
        ...tagData,
        subtasks: subtasksData || [],
        responses: responsesData || [],
      };

      set({ currentTag: tag, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createTag: async (tagData: CreateTagRequest, userId: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('tags')
        .insert([
          {
            ...tagData,
            created_by: userId,
          },
        ]);

      if (error) throw error;

      await get().fetchTags(userId);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateTag: async (tagId: string, updates: Partial<Tag>) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('tags')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', tagId);

      if (error) throw error;

      // Update local state
      const currentTags = get().tags;
      const updatedTags = currentTags.map(tag => 
        tag.id === tagId ? { ...tag, ...updates } : tag
      );
      set({ tags: updatedTags });

      if (get().currentTag?.id === tagId) {
        await get().fetchTag(tagId);
      }

      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteTag: async (tagId: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      // Update local state
      const currentTags = get().tags;
      const updatedTags = currentTags.filter(tag => tag.id !== tagId);
      set({ tags: updatedTags });

      if (get().currentTag?.id === tagId) {
        set({ currentTag: null });
      }

      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateTagStatus: async (tagId: string, status: TagStatus) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('tags')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', tagId);

      if (error) throw error;

      // Update local state
      const currentTags = get().tags;
      const updatedTags = currentTags.map(tag => 
        tag.id === tagId ? { ...tag, status } : tag
      );
      set({ tags: updatedTags });

      if (get().currentTag?.id === tagId) {
        await get().fetchTag(tagId);
      }

      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addResponse: async (tagId: string, userId: string, comment?: string, statusUpdate?: string, timeLogged?: number) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('tag_responses')
        .insert([
          {
            tag_id: tagId,
            user_id: userId,
            comment,
            status_update: statusUpdate,
            time_logged: timeLogged || 0,
          },
        ]);

      if (error) throw error;

      if (statusUpdate) {
        await get().updateTagStatus(tagId, statusUpdate as TagStatus);
      } else {
        await get().fetchTag(tagId);
      }

      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createSubtask: async (parentTagId: string, subtaskData: CreateTagRequest, userId: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('tags')
        .insert([
          {
            ...subtaskData,
            parent_tag_id: parentTagId,
            created_by: userId,
          },
        ]);

      if (error) throw error;

      await get().fetchTag(parentTagId);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));