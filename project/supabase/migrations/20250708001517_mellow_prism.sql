/*
  # Fix users table structure and RLS policies

  1. Table Structure
    - Ensure users table has proper columns
    - Add user_id column to match auth.uid() if needed

  2. Security
    - Update RLS policies to use proper auth.uid() matching
    - Ensure policies allow authenticated users to manage their own data

  3. Performance
    - Add necessary indexes
*/

-- First, let's check if we need to add a user_id column
-- If your current setup uses email as primary key, we'll add user_id for RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE users ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
  END IF;
END $$;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable read for users based on email" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;

-- Create new RLS policies that work with both email and user_id approaches
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if either user_id matches auth.uid() OR email matches auth user email
    (user_id = auth.uid()) OR 
    (email = (SELECT auth.users.email FROM auth.users WHERE auth.users.id = auth.uid()))
  );

CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if either user_id matches auth.uid() OR email matches auth user email
    (user_id = auth.uid()) OR 
    (email = (SELECT auth.users.email FROM auth.users WHERE auth.users.id = auth.uid()))
  );

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if either user_id matches auth.uid() OR email matches auth user email
    (user_id = auth.uid()) OR 
    (email = (SELECT auth.users.email FROM auth.users WHERE auth.users.id = auth.uid()))
  )
  WITH CHECK (
    -- Ensure they can only update to their own data
    (user_id = auth.uid()) OR 
    (email = (SELECT auth.users.email FROM auth.users WHERE auth.users.id = auth.uid()))
  );