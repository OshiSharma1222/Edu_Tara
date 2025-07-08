/*
  # Fix Chapter Questions Table Creation

  1. New Tables
    - `chapter_questions`
      - `id` (uuid, primary key)
      - `chapter_id` (text, identifier for chapter)
      - `question_text` (text, the question content)
      - `options` (jsonb, answer options)
      - `correct_answer` (integer, index of correct option)
      - `difficulty` (text, easy/medium/hard)
      - `topic` (text, question topic)
      - `explanation` (text, explanation of answer)
      - `grade` (integer, 1-5)
      - `subject` (text, math/english)
      - `validated` (boolean, if question is validated)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `chapter_questions` table
    - Add policy for authenticated users to read questions (only if it doesn't exist)

  3. Performance
    - Add indexes for common query patterns
    - Add trigger for automatic updated_at timestamp
    - Create view for validated questions only
*/

-- Create the chapter_questions table
CREATE TABLE IF NOT EXISTS chapter_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id text NOT NULL,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topic text NOT NULL,
  explanation text NOT NULL,
  grade integer NOT NULL CHECK (grade >= 1 AND grade <= 5),
  subject text NOT NULL CHECK (subject IN ('math', 'english')),
  validated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chapter_questions ENABLE ROW LEVEL SECURITY;

-- Check if policy exists before creating it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chapter_questions' 
    AND policyname = 'Anyone can read chapter questions'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can read chapter questions"
      ON chapter_questions
      FOR SELECT
      TO authenticated
      USING (true)';
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chapter_questions_chapter_id ON chapter_questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_questions_grade ON chapter_questions(grade);
CREATE INDEX IF NOT EXISTS idx_chapter_questions_subject ON chapter_questions(subject);
CREATE INDEX IF NOT EXISTS idx_chapter_questions_validated ON chapter_questions(validated);

-- Create trigger for updated_at (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_chapter_questions_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_chapter_questions_updated_at
      BEFORE UPDATE ON chapter_questions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- If the trigger check fails because the table doesn't exist yet, create it anyway
    EXECUTE 'CREATE TRIGGER update_chapter_questions_updated_at
      BEFORE UPDATE ON chapter_questions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()';
END $$;

-- Drop existing view if it exists, then create new one
DROP VIEW IF EXISTS validated_chapter_questions;

-- Create a view for validated questions
CREATE VIEW validated_chapter_questions AS
SELECT * FROM chapter_questions WHERE validated = true;