import { validateSubmissionCodes } from './submission-export.js';

const MAX_RESULT_NOTIFICATIONS = 50;
const DECISIONS = new Set(['oral', 'poster', 'not_selected']);

export class SubmissionNotificationError extends Error {}

function placeholders(length) {
  return Array.from({ length }, () => '?').join(', ');
}

async function sendResultEmail(emailService, submission, recipient, decision) {
  if (!recipient) return { status: 'not_provided', channel: '' };
  if (!emailService) return { status: 'unavailable', channel: '' };

  try {
    const response = await emailService.fetch('https://confirmation-email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageType: 'decision',
        decision,
        recipient,
        submissionCode: submission.submission_code,
        fullName: submission.full_name,
        locale: submission.locale
      })
    });
    if (!response.ok) throw new Error('Email service rejected the request.');
    const result = await response.json().catch(() => ({}));
    return {
      status: 'sent',
      channel: typeof result.channel === 'string' ? result.channel.slice(0, 40) : 'cloudflare'
    };
  } catch {
    return { status: 'failed', channel: '' };
  }
}

export async function notifySubmissionResults(
  database,
  emailService,
  submissionCodeValues,
  decision,
  administrator,
  notifiedAt = new Date()
) {
  const submissionCodes = validateSubmissionCodes(submissionCodeValues);
  if (!submissionCodes.length || submissionCodes.length > MAX_RESULT_NOTIFICATIONS) {
    throw new SubmissionNotificationError('请选择 1–50 份有效投稿。');
  }
  if (!DECISIONS.has(decision)) {
    throw new SubmissionNotificationError('请选择有效的评审结果。');
  }

  const { results: submissions = [] } = await database.prepare(`
    SELECT id, submission_code, full_name, email, email_secondary, locale
      FROM abstract_submissions
     WHERE submission_code IN (${placeholders(submissionCodes.length)})
       AND deleted_at IS NULL
     ORDER BY created_at ASC
  `).bind(...submissionCodes).all();

  if (submissions.length !== submissionCodes.length) {
    throw new SubmissionNotificationError('部分投稿不存在或已被删除，请刷新后重试。');
  }

  const timestamp = notifiedAt.toISOString();
  const notificationResults = [];
  for (const submission of submissions) {
    const [primary, secondary] = await Promise.all([
      sendResultEmail(emailService, submission, submission.email, decision),
      sendResultEmail(emailService, submission, submission.email_secondary, decision)
    ]);
    const anySent = primary.status === 'sent' || secondary.status === 'sent';

    await database.batch([
      database.prepare(`
        UPDATE abstract_submissions
           SET decision_result = ?,
               decision_email_1_status = ?,
               decision_email_1_channel = ?,
               decision_email_2_status = ?,
               decision_email_2_channel = ?,
               decision_any_sent = ?,
               decision_notified_at = ?,
               decision_notified_by = ?
         WHERE id = ? AND deleted_at IS NULL
      `).bind(
        decision,
        primary.status,
        primary.channel,
        secondary.status,
        secondary.channel,
        anySent ? 1 : 0,
        timestamp,
        administrator,
        submission.id
      ),
      database.prepare(`
        INSERT INTO admin_audit_log (
          id, actor_email, action, entity_type, entity_id, details_json, created_at
        ) VALUES (?, ?, 'submission_result_notification', 'abstract_submission', ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        administrator,
        submission.id,
        JSON.stringify({
          decision,
          primaryStatus: primary.status,
          secondaryStatus: secondary.status,
          anySent
        }),
        timestamp
      )
    ]);

    notificationResults.push({
      submissionCode: submission.submission_code,
      primaryStatus: primary.status,
      secondaryStatus: secondary.status,
      anySent
    });
  }

  return notificationResults;
}

export { DECISIONS, MAX_RESULT_NOTIFICATIONS };
