import { validateSubmissionCodes } from './submission-export.js';

export class SubmissionAdminError extends Error {}

function placeholders(length) {
  return Array.from({ length }, () => '?').join(', ');
}

export async function softDeleteSubmissions(database, value, administrator, deletedAt = new Date()) {
  const submissionCodes = validateSubmissionCodes(value);
  if (!submissionCodes.length) throw new SubmissionAdminError('请选择 1–200 份有效投稿。');

  const { results: submissions = [] } = await database.prepare(`
    SELECT id, submission_code
      FROM abstract_submissions
     WHERE submission_code IN (${placeholders(submissionCodes.length)})
       AND deleted_at IS NULL
  `).bind(...submissionCodes).all();

  if (submissions.length !== submissionCodes.length) {
    throw new SubmissionAdminError('部分投稿不存在或已被删除，请刷新后重试。');
  }

  const timestamp = deletedAt.toISOString();
  const statements = [];
  for (const submission of submissions) {
    statements.push(
      database.prepare(`
        UPDATE abstract_submissions
           SET deleted_at = ?, deleted_by = ?
         WHERE id = ? AND deleted_at IS NULL
      `).bind(timestamp, administrator, submission.id),
      database.prepare(`
        INSERT INTO admin_audit_log (
          id, actor_email, action, entity_type, entity_id, details_json, created_at
        ) VALUES (?, ?, 'submission_soft_deleted', 'abstract_submission', ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        administrator,
        submission.id,
        JSON.stringify({ reason: 'administrator_selected' }),
        timestamp
      )
    );
  }

  await database.batch(statements);
  return submissions.map((submission) => submission.submission_code);
}
