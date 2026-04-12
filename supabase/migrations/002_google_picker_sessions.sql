-- Binds Google Picker session_id to the access_token used at sessions.create.
-- Prevents NOT_FOUND when user_tokens was overwritten by another tab/OAuth refresh.
CREATE TABLE IF NOT EXISTS google_picker_sessions (
  session_id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  access_token_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_picker_sessions_user_id
  ON google_picker_sessions(user_id);
