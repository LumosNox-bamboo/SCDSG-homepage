import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createExportResponse,
  sanitizeSegment,
  validateSubmissionCodes
} from '../functions/lib/submission-export.js';
import { createSubmissionDocument } from '../functions/lib/submission-document.js';

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

