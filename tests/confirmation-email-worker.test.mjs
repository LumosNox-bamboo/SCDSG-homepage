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
