/*
  # Add user_id column to user_scores table

  1. Schema Changes
    - Add `user_id` column to `user_scores` table (uuid type)
    - Add foreign key constraint linking to auth.users(id)
    - Update RLS policies to work with user_id
    - Add index for performance

  2. Data Migration
    - Populate user_id values based on existing email relationships
    - Maintain data integrity during transition

  3. Security
    - Update RLS policies to use user_id for better performance
    - Maintain existing email-based access patterns as fallback
*/

-- Add user_id column to user_scores table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_scores' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE user_scores ADD COLUMN user_id uuid;
  END IF;
END $$;

-- Populate user_id values based on existing email relationships
UPDATE user_scores 
SET user_id = users.user_id 
FROM users 
WHERE user_scores.email = users.email 
AND user_scores.user_id IS NULL;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_scores_user_id_fkey'
  ) THEN
    ALTER TABLE user_scores 
    ADD CONSTRAINT user_scores_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for user_id column
CREATE INDEX IF NOT EXISTS idx_user_scores_user_id ON user_scores(user_id);

-- Update RLS policies to include user_id checks
DROP POLICY IF EXISTS "Users can read own scores" ON user_scores;
CREATE POLICY "Users can read own scores"
  ON user_scores
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
  );

DROP POLICY IF EXISTS "Users can insert own scores" ON user_scores;
CREATE POLICY "Users can insert own scores"
  ON user_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR 
    email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
  );

DROP POLICY IF EXISTS "Users can update own scores" ON user_scores;
CREATE POLICY "Users can update own scores"
  ON user_scores
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
  );