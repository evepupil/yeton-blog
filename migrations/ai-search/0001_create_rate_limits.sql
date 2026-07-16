CREATE TABLE IF NOT EXISTS ai_rate_limits (
  scope TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count >= 0),
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS ai_rate_limits_updated_at_idx
  ON ai_rate_limits (updated_at);
