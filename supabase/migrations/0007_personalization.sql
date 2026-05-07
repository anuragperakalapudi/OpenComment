ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tracking_keywords text[]  NOT NULL DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followed_agencies  text[]  NOT NULL DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS situations         jsonb   NOT NULL DEFAULT '[]';
