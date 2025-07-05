/*
  # Fix user invitations RLS policy

  1. Problem
    - RLS policy for user_invitations table is blocking INSERT operations
    - Missing required functions for policy checks

  2. Solution
    - Drop and recreate functions to avoid parameter conflicts
    - Create proper RLS policies for user_invitations table
    - Ensure functions use correct parameter names

  3. Changes
    - Drop existing functions if they exist
    - Create has_company_role and is_company_member functions
    - Update user_invitations RLS policies
*/

-- Drop existing functions first to avoid parameter conflicts
DROP FUNCTION IF EXISTS has_company_role(uuid, uuid, text[]);
DROP FUNCTION IF EXISTS is_company_member(uuid, uuid);

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

-- Drop existing policies for user_invitations
DROP POLICY IF EXISTS "Company members can view invitations" ON user_invitations;
DROP POLICY IF EXISTS "Leaders and admins can create invitations" ON user_invitations;
DROP POLICY IF EXISTS "Leaders and admins can update invitations" ON user_invitations;
DROP POLICY IF EXISTS "Leaders and admins can delete invitations" ON user_invitations;

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

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION has_company_role(uuid, uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION is_company_member(uuid, uuid) TO authenticated;