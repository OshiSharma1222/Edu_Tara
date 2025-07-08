/*
  # Fix RLS policy for users table INSERT operation

  1. Problem Analysis
    - The current INSERT policy is failing because it's not properly matching the authenticated user's email
    - The policy needs to allow users to insert their own profile during signup

  2. Solution
    - Drop the existing problematic INSERT policy
    - Create a new policy that properly checks the authenticated user's email
    - Ensure the policy allows users to create profiles with their own email address

  3. Security
    - Users can only insert records with their own authenticated email
    - Maintains data security while allowing profile creation
*/

-- Drop the existing INSERT policy that's causing issues
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;

-- Create a new INSERT policy that properly allows users to create their own profile
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    email = (
      SELECT auth.users.email 
      FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );

-- Also ensure the UPDATE and SELECT policies are correct
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    email = (
      SELECT auth.users.email 
      FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  )
  WITH CHECK (
    email = (
      SELECT auth.users.email 
      FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Enable read for users based on email" ON users;
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    email = (
      SELECT auth.users.email 
      FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );