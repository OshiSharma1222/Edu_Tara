/*
  # Update user_scores table to reference users table

  1. Changes
    - Update foreign key constraint to reference users(email)
    - Ensure data consistency

  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing foreign key constraint if it exists
ALTER TABLE user_scores DROP CONSTRAINT IF EXISTS user_scores_email_fkey;

-- Add new foreign key constraint referencing users table
ALTER TABLE user_scores 
ADD CONSTRAINT user_scores_email_fkey 
FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE;