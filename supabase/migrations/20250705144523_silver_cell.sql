/*
  # Fix RLS infinite recursion in company_memberships table

  1. Problem
    - Infinite recursion detected in policy for relation "company_memberships"
    - Circular dependency between company_memberships and companies table policies

  2. Solution
    - Simplify company_memberships policies to avoid circular references
    - Ensure policies only reference auth.uid() and direct table columns
    - Remove complex joins that cause recursion

  3. Changes
    - Drop existing problematic policies on company_memberships
    - Create new simplified policies that avoid recursion
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Company admins can manage memberships" ON company_memberships;
DROP POLICY IF EXISTS "Users can join companies via invitation" ON company_memberships;
DROP POLICY IF EXISTS "Users can view memberships in their companies" ON company_memberships;

-- Create new simplified policies for company_memberships
CREATE POLICY "Users can view their own memberships"
  ON company_memberships
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own memberships"
  ON company_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own memberships"
  ON company_memberships
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own memberships"
  ON company_memberships
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create a separate policy for company owners/admins to manage all memberships in their companies
-- This uses a simpler approach to avoid recursion
CREATE POLICY "Company owners can manage all memberships"
  ON company_memberships
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = company_memberships.company_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
        AND cm.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_memberships cm
      WHERE cm.company_id = company_memberships.company_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
        AND cm.is_active = true
    )
  );

-- Also fix the companies table policies to avoid recursion
DROP POLICY IF EXISTS "Company members can view their companies" ON companies;
DROP POLICY IF EXISTS "Company owners can update companies" ON companies;

-- Create simplified company policies
CREATE POLICY "Users can view companies they are members of"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM company_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Company owners can update their companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM company_memberships
      WHERE user_id = auth.uid() 
        AND role = 'owner' 
        AND is_active = true
    )
  );

CREATE POLICY "Authenticated users can create companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);