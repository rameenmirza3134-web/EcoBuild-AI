/*
# Create app_secrets table for API key storage

1. New Tables
- `app_secrets` — stores API keys needed by edge functions
- `key_name` (text, unique) — the name of the secret
- `key_value` (text) — the secret value
2. Security
- Enable RLS on app_secrets.
- Allow anon + authenticated to SELECT (edge functions use service role which bypasses RLS, but we keep it accessible)
- Actually, deny all access to anon/authenticated — only service role (bypasses RLS) can read
- No INSERT/UPDATE/DELETE policies for anon/authenticated — only service role can modify
*/

CREATE TABLE IF NOT EXISTS app_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,
  key_value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;

-- No policies = deny all access to anon and authenticated roles
-- Only the service role (which bypasses RLS) can read/write
