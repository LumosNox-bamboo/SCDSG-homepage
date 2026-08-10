ALTER TABLE abstract_submissions
  ADD COLUMN decision_result TEXT NOT NULL DEFAULT '';

ALTER TABLE abstract_submissions
  ADD COLUMN decision_email_1_status TEXT NOT NULL DEFAULT 'not_sent';

ALTER TABLE abstract_submissions
  ADD COLUMN decision_email_1_channel TEXT NOT NULL DEFAULT '';

ALTER TABLE abstract_submissions
  ADD COLUMN decision_email_2_status TEXT NOT NULL DEFAULT 'not_sent';

ALTER TABLE abstract_submissions
  ADD COLUMN decision_email_2_channel TEXT NOT NULL DEFAULT '';

ALTER TABLE abstract_submissions
  ADD COLUMN decision_any_sent INTEGER NOT NULL DEFAULT 0;

ALTER TABLE abstract_submissions
  ADD COLUMN decision_notified_at TEXT;

ALTER TABLE abstract_submissions
  ADD COLUMN decision_notified_by TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS abstract_submissions_decision_result_idx
  ON abstract_submissions(decision_result, created_at DESC);

CREATE INDEX IF NOT EXISTS abstract_submissions_decision_any_sent_idx
  ON abstract_submissions(decision_any_sent, created_at DESC);
