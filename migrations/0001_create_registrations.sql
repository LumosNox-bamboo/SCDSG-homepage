CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  registration_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  institution TEXT NOT NULL,
  career_stage TEXT NOT NULL,
  attendance_mode TEXT NOT NULL,
  research_area TEXT NOT NULL,
  abstract_interest TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  locale TEXT NOT NULL DEFAULT 'zh',
  status TEXT NOT NULL DEFAULT 'registered',
  consented_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS registrations_created_at_idx
  ON registrations(created_at DESC);

CREATE INDEX IF NOT EXISTS registrations_attendance_mode_idx
  ON registrations(attendance_mode);

CREATE INDEX IF NOT EXISTS registrations_abstract_interest_idx
  ON registrations(abstract_interest);
