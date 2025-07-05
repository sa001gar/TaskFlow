/*
  # Create Helper Functions
  
  This migration creates optimized helper functions for common operations
  and permission checking without circular dependencies.
*/

-- =============================================
-- PERMISSION HELPER FUNCTIONS
-- =============================================

-- Check if user has specific role in company
CREATE OR REPLACE FUNCTION user_has_company_role(
  p_user_id UUID,
  p_company_id UUID,
  p_roles TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM company_memberships 
    WHERE user_id = p_user_id 
      AND company_id = p_company_id 
      AND role = ANY(p_roles) 
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is member of company
CREATE OR REPLACE FUNCTION user_is_company_member(
  p_user_id UUID,
  p_company_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM company_memberships 
    WHERE user_id = p_user_id 
      AND company_id = p_company_id 
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is team leader
CREATE OR REPLACE FUNCTION user_is_team_leader(
  p_user_id UUID,
  p_team_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM team_memberships 
    WHERE user_id = p_user_id 
      AND team_id = p_team_id 
      AND role = 'leader'
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is team member
CREATE OR REPLACE FUNCTION user_is_team_member(
  p_user_id UUID,
  p_team_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM team_memberships 
    WHERE user_id = p_user_id 
      AND team_id = p_team_id 
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's company from context
CREATE OR REPLACE FUNCTION get_user_company_id(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT company_id INTO v_company_id
  FROM company_memberships 
  WHERE user_id = p_user_id 
    AND is_active = true 
  ORDER BY 
    CASE role 
      WHEN 'owner' THEN 1 
      WHEN 'admin' THEN 2 
      WHEN 'manager' THEN 3 
      ELSE 4 
    END
  LIMIT 1;
  
  RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================
-- AUDIT AND TRIGGER FUNCTIONS
-- =============================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Task activity logging function
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO task_activities (task_id, user_id, activity_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status_change', OLD.status, NEW.status);
  END IF;
  
  -- Log assignment changes
  IF TG_OP = 'UPDATE' AND (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    INSERT INTO task_activities (task_id, user_id, activity_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'assignment', 
            COALESCE(OLD.assigned_to::TEXT, 'unassigned'), 
            COALESCE(NEW.assigned_to::TEXT, 'unassigned'));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate work session duration
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.total_minutes = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
    NEW.is_active = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- BUSINESS LOGIC FUNCTIONS
-- =============================================

-- Create user invitation
CREATE OR REPLACE FUNCTION create_user_invitation(
  p_email TEXT,
  p_company_id UUID,
  p_role TEXT DEFAULT 'member',
  p_team_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_invitation_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Check permissions
  IF NOT user_has_company_role(v_user_id, p_company_id, ARRAY['owner', 'admin', 'manager']) THEN
    RAISE EXCEPTION 'Insufficient permissions to invite users';
  END IF;
  
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;
  
  -- Create invitation
  INSERT INTO user_invitations (email, company_id, team_id, role, invited_by)
  VALUES (p_email, p_company_id, p_team_id, p_role, v_user_id)
  RETURNING id INTO v_invitation_id;
  
  RETURN v_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accept user invitation
CREATE OR REPLACE FUNCTION accept_user_invitation(p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_invitation user_invitations;
  v_user_id UUID := auth.uid();
BEGIN
  -- Get invitation
  SELECT * INTO v_invitation 
  FROM user_invitations 
  WHERE token = p_token 
    AND expires_at > NOW() 
    AND accepted_at IS NULL;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;
  
  -- Add user to company
  INSERT INTO company_memberships (user_id, company_id, role, invited_by)
  VALUES (v_user_id, v_invitation.company_id, v_invitation.role, v_invitation.invited_by);
  
  -- Add to team if specified
  IF v_invitation.team_id IS NOT NULL THEN
    INSERT INTO team_memberships (user_id, team_id, role)
    VALUES (v_user_id, v_invitation.team_id, 'member');
  END IF;
  
  -- Mark invitation as accepted
  UPDATE user_invitations 
  SET accepted_at = NOW() 
  WHERE id = v_invitation.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Request password reset
CREATE OR REPLACE FUNCTION request_password_reset(
  p_target_user_id UUID,
  p_company_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Check permissions
  IF NOT user_has_company_role(v_user_id, p_company_id, ARRAY['owner', 'admin']) THEN
    RAISE EXCEPTION 'Insufficient permissions to reset passwords';
  END IF;
  
  -- Check if target user is in company
  IF NOT user_is_company_member(p_target_user_id, p_company_id) THEN
    RAISE EXCEPTION 'User is not a member of this company';
  END IF;
  
  -- Create password reset request
  INSERT INTO password_reset_requests (user_id, company_id, requested_by)
  VALUES (p_target_user_id, p_company_id, v_user_id)
  RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Log function creation completion
INSERT INTO backup_schema.migration_log (operation, notes) 
VALUES ('create_functions', 'All helper and business logic functions created');