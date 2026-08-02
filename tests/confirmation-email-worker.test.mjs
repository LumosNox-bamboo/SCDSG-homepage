import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../workers/confirmation-email/src/index.js';

function request(body) {
  return new Request('https://confirmation-email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

test('sends the requested Chinese confirmation through the email binding', async () => {
  const messages = [];
  const response = await worker.fetch(request({
    recipient: 'researcher@example.com',
    submissionCode: 'SCDSG26-A-123456789A',
    locale: 'zh'
  }), {
    EMAIL: {
      async send(message) {
        messages.push(message);
        return { messageId: 'test-message-id' };
      }
    }
  });

  assert.equal(response.status, 200);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].to, 'researcher@example.com');
  assert.equal(messages[0].from.email, 'forum@scdsg-med.com');
  assert.equal(messages[0].replyTo, 'scdsg.heidelberg@gmail.com');
  assert.match(messages[0].subject, /投稿确认/u);
  assert.match(messages[0].text, /SCDSG26-A-123456789A/u);
  assert.match(messages[0].text, /祝科研顺利/u);
});

test('sends an English confirmation for an English submission', async () => {
  const messages = [];
  const response = await worker.fetch(request({
    recipient: 'researcher@example.com',
    submissionCode: 'SCDSG26-A-123456789A',
    locale: 'en'
  }), {
    EMAIL: {
      async send(message) {
        messages.push(message);
        return { messageId: 'test-message-id' };
      }
    }
  });

  assert.equal(response.status, 200);
  assert.equal(messages.length, 1);
  assert.match(messages[0].subject, /Submission Confirmation/u);
  assert.match(messages[0].text, /Submission number: SCDSG26-A-123456789A/u);
  assert.match(messages[0].text, /success in your research/u);
});

test('rejects a malformed confirmation request without sending email', async () => {
  let sends = 0;
  const response = await worker.fetch(request({
    recipient: 'not-an-email',
    submissionCode: 'bad-code',
    locale: 'zh'
  }), {
    EMAIL: {
      async send() {
        sends += 1;
      }
    }
  });

  assert.equal(response.status, 400);
  assert.equal(sends, 0);
});

test('uses Gmail API when the Cloudflare email binding rejects a recipient', async () => {
  const requests = [];
  const response = await worker.fetch(request({
    recipient: 'researcher@example.com',
    submissionCode: 'SCDSG26-A-123456789A',
    locale: 'zh'
  }), {
    EMAIL: {
      async send() {
        throw Object.assign(new Error('Rejected'), { code: 'E_VALIDATION_ERROR' });
      }
    },
    GMAIL_CLIENT_ID: 'test-client-id',
    GMAIL_CLIENT_SECRET: 'test-client-secret',
    GMAIL_REFRESH_TOKEN: 'test-refresh-token',
    GMAIL_HTTP: {
      async fetch(input, init) {
        requests.push({ input, init });
        if (input.includes('oauth2.googleapis.com')) {
          return Response.json({ access_token: 'test-access-token' });
        }
        return Response.json({ id: 'gmail-message-id' });
      }
    }
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.channel, 'gmail_fallback');
  assert.equal(requests.length, 2);
  assert.match(String(requests[0].init.body), /grant_type=refresh_token/u);
  assert.equal(requests[1].init.headers.Authorization, 'Bearer test-access-token');
  const gmailPayload = JSON.parse(requests[1].init.body);
  assert.match(gmailPayload.raw, /^[A-Za-z0-9_-]+$/u);
});

test('fails safely when both email channels are unavailable', async () => {
  const response = await worker.fetch(request({
    recipient: 'researcher@example.com',
    submissionCode: 'SCDSG26-A-123456789A',
    locale: 'zh'
  }), {
    EMAIL: {
      async send() {
        throw Object.assign(new Error('Rejected'), { code: 'E_DELIVERY_FAILED' });
      }
    }
  });

  assert.equal(response.status, 502);
});
