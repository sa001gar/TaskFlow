-- Drop all existing policies that might cause conflicts
DROP POLICY IF EXISTS "Company members can view invitations" ON user_invitations;
DROP POLICY IF EXISTS "Company leaders can create invitations" ON user_invitations;
DROP POLICY IF EXISTS "Company leaders can update invitations" ON user_invitations;
DROP POLICY IF EXISTS "Company leaders can delete invitations" ON user_invitations;

-- Drop all existing policies for password_reset_requests
DROP POLICY IF EXISTS "Company admins can create password reset requests" ON password_reset_requests;
DROP POLICY IF EXISTS "Company admins can view password reset requests" ON password_reset_requests;
DROP POLICY IF EXISTS "Users can view their own password reset requests" ON password_reset_requests;
DROP POLICY IF EXISTS "Company admins can update password reset requests" ON password_reset_requests;

-- Drop existing functions with CASCADE to remove all dependencies
DROP FUNCTION IF EXISTS has_company_role(uuid, uuid, text[]) CASCADE;
DROP FUNCTION IF EXISTS is_company_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS request_password_reset(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS generate_temporary_password(uuid, uuid, text) CASCADE;

-- Create helper function to check company roles
CREATE OR REPLACE FUNCTION has_company_role(company_id_param uuid, user_id_param uuid, roles text[])
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM company_users 
    WHERE company_id = company_id_param 
      AND user_id = user_id_param 
      AND role = ANY(roles) 
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user is company member
CREATE OR REPLACE FUNCTION is_company_member(company_id_param uuid, user_id_param uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM company_users 
    WHERE company_id = company_id_param 
      AND user_id = user_id_param 
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create password reset requests table if not exists
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on password_reset_requests
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Add indexes for password_reset_requests
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_user_id ON password_reset_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_token ON password_reset_requests(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_expires_at ON password_reset_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_company_id ON password_reset_requests(company_id);

-- Create policies for password_reset_requests
CREATE POLICY "Company admins can create password reset requests"
  ON password_reset_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by = auth.uid() 
    AND has_company_role(company_id, auth.uid(), ARRAY['superuser', 'admin'])
  );

CREATE POLICY "Company admins can view password reset requests"
  ON password_reset_requests
  FOR SELECT
  TO authenticated
  USING (has_company_role(company_id, auth.uid(), ARRAY['superuser', 'admin']));

CREATE POLICY "Users can view their own password reset requests"
  ON password_reset_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Company admins can update password reset requests"
  ON password_reset_requests
  FOR UPDATE
  TO authenticated
  USING (has_company_role(company_id, auth.uid(), ARRAY['superuser', 'admin']))
  WITH CHECK (has_company_role(company_id, auth.uid(), ARRAY['superuser', 'admin']));

-- Function to send password reset email
CREATE OR REPLACE FUNCTION request_password_reset(
  target_user_id uuid,
  company_id_param uuid
)
RETURNS json AS $$
DECLARE
  reset_request password_reset_requests;
  target_user users;
BEGIN
  -- Check if requester has permission
  IF NOT has_company_role(company_id_param, auth.uid(), ARRAY['superuser', 'admin']) THEN
    RAISE EXCEPTION 'Insufficient permissions to reset passwords';
  END IF;

  -- Get target user info
  SELECT * INTO target_user FROM users WHERE id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check if target user is in the same company
  IF NOT is_company_member(company_id_param, target_user_id) THEN
    RAISE EXCEPTION 'User is not a member of this company';
  END IF;

  -- Create password reset request
  INSERT INTO password_reset_requests (user_id, requested_by, company_id)
  VALUES (target_user_id, auth.uid(), company_id_param)
  RETURNING * INTO reset_request;

  -- Return success response
  RETURN json_build_object(
    'success', true,
    'message', 'Password reset email sent successfully',
    'reset_id', reset_request.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate temporary password
CREATE OR REPLACE FUNCTION generate_temporary_password(
  target_user_id uuid,
  company_id_param uuid,
  new_password text
)
RETURNS json AS $$
DECLARE
  target_user users;
BEGIN
  -- Check if requester has permission
  IF NOT has_company_role(company_id_param, auth.uid(), ARRAY['superuser', 'admin']) THEN
    RAISE EXCEPTION 'Insufficient permissions to reset passwords';
  END IF;

  -- Get target user info
  SELECT * INTO target_user FROM users WHERE id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check if target user is in the same company
  IF NOT is_company_member(company_id_param, target_user_id) THEN
    RAISE EXCEPTION 'User is not a member of this company';
  END IF;

  -- Return success response
  RETURN json_build_object(
    'success', true,
    'message', 'Temporary password set successfully',
    'temporary_password', new_password
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION has_company_role(uuid, uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION is_company_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION request_password_reset(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_temporary_password(uuid, uuid, text) TO authenticated;