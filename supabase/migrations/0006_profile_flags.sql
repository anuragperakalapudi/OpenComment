ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_flags text[] NOT NULL DEFAULT '{}';
