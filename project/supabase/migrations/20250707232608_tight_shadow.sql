/*
  # Remove id column from users table

  1. Schema Changes
    - Remove id column from users table
    - Update foreign key constraints to reference auth.users(id) directly
    - Update RLS policies to work with email as primary key
    - Update triggers and functions

  2. Security
    - Maintain RLS policies for data protection
    - Update policies to use auth.uid() properly
*/

-- First, drop existing foreign key constraints and policies
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Drop the trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_unique;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Remove the id column from users table
ALTER TABLE users DROP COLUMN IF EXISTS id;

-- Update user_scores to reference auth.users directly instead of through users table
-- The user_id in user_scores will continue to reference auth.users(id)
-- This maintains the relationship while simplifying the users table

-- Create new RLS policies for users table using email
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Update the handle_new_user function to work without id column
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
  user_grade integer;
BEGIN
  -- Extract metadata safely
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  user_grade := COALESCE((NEW.raw_user_meta_data->>'grade')::integer, 1);
  
  -- Insert user profile using email as primary key
  INSERT INTO users (email, name, grade)
  VALUES (NEW.email, user_name, user_grade)
  ON CONFLICT (email) DO UPDATE SET
    name = CASE 
      WHEN EXCLUDED.name IS NOT NULL AND EXCLUDED.name != '' 
      THEN EXCLUDED.name 
      ELSE users.name 
    END,
    grade = CASE 
      WHEN EXCLUDED.grade IS NOT NULL 
      THEN EXCLUDED.grade 
      ELSE users.grade 
    END,
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail auth
    RAISE WARNING 'User profile creation failed for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure user_scores policies are still correct (they reference auth.users(id) directly)
DROP POLICY IF EXISTS "Users can insert own scores" ON user_scores;
DROP POLICY IF EXISTS "Users can read own scores" ON user_scores;
DROP POLICY IF EXISTS "Users can update own scores" ON user_scores;

CREATE POLICY "Users can insert own scores"
  ON user_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own scores"
  ON user_scores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own scores"
  ON user_scores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update indexes
DROP INDEX IF EXISTS idx_users_id;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Ensure user_scores still has proper foreign key to auth.users
DO $$
BEGIN
  -- Check if foreign key exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_scores_user_id_fkey'
  ) THEN
    ALTER TABLE user_scores 
    ADD CONSTRAINT user_scores_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;