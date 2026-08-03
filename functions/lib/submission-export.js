import { downloadZip } from 'client-zip';
import { createSubmissionDocument } from './submission-document.js';

const MAX_EXPORT_SUBMISSIONS = 200;

function csvCell(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function sanitizeSegment(value, fallback) {
  const cleaned = String(value || '')
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/gu, '')
    .replace(/\s+/gu, '_')
    .replace(/^\.+|\.+$/gu, '')
    .slice(0, 60);
  return cleaned || fallback;
}

function manifestCsv(submissions, fileMap) {
  const rows = [[
    'submission_code',
    'full_name',
    'email_1',
    'email_2',
    'institution',
    'contribution_title',
    'research_area',
    'presentation_preference',
    'status',
    'created_at',
    'confirmation_email_1_status',
    'confirmation_email_2_status',
    'confirmation_any_sent',
    'file_count'
  ]];

  for (const submission of submissions) {
    rows.push([
      submission.submission_code,
      submission.full_name,
      submission.email,
      submission.email_secondary,
      submission.institution,
      submission.contribution_title,
      submission.research_area,
      submission.presentation_preference,
      submission.status,
      submission.created_at,
      submission.confirmation_email_1_status,
      submission.confirmation_email_2_status,
      submission.confirmation_any_sent,
      fileMap.get(submission.id)?.length || 0
    ]);
  }

  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

function placeholders(length) {
  return Array.from({ length }, () => '?').join(', ');
}

export function validateSubmissionCodes(value) {
  if (!Array.isArray(value) || !value.length || value.length > MAX_EXPORT_SUBMISSIONS) return [];
  const unique = [...new Set(value.map((code) => String(code).trim()))];
  return unique.every((code) => /^SCDSG26-A-[A-Z0-9]{10}$/u.test(code)) ? unique : [];
}

export async function loadExportRecords(database, submissionCodes) {
  const submissionQuery = `
    SELECT id, submission_code, full_name, email, email_secondary, institution, career_stage,
           contribution_title, research_area, presentation_preference,
           abstract_text, keywords, status, consent_version, consented_at, created_at,
           confirmation_email_1_status, confirmation_email_1_channel,
           confirmation_email_1_attempted_at, confirmation_email_2_status,
           confirmation_email_2_channel, confirmation_email_2_attempted_at,
           confirmation_any_sent
      FROM abstract_submissions
     WHERE submission_code IN (${placeholders(submissionCodes.length)})
       AND deleted_at IS NULL
     ORDER BY created_at ASC
  `;
  const { results: submissions = [] } = await database
    .prepare(submissionQuery)
    .bind(...submissionCodes)
    .all();

  if (submissions.length !== submissionCodes.length) {
    throw new Error('部分投稿不存在或已被删除。');
  }

  const ids = submissions.map((submission) => submission.id);
  const fileQuery = `
    SELECT submission_id, object_key, original_file_name, mime_type,
           file_extension, size_bytes, checksum_sha256, purpose, uploaded_at
      FROM submission_files
     WHERE submission_id IN (${placeholders(ids.length)})
       AND deleted_at IS NULL
     ORDER BY submission_id, purpose
  `;
  const { results: files = [] } = await database
    .prepare(fileQuery)
    .bind(...ids)
    .all();

  const fileMap = new Map(ids.map((id) => [id, []]));
  for (const file of files) fileMap.get(file.submission_id)?.push(file);

  return { submissions, fileMap };
}

export async function createExportResponse(submissions, fileMap, bucket, exportedAt = new Date()) {
  const preparedDocuments = new Map();
  const metadata = [];
  const manifest = manifestCsv(submissions, fileMap);
  metadata.push({ name: 'manifest.csv', size: new TextEncoder().encode(manifest).byteLength });

  for (const submission of submissions) {
    const files = fileMap.get(submission.id) || [];
    if (!files.some((file) => file.purpose === 'cv')) {
      throw new Error(`${submission.submission_code} 缺少个人简历记录。`);
    }
    const folder = `${sanitizeSegment(submission.submission_code, 'submission')}_${sanitizeSegment(submission.full_name, 'applicant')}`;
    const document = await createSubmissionDocument(submission, files);
    preparedDocuments.set(submission.id, { folder, document });
    metadata.push({ name: `${folder}/投稿信息.docx`, size: document.byteLength });

    for (const file of files) {
      const object = await bucket.head(file.object_key);
      if (!object || object.size !== file.size_bytes) {
        throw new Error(`${submission.submission_code} 的附件不存在或大小不一致。`);
      }
      const outputName = file.purpose === 'cv'
        ? '简历.pdf'
        : `补充图表.${sanitizeSegment(file.file_extension, 'bin')}`;
      metadata.push({ name: `${folder}/${outputName}`, size: object.size });
    }
  }

  async function* entries() {
    yield { name: 'manifest.csv', input: manifest, lastModified: exportedAt };
    for (const submission of submissions) {
      const files = fileMap.get(submission.id) || [];
      const prepared = preparedDocuments.get(submission.id);
      yield {
        name: `${prepared.folder}/投稿信息.docx`,
        input: prepared.document,
        lastModified: exportedAt
      };
      for (const file of files) {
        const object = await bucket.get(file.object_key);
        if (!object) throw new Error(`${submission.submission_code} 的附件读取失败。`);
        const outputName = file.purpose === 'cv'
          ? '简历.pdf'
          : `补充图表.${sanitizeSegment(file.file_extension, 'bin')}`;
        yield {
          name: `${prepared.folder}/${outputName}`,
          input: object.body,
          lastModified: object.uploaded
        };
      }
    }
  }

  const date = exportedAt.toISOString().slice(0, 10).replaceAll('-', '');
  const archive = downloadZip(entries(), { metadata, buffersAreUTF8: true });
  const headers = new Headers(archive.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('Content-Disposition', `attachment; filename="SCDSG_forum_2026_submissions_${date}.zip"`);
  headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  headers.set('X-Content-Type-Options', 'nosniff');

  return new Response(archive.body, { status: 200, headers });
}

export { manifestCsv, sanitizeSegment };
