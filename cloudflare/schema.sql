PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  role TEXT NOT NULL CHECK (role IN ('admin','student')),
  github_login TEXT UNIQUE COLLATE NOCASE,
  password_salt TEXT,
  password_hash TEXT,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
  must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (must_change_password IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS classes (
  class_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS student_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  student_id TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  school TEXT NOT NULL,
  class_id TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','removed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attempts (
  attempt_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  subject_id TEXT NOT NULL CHECK (subject_id IN ('science','mathematics','english','social-science','hindi')),
  mode TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('submitted','timed-out')),
  started_at TEXT,
  submitted_at TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  score INTEGER NOT NULL CHECK (score >= 0),
  max_score INTEGER NOT NULL CHECK (max_score > 0),
  percentage REAL NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  UNIQUE (user_id, attempt_id)
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_submitted ON attempts(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_subject_submitted ON attempts(subject_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_class_status ON student_profiles(class_id, status);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expires_at);

CREATE TABLE IF NOT EXISTS oauth_states (
  state_hash TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS oauth_codes (
  code_hash TEXT PRIMARY KEY,
  github_login TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_limits (
  identifier_hash TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL,
  locked_until TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  target_id TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

INSERT OR IGNORE INTO classes(class_id,label,sort_order,active,created_at,updated_at)
VALUES ('6','Class 6',6,1,datetime('now'),datetime('now'));
INSERT OR IGNORE INTO classes(class_id,label,sort_order,active,created_at,updated_at)
VALUES ('7','Class 7',7,1,datetime('now'),datetime('now'));
INSERT OR IGNORE INTO classes(class_id,label,sort_order,active,created_at,updated_at)
VALUES ('8','Class 8',8,1,datetime('now'),datetime('now'));
INSERT OR IGNORE INTO classes(class_id,label,sort_order,active,created_at,updated_at)
VALUES ('9','Class 9',9,1,datetime('now'),datetime('now'));
INSERT OR IGNORE INTO classes(class_id,label,sort_order,active,created_at,updated_at)
VALUES ('10','Class 10',10,1,datetime('now'),datetime('now'));
INSERT OR IGNORE INTO classes(class_id,label,sort_order,active,created_at,updated_at)
VALUES ('11','Class 11',11,1,datetime('now'),datetime('now'));
INSERT OR IGNORE INTO classes(class_id,label,sort_order,active,created_at,updated_at)
VALUES ('12','Class 12',12,1,datetime('now'),datetime('now'));

CREATE TABLE IF NOT EXISTS handoff_codes (
  code_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  code_type TEXT NOT NULL CHECK (code_type IN ('student-login','account-access','account-return')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_handoff_expiry ON handoff_codes(expires_at);
