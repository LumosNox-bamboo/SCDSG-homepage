ALTER TABLE abstract_submissions
  ADD COLUMN presentation_preference TEXT NOT NULL DEFAULT 'either'
  CHECK (presentation_preference IN ('oral', 'poster', 'either'));

CREATE INDEX IF NOT EXISTS abstract_submissions_presentation_preference_idx
  ON abstract_submissions(presentation_preference);
