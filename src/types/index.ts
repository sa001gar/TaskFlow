export interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  timezone?: string | null;
  locale?: string | null;
  is_active?: boolean | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  default_company_id?: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string;
  domain?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  user_role?: CompanyRole;
  member_count?: number;
}

export type CompanyRole = 'superuser' | 'admin' | 'leader' | 'member';

export interface CompanyUser {
  id: string;
  user_id: string;
  company_id: string;
  role: CompanyRole;
  invited_by?: string;
  invited_at: string;
  joined_at?: string;
  is_active: boolean;
  user: User;
  invited_by_user?: User;
}

export interface UserInvitation {
  id: string;
  email: string;
  company_id: string;
  team_id?: string;
  role: CompanyRole;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  company: Company;
  team?: Team;
  invited_by_user: User;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  created_at: string;
  members?: TeamMember[];
  member_count?: number;
  is_leader?: boolean;
  company?: Company;
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
  assigned_to_user?: string;
  assigned_to_team?: string;
  created_by: string;
  parent_tag_id?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours: number;
  created_at: string;
  updated_at: string;
  created_by_user?: User;
  assigned_user?: User;
  assigned_team?: Team;
  subtasks?: Tag[];
  responses?: TagResponse[];
}

export interface TagResponse {
  id: string;
  tag_id: string;
  user_id: string;
  comment?: string;
  status_update?: string;
  time_logged: number;
  created_at: string;
  user: User;
}

export interface CreateTagRequest {
  title: string;
  description?: string;
  link?: string;
  priority?: TagPriority;
  assigned_to_user?: string;
  assigned_to_team?: string;
  due_date?: string;
  estimated_hours?: number;
  parent_tag_id?: string;
}

export interface CreateTeamRequest {
  website_url?: string | null;
  logo_url?: string | null;
  industry?: string | null;
  company_size?: string | null;
  settings?: any;
  is_active?: boolean | null;
  description?: string;
  updated_at?: string | null;
  company_id: string;
}

export interface CreateCompanyRequest {
  name: string;
  slug: string;
  description?: string;
  website_url?: string | null;
}

export interface InviteUserRequest {
  email: string;
  company_id: string;
  team_id?: string;
  role: CompanyRole;
}