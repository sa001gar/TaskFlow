import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Tag, TagComment, CreateTagRequest, TagStatus } from '../types';

interface TagsState {
  tags: Tag[];
  currentTag: Tag | null;
  isLoading: boolean;
  fetchTags: (companyId: string) => Promise<void>;
  fetchTag: (tagId: string) => Promise<void>;
  createTag: (tag: CreateTagRequest, companyId: string, userId: string) => Promise<void>;
  updateTag: (tagId: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (tagId: string) => Promise<void>;
  updateTagStatus: (tagId: string, status: TagStatus) => Promise<void>;
  addComment: (tagId: string, userId: string, comment?: string, statusUpdate?: TagStatus, timeLogged?: number) => Promise<void>;
  createSubtask: (parentTagId: string, subtask: CreateTagRequest, companyId: string, userId: string) => Promise<void>;
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  currentTag: null,
  isLoading: false,

  fetchTags: async (companyId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('tags')
        .select(`
          *,
          created_by_user:users!tags_created_by_fkey(*),
          assigned_user:users!tags_assigned_to_user_id_fkey(*),
          assigned_team:teams!tags_assigned_to_team_id_fkey(*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch subtasks count for each tag
      const tagsWithSubtasks = await Promise.all(
        (data || []).map(async (tag) => {
          const { data: subtasks } = await supabase
            .from('tags')
            .select('id, status, title, priority')
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
          created_by_user:users!tags_created_by_fkey(*),
          assigned_user:users!tags_assigned_to_user_id_fkey(*),
          assigned_team:teams!tags_assigned_to_team_id_fkey(*)
        `)
        .eq('id', tagId)
        .single();

      if (tagError) throw tagError;

      const { data: subtasksData, error: subtasksError } = await supabase
        .from('tags')
        .select(`
          *,
          assigned_user:users!tags_assigned_to_user_id_fkey(*)
        `)
        .eq('parent_tag_id', tagId);

      if (subtasksError) throw subtasksError;

      const { data: commentsData, error: commentsError } = await supabase
        .from('tag_comments')
        .select(`
          *,
          user:users(*)
        `)
        .eq('tag_id', tagId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      const tag: Tag = {
        ...tagData,
        subtasks: subtasksData || [],
        comments: commentsData || [],
      };

      set({ currentTag: tag, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createTag: async (tagData: CreateTagRequest, companyId: string, userId: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('tags')
        .insert([
          {
            ...tagData,
            company_id: companyId,
            created_by: userId,
          },
        ]);

      if (error) throw error;

      await get().fetchTags(companyId);
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

  addComment: async (tagId: string, userId: string, comment?: string, statusUpdate?: TagStatus, timeLogged?: number) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('tag_comments')
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
        await get().updateTagStatus(tagId, statusUpdate);
      } else {
        await get().fetchTag(tagId);
      }

      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createSubtask: async (parentTagId: string, subtaskData: CreateTagRequest, companyId: string, userId: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('tags')
        .insert([
          {
            ...subtaskData,
            parent_tag_id: parentTagId,
            company_id: companyId,
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