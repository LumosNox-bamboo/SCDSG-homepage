ALTER TABLE abstract_submissions
  ADD COLUMN consent_version TEXT NOT NULL DEFAULT 'forum-2026-v1';

ALTER TABLE abstract_submissions
  ADD COLUMN deleted_at TEXT;

ALTER TABLE abstract_submissions
  ADD COLUMN deleted_by TEXT;

CREATE INDEX IF NOT EXISTS abstract_submissions_deleted_at_idx
  ON abstract_submissions(deleted_at);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_audit_log_entity_idx
  ON admin_audit_log(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON admin_audit_log(created_at DESC);
