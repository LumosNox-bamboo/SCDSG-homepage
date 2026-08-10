import { authenticateAdmin } from '../../lib/admin-auth.js';
import {
  notifySubmissionResults,
  SubmissionNotificationError
} from '../../lib/submission-result-notification.js';

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export async function onRequestPost(context) {
  const auth = await authenticateAdmin(context.request, context.env);
  if (auth.response) return auth.response;
  if (!context.env.REGISTRATIONS_DB || !context.env.CONFIRMATION_EMAIL) {
    return json({ message: '数据库或发信服务未完成配置。' }, 503);
  }
  if (!context.request.headers.get('Content-Type')?.startsWith('application/json')) {
    return json({ message: '请求格式无效。' }, 415);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ message: '请求格式无效。' }, 400);
  }

  try {
    const notificationResults = await notifySubmissionResults(
      context.env.REGISTRATIONS_DB,
      context.env.CONFIRMATION_EMAIL,
      body.submissionCodes,
      body.decision,
      auth.email
    );
    const successful = notificationResults.filter((result) => result.anySent).length;
    console.log({
      event: 'admin_submission_results_notified',
      administrator: auth.email,
      decision: body.decision,
      submissionCount: notificationResults.length,
      successful
    });
    return json({ notificationResults, successful });
  } catch (error) {
    console.error({
      event: 'admin_submission_result_notification_failed',
      administrator: auth.email,
      error: error instanceof Error ? error.message : String(error)
    });
    if (error instanceof SubmissionNotificationError) return json({ message: error.message }, 409);
    return json({ message: '评审结果通知发送失败，请刷新后核对状态。' }, 500);
  }
}

export function onRequestGet() {
  return json({ message: 'Method not allowed.' }, 405);
}
