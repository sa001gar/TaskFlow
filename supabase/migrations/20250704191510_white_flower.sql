-- Drop existing functions first to avoid parameter name conflicts
DROP FUNCTION IF EXISTS is_company_member(uuid, uuid);
DROP FUNCTION IF EXISTS has_company_role(uuid, uuid, text[]);

-- Create helper function to check company membership without recursion
CREATE OR REPLACE FUNCTION is_company_member(company_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM company_users 
    WHERE company_id = company_uuid 
      AND user_id = user_uuid 
      AND is_active = true
  );
$$;

-- Create helper function to check if user has specific role in company
CREATE OR REPLACE FUNCTION has_company_role(company_uuid uuid, user_uuid uuid, required_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM company_users 
    WHERE company_id = company_uuid 
      AND user_id = user_uuid 
      AND role = ANY(required_roles)
      AND is_active = true
  );
$$;

-- Drop existing problematic policies on companies
DROP POLICY IF EXISTS "Superusers can manage their companies" ON companies;
DROP POLICY IF EXISTS "Users can view their companies" ON companies;

-- Drop existing problematic policies on company_users
DROP POLICY IF EXISTS "Superusers and admins can manage company users" ON company_users;
DROP POLICY IF EXISTS "Users can view company members" ON company_users;

-- Create new simplified policies for companies
CREATE POLICY "Users can view their companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (is_company_member(id, auth.uid()));

CREATE POLICY "Superusers can manage their companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (has_company_role(id, auth.uid(), ARRAY['superuser']));

-- Create new simplified policies for company_users
CREATE POLICY "Users can view company members"
  ON company_users
  FOR SELECT
  TO authenticated
  USING (is_company_member(company_id, auth.uid()));

CREATE POLICY "Superusers and admins can manage company users"
  ON company_users
  FOR ALL
  TO authenticated
  USING (has_company_role(company_id, auth.uid(), ARRAY['superuser', 'admin']));

-- Fix teams policies
DROP POLICY IF EXISTS "Company members can create teams" ON teams;
DROP POLICY IF EXISTS "Company members can view company teams" ON teams;
DROP POLICY IF EXISTS "Team leaders and admins can update teams" ON teams;

CREATE POLICY "Company members can view company teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (is_company_member(company_id, auth.uid()));

CREATE POLICY "Leaders and admins can create teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (has_company_role(company_id, auth.uid(), ARRAY['superuser', 'admin', 'leader']));

CREATE POLICY "Leaders and admins can update teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (
    has_company_role(company_id, auth.uid(), ARRAY['superuser', 'admin']) OR
    (has_company_role(company_id, auth.uid(), ARRAY['leader']) AND 
     EXISTS (SELECT 1 FROM user_teams WHERE team_id = teams.id AND user_id = auth.uid() AND is_leader = true))
  );

-- Fix user_invitations policies
DROP POLICY IF EXISTS "Admins and leaders can create invitations" ON user_invitations;
DROP POLICY IF EXISTS "Company members can view invitations" ON user_invitations;

CREATE POLICY "Company members can view invitations"
  ON user_invitations
  FOR SELECT
  TO authenticated
  USING (is_company_member(company_id, auth.uid()));

CREATE POLICY "Leaders and admins can create invitations"
  ON user_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid() AND 
    has_company_role(company_id, auth.uid(), ARRAY['superuser', 'admin', 'leader'])
  );

-- Fix tags policies to avoid recursion
DROP POLICY IF EXISTS "users_view_team_tags" ON tags;
DROP POLICY IF EXISTS "team_members_update_tags" ON tags;

-- Simplified tags policies
CREATE POLICY "users_view_team_tags"
  ON tags
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    assigned_to_user = auth.uid() OR
    (assigned_to_team IS NOT NULL AND 
     EXISTS (SELECT 1 FROM user_teams WHERE team_id = assigned_to_team AND user_id = auth.uid()))
  );

CREATE POLICY "team_members_update_tags"
  ON tags
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    assigned_to_user = auth.uid() OR
    (assigned_to_team IS NOT NULL AND 
     EXISTS (SELECT 1 FROM user_teams WHERE team_id = assigned_to_team AND user_id = auth.uid()))
  );

-- Enable RLS on user_teams if not already enabled
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION is_company_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION has_company_role(uuid, uuid, text[]) TO authenticated;