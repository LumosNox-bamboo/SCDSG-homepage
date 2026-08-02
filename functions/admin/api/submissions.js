import { authenticateAdmin } from '../../lib/admin-auth.js';

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

export async function onRequestGet(context) {
  const auth = await authenticateAdmin(context.request, context.env);
  if (auth.response) return auth.response;
  if (!context.env.REGISTRATIONS_DB) return json({ message: 'D1 数据库未绑定。' }, 503);

  try {
    const { results = [] } = await context.env.REGISTRATIONS_DB.prepare(`
      SELECT s.submission_code, s.full_name, s.institution,
             s.contribution_title, s.research_area,
             s.presentation_preference, s.status, s.created_at,
             COUNT(f.id) AS file_count,
             SUM(CASE WHEN f.purpose = 'figure' THEN 1 ELSE 0 END) AS figure_count
        FROM abstract_submissions s
        LEFT JOIN submission_files f
          ON f.submission_id = s.id AND f.deleted_at IS NULL
       WHERE s.deleted_at IS NULL
       GROUP BY s.id
       ORDER BY s.created_at DESC
       LIMIT 500
    `).all();
    return json({ submissions: results, administrator: auth.email });
  } catch (error) {
    console.error({
      event: 'admin_submission_list_failed',
      error: error instanceof Error ? error.message : String(error)
    });
    return json({ message: '暂时无法读取投稿列表。' }, 500);
  }
}

export function onRequestPost() {
  return json({ message: 'Method not allowed.' }, 405);
}
