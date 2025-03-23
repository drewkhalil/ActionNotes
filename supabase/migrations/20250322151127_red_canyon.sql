/*
  # Create users table with usage tracking

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - matches auth.users.id
      - `usage_count` (integer) - tracks weekly usage
      - `last_reset` (timestamp) - when usage count was last reset
      - `is_premium` (boolean) - premium status
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on users table
    - Add policies for users to read/update their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  usage_count integer DEFAULT 0,
  last_reset timestamptz DEFAULT now(),
  is_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own usage data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);