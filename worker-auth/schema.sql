-- CKW Discord login. Knight Stage 2: add/edit only, never delete; audit_log append-only.
CREATE TABLE IF NOT EXISTS members (
  discord_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  is_si INTEGER NOT NULL DEFAULT 0,
  owner_discord_id TEXT,            -- set only for SI members, owner confirms (not self-declared)
  blocked INTEGER NOT NULL DEFAULT 0,          -- revoke-by-flag (no delete)
  session_epoch INTEGER NOT NULL DEFAULT 0,    -- bump to kill every session of this member
  last_verified_at TEXT NOT NULL,              -- last time Discord confirmed CKD membership
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id_hash TEXT PRIMARY KEY,         -- SHA-256 of the cookie token; raw token never stored
  discord_id TEXT NOT NULL REFERENCES members(discord_id),
  session_epoch INTEGER NOT NULL,              -- copied from members at login
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT                   -- logout sets this; rows are never deleted
);
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  actor_discord_id TEXT,
  action TEXT NOT NULL,
  detail TEXT
);
CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit_log BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit_log BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;
CREATE TRIGGER IF NOT EXISTS members_no_delete BEFORE DELETE ON members BEGIN SELECT RAISE(ABORT, 'members are never deleted'); END;
CREATE TRIGGER IF NOT EXISTS sessions_no_delete BEFORE DELETE ON sessions BEGIN SELECT RAISE(ABORT, 'sessions are never deleted'); END;
