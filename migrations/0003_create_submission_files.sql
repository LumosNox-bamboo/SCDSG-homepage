CREATE TABLE IF NOT EXISTS submission_files (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  original_file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_extension TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  purpose TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending_review',
  uploaded_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (submission_id) REFERENCES abstract_submissions(id) ON DELETE CASCADE,
  CHECK (purpose IN ('cv', 'figure')),
  CHECK (size_bytes > 0)
);

CREATE INDEX IF NOT EXISTS submission_files_submission_id_idx
  ON submission_files(submission_id);

CREATE INDEX IF NOT EXISTS submission_files_review_status_idx
  ON submission_files(review_status);
