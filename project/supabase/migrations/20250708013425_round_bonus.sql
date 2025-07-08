/*
  # Create user_scores table for tracking learning progress

  1. New Tables
    - `user_scores`
      - `email` (text, primary key, foreign key to users)
      - `module_type` (text, assessment/game/chapter/challenge)
      - `module_id` (text, identifier for specific module)
      - `subject` (text, math/english)
      - `grade` (integer, 1-5)
      - `score` (integer, points earned)
      - `max_score` (integer, maximum possible points)
      - `percentage` (computed column)
      - `time_taken` (integer, seconds)
      - `attempts` (integer, number of attempts)
      - `completed_at` (timestamp)
      - `metadata` (jsonb, additional data)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_scores` table
    - Add policies for authenticated users to manage their own scores

  3. Performance
    - Add indexes for common query patterns
    - Add trigger for automatic updated_at timestamp
*/

-- Create the user_scores table
CREATE TABLE IF NOT EXISTS user_scores (
  email text PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
  module_type text NOT NULL CHECK (module_type IN ('assessment', 'game', 'chapter', 'challenge')),
  module_id text NOT NULL,
  subject text NOT NULL CHECK (subject IN ('math', 'english')),
  grade integer NOT NULL CHECK (grade >= 1 AND grade <= 5),
  score integer NOT NULL DEFAULT 0,
  max_score integer NOT NULL DEFAULT 100,
  percentage integer GENERATED ALWAYS AS (
    CASE
      WHEN max_score > 0 THEN round(((score::numeric / max_score::numeric) * 100))
      ELSE 0::numeric
    END
  ) STORED,
  time_taken integer DEFAULT 0, -- in seconds
  attempts integer DEFAULT 1,
  completed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can read own scores" ON user_scores;
DROP POLICY IF EXISTS "Users can insert own scores" ON user_scores;
DROP POLICY IF EXISTS "Users can update own scores" ON user_scores;

-- Create policies for user_scores
CREATE POLICY "Users can read own scores"
  ON user_scores
  FOR SELECT
  TO authenticated
  USING (email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text);

CREATE POLICY "Users can insert own scores"
  ON user_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text);

CREATE POLICY "Users can update own scores"
  ON user_scores
  FOR UPDATE
  TO authenticated
  USING (email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text)
  WITH CHECK (email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_scores_email ON user_scores(email);
CREATE INDEX IF NOT EXISTS idx_user_scores_subject ON user_scores(subject);
CREATE INDEX IF NOT EXISTS idx_user_scores_grade ON user_scores(grade);
CREATE INDEX IF NOT EXISTS idx_user_scores_module_type ON user_scores(module_type);
CREATE INDEX IF NOT EXISTS idx_user_scores_completed_at ON user_scores(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_scores_email_subject ON user_scores(email, subject);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_scores_updated_at ON user_scores;

-- Create trigger for updated_at
CREATE TRIGGER update_user_scores_updated_at
  BEFORE UPDATE ON user_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();