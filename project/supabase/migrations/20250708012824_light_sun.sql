/*
  # Create user_scores table

  1. New Tables
    - `user_scores`
      - `email` (text, primary key) - References users.email
      - `module_type` (text) - Type of module: assessment, game, chapter, challenge
      - `module_id` (text) - Identifier for the specific module
      - `subject` (text) - Subject: math or english
      - `grade` (integer) - Grade level (1-5)
      - `score` (integer) - Points scored
      - `max_score` (integer) - Maximum possible points
      - `percentage` (integer) - Calculated percentage score
      - `time_taken` (integer) - Time taken in seconds
      - `attempts` (integer) - Number of attempts
      - `completed_at` (timestamptz) - When the module was completed
      - `metadata` (jsonb) - Additional data like chapter_id, chapter_name
      - `created_at` (timestamptz) - Record creation time
      - `updated_at` (timestamptz) - Last update time

  2. Security
    - Enable RLS on `user_scores` table
    - Add policies for authenticated users to manage their own scores
    - Add foreign key constraint to users table

  3. Constraints and Indexes
    - Check constraints for valid grades (1-5), subjects, and module types
    - Indexes for efficient querying by email, subject, grade, etc.
    - Trigger for automatic updated_at timestamp updates
*/

-- Create the user_scores table
CREATE TABLE IF NOT EXISTS user_scores (
  email text PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
  module_type text NOT NULL CHECK (module_type = ANY (ARRAY['assessment'::text, 'game'::text, 'chapter'::text, 'challenge'::text])),
  module_id text NOT NULL,
  subject text NOT NULL CHECK (subject = ANY (ARRAY['math'::text, 'english'::text])),
  grade integer NOT NULL CHECK (grade >= 1 AND grade <= 5),
  score integer NOT NULL DEFAULT 0,
  max_score integer NOT NULL DEFAULT 100,
  percentage integer GENERATED ALWAYS AS (
    CASE
      WHEN max_score > 0 THEN round(((score::numeric / max_score::numeric) * 100::numeric))
      ELSE 0::numeric
    END
  ) STORED,
  time_taken integer DEFAULT 0,
  attempts integer DEFAULT 1,
  completed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_scores_email ON user_scores USING btree (email);
CREATE INDEX IF NOT EXISTS idx_user_scores_subject ON user_scores USING btree (subject);
CREATE INDEX IF NOT EXISTS idx_user_scores_grade ON user_scores USING btree (grade);
CREATE INDEX IF NOT EXISTS idx_user_scores_module_type ON user_scores USING btree (module_type);
CREATE INDEX IF NOT EXISTS idx_user_scores_email_subject ON user_scores USING btree (email, subject);
CREATE INDEX IF NOT EXISTS idx_user_scores_completed_at ON user_scores USING btree (completed_at DESC);

-- Enable Row Level Security
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_user_scores_updated_at
  BEFORE UPDATE ON user_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();