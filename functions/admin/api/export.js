import { authenticateAdmin } from '../../lib/admin-auth.js';
import {
  createExportResponse,
  loadExportRecords,
  validateSubmissionCodes
} from '../../lib/submission-export.js';

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
  if (!context.env.REGISTRATIONS_DB || !context.env.SUBMISSION_FILES) {
    return json({ message: 'D1 或私有 R2 尚未绑定。' }, 503);
  }

  let body;
  try {
    const contentType = context.request.headers.get('Content-Type') || '';
    if (contentType.startsWith('application/json')) {
      body = await context.request.json();
    } else if (contentType.startsWith('application/x-www-form-urlencoded')) {
      const form = await context.request.formData();
      body = { submissionCodes: JSON.parse(String(form.get('submissionCodes') || '[]')) };
    } else {
      return json({ message: '请求格式无效。' }, 415);
    }
  } catch {
    return json({ message: '请求格式无效。' }, 400);
  }

  const submissionCodes = validateSubmissionCodes(body.submissionCodes);
  if (!submissionCodes.length) {
    return json({ message: '请选择 1–200 份有效投稿。' }, 400);
  }

  try {
    const { submissions, fileMap } = await loadExportRecords(
      context.env.REGISTRATIONS_DB,
      submissionCodes
    );
    console.log({
      event: 'admin_submission_export_started',
      administrator: auth.email,
      submissionCount: submissions.length
    });
    return await createExportResponse(
      submissions,
      fileMap,
      context.env.SUBMISSION_FILES
    );
  } catch (error) {
    console.error({
      event: 'admin_submission_export_failed',
      administrator: auth.email,
      submissionCount: submissionCodes.length,
      error: error instanceof Error ? error.message : String(error)
    });
    return json({
      message: error instanceof Error ? error.message : '导出失败，请稍后重试。'
    }, 409);
  }
}

export function onRequestGet() {
  return json({ message: 'Method not allowed.' }, 405);
}
