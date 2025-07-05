/*
  # Fix user invitations RLS policy

  1. Functions
    - Create `has_company_role()` function to check user roles in companies
    - Create `is_company_member()` function to check company membership

  2. Security
    - Update RLS policies for user_invitations table
    - Ensure proper access control for invitation creation
*/

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

-- Create new policies for user_invitations
CREATE POLICY "Company members can view invitations"
  ON user_invitations
  FOR SELECT
  TO authenticated
  USING (is_company_member(company_id, uid()));

CREATE POLICY "Leaders and admins can create invitations"
  ON user_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = uid() AND 
    has_company_role(company_id, uid(), ARRAY['superuser'::text, 'admin'::text, 'leader'::text])
  );

CREATE POLICY "Leaders and admins can update invitations"
  ON user_invitations
  FOR UPDATE
  TO authenticated
  USING (has_company_role(company_id, uid(), ARRAY['superuser'::text, 'admin'::text, 'leader'::text]))
  WITH CHECK (has_company_role(company_id, uid(), ARRAY['superuser'::text, 'admin'::text, 'leader'::text]));

CREATE POLICY "Leaders and admins can delete invitations"
  ON user_invitations
  FOR DELETE
  TO authenticated
  USING (has_company_role(company_id, uid(), ARRAY['superuser'::text, 'admin'::text, 'leader'::text]));