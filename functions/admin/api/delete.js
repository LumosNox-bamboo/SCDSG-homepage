import { authenticateAdmin } from '../../lib/admin-auth.js';
import {
  softDeleteSubmissions,
  SubmissionAdminError
} from '../../lib/submission-admin.js';

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
  if (!context.env.REGISTRATIONS_DB) return json({ message: 'D1 数据库未绑定。' }, 503);
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
    const deletedSubmissionCodes = await softDeleteSubmissions(
      context.env.REGISTRATIONS_DB,
      body.submissionCodes,
      auth.email
    );
    console.log({
      event: 'admin_submissions_soft_deleted',
      administrator: auth.email,
      submissionCount: deletedSubmissionCodes.length
    });
    return json({ deletedSubmissionCodes });
  } catch (error) {
    console.error({
      event: 'admin_submission_delete_failed',
      administrator: auth.email,
      error: error instanceof Error ? error.message : String(error)
    });
    if (error instanceof SubmissionAdminError) return json({ message: error.message }, 409);
    return json({ message: '删除失败，请稍后重试。' }, 500);
  }
}

export function onRequestGet() {
  return json({ message: 'Method not allowed.' }, 405);
}
