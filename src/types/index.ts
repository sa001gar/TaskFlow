export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  company_id: string;
  avatar_url?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  color: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  members?: TeamMember[];
  member_count?: number;
  is_leader?: boolean;
  created_by_user?: User;
}

export interface TeamMember {
  user_id: string;
  team_id: string;
  is_leader: boolean;
  joined_at: string;
  user: User;
}

export type TagStatus = 'Pending' | 'Accepted' | 'In Progress' | 'Completed' | 'Rejected';
export type TagPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Tag {
  id: string;
  title: string;
  description?: string;
  link?: string;
  status: TagStatus;
  priority: TagPriority;
  assigned_to_user_id?: string;
  assigned_to_team_id?: string;
  created_by: string;
  parent_tag_id?: string;
  company_id: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours: number;
  created_at: string;
  updated_at: string;
  created_by_user?: User;
  assigned_user?: User;
  assigned_team?: Team;
  subtasks?: Tag[];
  comments?: TagComment[];
}

export interface TagComment {
  id: string;
  tag_id: string;
  user_id: string;
  comment?: string;
  status_update?: TagStatus;
  time_logged: number;
  created_at: string;
  user: User;
}

export interface PasswordReset {
  id: string;
  user_id: string;
  company_id: string;
  requested_by: string;
  token: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
  user?: User;
  requested_by_user?: User;
}

export interface CreateTagRequest {
  title: string;
  description?: string;
  link?: string;
  priority?: TagPriority;
  assigned_to_user_id?: string;
  assigned_to_team_id?: string;
  due_date?: string;
  estimated_hours?: number;
  parent_tag_id?: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'staff';
}

export interface CreateCompanyRequest {
  name: string;
  description?: string;
}