/*
  # Fix users table structure and RLS policies

  1. Changes
    - Update RLS policies to work with email-based primary key
    - Ensure proper user creation flow
    - Fix policy conditions for insert operations

  2. Security
    - Update RLS policies to allow authenticated users to insert their own data
    - Maintain security while allowing proper user creation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies that work with the current table structure
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Ensure the id column is properly set as NOT NULL since it's used in foreign key
ALTER TABLE users ALTER COLUMN id SET NOT NULL;