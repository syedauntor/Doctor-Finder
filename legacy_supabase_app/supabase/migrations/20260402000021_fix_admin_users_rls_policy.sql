/*
  # Fix Admin Users RLS Policy - Remove Infinite Recursion

  1. Changes
    - Drop the existing recursive policy on admin_users table
    - Create a new simple policy that allows authenticated users to read their own admin record
    - This prevents infinite recursion by using a direct check instead of a subquery

  2. Security
    - Users can only read their own admin_users record
    - No recursive checking that causes infinite loops
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;

-- Create a simple, non-recursive policy
-- Users can only read their own admin record
CREATE POLICY "Users can read own admin record"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
