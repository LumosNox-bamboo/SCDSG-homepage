import assert from 'node:assert/strict';
import test from 'node:test';

import {
  notifySubmissionResults,
  SubmissionNotificationError
} from '../functions/lib/submission-result-notification.js';

const submission = {
  id: 'submission-1',
  submission_code: 'SCDSG26-A-1234567890',
  full_name: '测试投稿人',
  email: 'primary@example.com',
  email_secondary: 'backup@example.org',
  locale: 'zh'
};

function makeDatabase() {
  const batches = [];
  return {
    batches,
    prepare(sql) {
      return {
        bind(...values) {
          return {
            sql,
            values,
            async all() {
              return { results: [submission] };
            }
          };
        }
      };
    },
    async batch(statements) {
      batches.push(statements);
      return statements.map(() => ({ success: true }));
    }
  };
}

test('sends a selected result to both addresses and audits the outcome', async () => {
  const database = makeDatabase();
  const requests = [];
  const emailService = {
    async fetch(input, init) {
      const body = JSON.parse(init.body);
      requests.push({ input, body });
      return body.recipient === 'primary@example.com'
        ? Response.json({ sent: true, channel: 'cloudflare' })
        : Response.json({ message: 'failed' }, { status: 502 });
    }
  };

  const results = await notifySubmissionResults(
    database,
    emailService,
    [submission.submission_code],
    'oral',
    'administrator@example.com',
    new Date('2026-10-08T10:00:00.000Z')
  );

  assert.equal(requests.length, 2);
  assert.equal(requests[0].body.messageType, 'decision');
  assert.equal(requests[0].body.decision, 'oral');
  assert.equal(results[0].primaryStatus, 'sent');
  assert.equal(results[0].secondaryStatus, 'failed');
  assert.equal(results[0].anySent, true);
  assert.equal(database.batches.length, 1);
  assert.equal(database.batches[0].length, 2);
  assert.match(database.batches[0][0].sql, /UPDATE abstract_submissions/u);
  assert.match(database.batches[0][1].sql, /INSERT INTO admin_audit_log/u);
});

test('rejects an invalid result before sending', async () => {
  const database = makeDatabase();
  await assert.rejects(
    notifySubmissionResults(
      database,
      { fetch: async () => Response.json({ sent: true }) },
      [submission.submission_code],
      'invalid',
      'administrator@example.com'
    ),
    SubmissionNotificationError
  );
  assert.equal(database.batches.length, 0);
});
