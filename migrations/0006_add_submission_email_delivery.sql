ALTER TABLE abstract_submissions
  ADD COLUMN email_secondary TEXT NOT NULL DEFAULT '' COLLATE NOCASE;

ALTER TABLE abstract_submissions
  ADD COLUMN confirmation_email_1_status TEXT NOT NULL DEFAULT 'legacy_unknown';

ALTER TABLE abstract_submissions
  ADD COLUMN confirmation_email_1_channel TEXT NOT NULL DEFAULT '';

ALTER TABLE abstract_submissions
  ADD COLUMN confirmation_email_1_attempted_at TEXT;

ALTER TABLE abstract_submissions
  ADD COLUMN confirmation_email_2_status TEXT NOT NULL DEFAULT 'not_provided';

ALTER TABLE abstract_submissions
  ADD COLUMN confirmation_email_2_channel TEXT NOT NULL DEFAULT '';

ALTER TABLE abstract_submissions
  ADD COLUMN confirmation_email_2_attempted_at TEXT;

ALTER TABLE abstract_submissions
  ADD COLUMN confirmation_any_sent INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS abstract_submissions_email_secondary_idx
  ON abstract_submissions(email_secondary);

CREATE INDEX IF NOT EXISTS abstract_submissions_confirmation_any_sent_idx
  ON abstract_submissions(confirmation_any_sent, created_at DESC);
