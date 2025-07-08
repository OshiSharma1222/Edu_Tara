/*
  # Fix user creation RLS policy

  1. Security Updates
    - Update INSERT policy for users table to allow authenticated users to create their own profile
    - Ensure the policy correctly validates that the email matches the authenticated user's email

  2. Changes
    - Modify the INSERT policy to properly check email against auth.users.email
    - Ensure the policy allows creation during the signup process
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;

-- Create a new INSERT policy that allows users to create their own profile
CREATE POLICY "Users can create own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    email = (
      SELECT users.email 
      FROM auth.users 
      WHERE users.id = auth.uid()
    )::text
  );