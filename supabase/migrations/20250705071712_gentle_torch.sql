/*
  # Fix user invitations RLS policies

  1. Problem
    - User invitations table has RLS policy violations
    - Functions need to be recreated with proper permissions
    - Policies need to be updated to allow proper access

  2. Solution
    - Drop existing policies first
    - Drop and recreate functions with CASCADE to handle dependencies
    - Create new policies with proper permission checks
    - Grant execute permissions on functions
*/

-- Drop existing policies for user_invitations first
DROP POLICY IF EXISTS "Company members can view invitations" ON user_invitations;
DROP POLICY IF EXISTS "Leaders and admins can create invitations" ON user_invitations;
DROP POLICY IF EXISTS "Leaders and admins can update invitations" ON user_invitations;
DROP POLICY IF EXISTS "Leaders and admins can delete invitations" ON user_invitations;

-- Drop existing functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS has_company_role(uuid, uuid, text[]) CASCADE;
DROP FUNCTION IF EXISTS is_company_member(uuid, uuid) CASCADE;

-- Create function to check if user has specific role in company
CREATE OR REPLACE FUNCTION has_company_role(company_uuid uuid, user_uuid uuid, allowed_roles text[])
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM company_users 
    WHERE company_id = company_uuid 
      AND user_id = user_uuid 
      AND role = ANY(allowed_roles)
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is a member of company
CREATE OR REPLACE FUNCTION is_company_member(company_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM company_users 
    WHERE company_id = company_uuid 
      AND user_id = user_uuid 
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION has_company_role(uuid, uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION is_company_member(uuid, uuid) TO authenticated;

-- Create new policies for user_invitations
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
    has_company_role(company_id, auth.uid(), ARRAY['superuser'::text, 'admin'::text, 'leader'::text])
  );

CREATE POLICY "Leaders and admins can update invitations"
  ON user_invitations
  FOR UPDATE
  TO authenticated
  USING (has_company_role(company_id, auth.uid(), ARRAY['superuser'::text, 'admin'::text, 'leader'::text]))
  WITH CHECK (has_company_role(company_id, auth.uid(), ARRAY['superuser'::text, 'admin'::text, 'leader'::text]));

CREATE POLICY "Leaders and admins can delete invitations"
  ON user_invitations
  FOR DELETE
  TO authenticated
  USING (has_company_role(company_id, auth.uid(), ARRAY['superuser'::text, 'admin'::text, 'leader'::text]));