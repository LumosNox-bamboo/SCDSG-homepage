CREATE TABLE IF NOT EXISTS abstract_submissions (
  id TEXT PRIMARY KEY,
  submission_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  institution TEXT NOT NULL,
  career_stage TEXT NOT NULL,
  contribution_title TEXT NOT NULL,
  research_area TEXT NOT NULL,
  abstract_text TEXT NOT NULL,
  keywords TEXT NOT NULL,
  cv_object_key TEXT NOT NULL,
  cv_file_name TEXT NOT NULL,
  cv_size INTEGER NOT NULL,
  figure_object_key TEXT NOT NULL DEFAULT '',
  figure_file_name TEXT NOT NULL DEFAULT '',
  figure_content_type TEXT NOT NULL DEFAULT '',
  figure_size INTEGER NOT NULL DEFAULT 0,
  locale TEXT NOT NULL DEFAULT 'zh',
  status TEXT NOT NULL DEFAULT 'submitted',
  consented_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS abstract_submissions_created_at_idx
  ON abstract_submissions(created_at DESC);

CREATE INDEX IF NOT EXISTS abstract_submissions_email_idx
  ON abstract_submissions(email);

CREATE INDEX IF NOT EXISTS abstract_submissions_research_area_idx
  ON abstract_submissions(research_area);

CREATE INDEX IF NOT EXISTS abstract_submissions_status_idx
  ON abstract_submissions(status);
