import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createExportResponse,
  sanitizeSegment,
  validateSubmissionCodes
} from '../functions/lib/submission-export.js';
import {
  consentDetails,
  createSubmissionDocument
} from '../functions/lib/submission-document.js';
import { softDeleteSubmissions } from '../functions/lib/submission-admin.js';

const submission = {
  id: 'submission-1',
  submission_code: 'SCDSG26-A-1234567890',
  full_name: '测试 / 投稿人',
  email: 'test@example.com',
  institution: '测试医学院',
  career_stage: 'postdoc',
  contribution_title: 'A translational medicine study',
  research_area: 'translational',
  presentation_preference: 'either',
  abstract_text: 'Background. Methods. Results. Conclusion.',
  keywords: 'medicine; translation',
  status: 'submitted',
  consent_version: 'forum-2026-v2',
  consented_at: '2026-08-01T10:00:00.000Z',
  created_at: '2026-08-01T10:00:00.000Z'
};

const files = [
  {
    submission_id: submission.id,
    object_key: 'private/test/cv.pdf',
    original_file_name: 'cv.pdf',
    mime_type: 'application/pdf',
    file_extension: 'pdf',
    size_bytes: 8,
    checksum_sha256: 'unused',
    purpose: 'cv',
    uploaded_at: submission.created_at
  },
  {
    submission_id: submission.id,
    object_key: 'private/test/figure.jpg',
    original_file_name: 'figure.jpg',
    mime_type: 'image/jpeg',
    file_extension: 'jpg',
    size_bytes: 6,
    checksum_sha256: 'unused',
    purpose: 'figure',
    uploaded_at: submission.created_at
  }
];

test('validates and deduplicates selected submission codes', () => {
  assert.deepEqual(
    validateSubmissionCodes([submission.submission_code, submission.submission_code]),
    [submission.submission_code]
  );
  assert.deepEqual(validateSubmissionCodes(['invalid']), []);
});

test('sanitizes applicant names used in archive paths', () => {
  assert.equal(sanitizeSegment('测试 / 投稿人', 'applicant'), '测试_投稿人');
  assert.equal(sanitizeSegment('../../', 'applicant'), 'applicant');
});

test('creates a non-empty Word document', async () => {
  const document = await createSubmissionDocument(submission, files);
  assert.ok(document.byteLength > 1_000);
  assert.equal(document[0], 0x50);
  assert.equal(document[1], 0x4b);
});

test('describes the exact consent scope recorded for the submission', () => {
  const consent = consentDetails('forum-2026-v2');
  assert.equal(consent.items.length, 3);
  assert.match(consent.items.join('\n'), /个人简历/u);
  assert.match(consent.items.join('\n'), /匿名学术评审/u);
  assert.match(consent.items.join('\n'), /会务联络/u);
});

test('soft deletes selected submissions without touching private files', async () => {
  const batches = [];
  const database = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async all() {
              return { results: [{ id: submission.id, submission_code: submission.submission_code }] };
            },
            sql,
            values
          };
        }
      };
    },
    async batch(statements) {
      batches.push(statements);
      return statements.map(() => ({ success: true, results: [], meta: {} }));
    }
  };

  const deleted = await softDeleteSubmissions(
    database,
    [submission.submission_code],
    'administrator@example.com',
    new Date('2026-08-02T12:00:00.000Z')
  );

  assert.deepEqual(deleted, [submission.submission_code]);
  assert.equal(batches.length, 1);
  assert.equal(batches[0].length, 2);
  assert.match(batches[0][0].sql, /UPDATE abstract_submissions/u);
  assert.match(batches[0][1].sql, /INSERT INTO admin_audit_log/u);
});

test('streams a ZIP containing document and private attachments', async () => {
  const bodies = new Map([
    ['private/test/cv.pdf', new TextEncoder().encode('PDF test')],
    ['private/test/figure.jpg', new TextEncoder().encode('figure')]
  ]);
  const bucket = {
    async head(key) {
      const body = bodies.get(key);
      return body ? { size: body.byteLength } : null;
    },
    async get(key) {
      const body = bodies.get(key);
      return body ? {
        body: new Blob([body]).stream(),
        uploaded: new Date('2026-08-01T10:00:00.000Z')
      } : null;
    }
  };
  const response = await createExportResponse(
    [submission],
    new Map([[submission.id, files]]),
    bucket,
    new Date('2026-08-01T12:00:00.000Z')
  );
  const archive = new Uint8Array(await response.arrayBuffer());
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Disposition'), /SCDSG_forum_2026_submissions_20260801\.zip/u);
  assert.equal(archive[0], 0x50);
  assert.equal(archive[1], 0x4b);
});
