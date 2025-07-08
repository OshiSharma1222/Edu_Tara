/*
  # User Scoring System

  1. New Tables
    - `user_scores`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `module_type` (text: 'assessment', 'game', 'chapter', 'challenge')
      - `module_id` (text: identifier for the specific module)
      - `subject` (text: 'math' or 'english')
      - `grade` (integer: 1-5)
      - `score` (integer: score achieved)
      - `max_score` (integer: maximum possible score)
      - `percentage` (integer: calculated percentage)
      - `time_taken` (integer: time in seconds)
      - `attempts` (integer: number of attempts)
      - `completed_at` (timestamp)
      - `metadata` (jsonb: additional data like question responses)

  2. Security
    - Enable RLS on `user_scores` table
    - Add policies for users to manage their own scores

  3. Indexes
    - Add indexes for efficient querying by user, subject, and module type
*/

CREATE TABLE IF NOT EXISTS user_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_type text NOT NULL CHECK (module_type IN ('assessment', 'game', 'chapter', 'challenge')),
  module_id text NOT NULL,
  subject text NOT NULL CHECK (subject IN ('math', 'english')),
  grade integer NOT NULL CHECK (grade >= 1 AND grade <= 5),
  score integer NOT NULL DEFAULT 0,
  max_score integer NOT NULL DEFAULT 100,
  percentage integer GENERATED ALWAYS AS (
    CASE 
      WHEN max_score > 0 THEN ROUND((score::decimal / max_score::decimal) * 100)
      ELSE 0 
    END
  ) STORED,
  time_taken integer DEFAULT 0,
  attempts integer DEFAULT 1,
  completed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;

-- Policies for user_scores
CREATE POLICY "Users can read own scores"
  ON user_scores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scores"
  ON user_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scores"
  ON user_scores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_user_scores_user_id ON user_scores(user_id);
CREATE INDEX idx_user_scores_module_type ON user_scores(module_type);
CREATE INDEX idx_user_scores_subject ON user_scores(subject);
CREATE INDEX idx_user_scores_grade ON user_scores(grade);
CREATE INDEX idx_user_scores_completed_at ON user_scores(completed_at DESC);
CREATE INDEX idx_user_scores_user_subject ON user_scores(user_id, subject);

-- Trigger to update updated_at
CREATE TRIGGER update_user_scores_updated_at
  BEFORE UPDATE ON user_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();