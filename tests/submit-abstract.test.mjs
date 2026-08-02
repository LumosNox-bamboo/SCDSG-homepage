import test from 'node:test';
import assert from 'node:assert/strict';
import { File } from 'node:buffer';
import { onRequestPost } from '../functions/api/submit-abstract.js';

function makeForm() {
  const form = new FormData();
  form.set('fullName', 'Test User');
  form.set('email', 'test@example.com');
  form.set('institution', 'Test Institution');
  form.set('careerStage', 'postdoc');
  form.set('contributionTitle', 'A Test Contribution');
  form.set('researchArea', 'translational');
  form.set('presentationPreference', 'either');
  form.set('abstractText', 'This is a valid test abstract.');
  form.set('keywords', 'test; abstract; medicine');
  form.set('consent', 'true');
  form.set('locale', 'zh');
  form.set('cvFile', new File(
    [new TextEncoder().encode('%PDF-1.4\nTest document\n%%EOF')],
    'test-cv.pdf',
    { type: 'application/pdf' }
  ));
  return form;
}

function makeEnvironment() {
  const stored = new Map();
  const batches = [];
  const confirmationRequests = [];
  const bucket = {
    async put(key, body, options) {
      stored.set(key, { body, options });
    },
    async delete(keys) {
      for (const key of Array.isArray(keys) ? keys : [keys]) stored.delete(key);
    }
  };
  const database = {
    prepare(sql) {
      return {
        bind(...values) {
          return { sql, values };
        }
      };
    },
    async batch(statements) {
      batches.push(statements);
      return statements.map(() => ({ success: true }));
    }
  };
  const confirmationEmail = {
    async fetch(input, init) {
      const request = new Request(input, init);
      confirmationRequests.push({
        url: request.url,
        method: request.method,
        body: await request.json()
      });
      return Response.json({ sent: true });
    }
  };

  return {
    env: {
      REGISTRATIONS_DB: database,
      SUBMISSION_FILES: bucket,
      CONFIRMATION_EMAIL: confirmationEmail
    },
    stored,
    batches,
    confirmationRequests
  };
}

function makeRequest(form) {
  return new Request('https://scdsg-med.com/api/submit-abstract', {
    method: 'POST',
    headers: { Origin: 'https://scdsg-med.com' },
    body: form
  });
}

test('stores a valid abstract and required PDF privately', async () => {
  const state = makeEnvironment();
  const backgroundTasks = [];
  const response = await onRequestPost({
    request: makeRequest(makeForm()),
    env: state.env,
    waitUntil(task) {
      backgroundTasks.push(task);
    }
  });
  await Promise.all(backgroundTasks);
  const result = await response.json();

  assert.equal(response.status, 201);
  assert.match(result.submissionId, /^SCDSG26-A-[A-F0-9]{10}$/u);
  assert.equal(state.stored.size, 1);
  assert.equal(state.batches.length, 1);
  assert.equal(state.batches[0].length, 2);
  assert.equal(state.batches[0][0].values[8], 'either');
  assert.ok(state.batches[0][0].values.includes('forum-2026-v2'));
  assert.equal(
    [...state.batches[0][0].sql.matchAll(/\?/gu)].length,
    state.batches[0][0].values.length
  );
  assert.match([...state.stored.keys()][0], /^private\/forum\/2026\/[0-9a-f-]+\/cv\.pdf$/u);
  assert.equal(state.confirmationRequests.length, 1);
  assert.equal(state.confirmationRequests[0].url, 'https://confirmation-email/send');
  assert.equal(state.confirmationRequests[0].method, 'POST');
  assert.deepEqual(state.confirmationRequests[0].body, {
    recipient: 'test@example.com',
    submissionCode: result.submissionId,
    locale: 'zh'
  });
});

test('stores one optional valid figure with its metadata', async () => {
  const form = makeForm();
  const pngSignature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  form.set('figureFile', new File([pngSignature], 'figure.png', { type: 'image/png' }));
  const state = makeEnvironment();

  const response = await onRequestPost({
    request: makeRequest(form),
    env: state.env
  });

  assert.equal(response.status, 201);
  assert.equal(state.stored.size, 2);
  assert.equal(state.batches[0].length, 3);
});

test('keeps a saved submission successful when confirmation email fails', async () => {
  const state = makeEnvironment();
  const backgroundTasks = [];
  state.env.CONFIRMATION_EMAIL.fetch = async () => {
    throw new Error('Test email failure');
  };

  const response = await onRequestPost({
    request: makeRequest(makeForm()),
    env: state.env,
    waitUntil(task) {
      backgroundTasks.push(task);
    }
  });
  await Promise.all(backgroundTasks);

  assert.equal(response.status, 201);
  assert.equal(state.batches.length, 1);
  assert.equal(state.stored.size, 1);
});

test('rejects a file whose bytes do not match PDF', async () => {
  const form = makeForm();
  form.set('cvFile', new File(['not a pdf'], 'test-cv.pdf', { type: 'application/pdf' }));
  const state = makeEnvironment();

  const response = await onRequestPost({
    request: makeRequest(form),
    env: state.env
  });
  const result = await response.json();

  assert.equal(response.status, 400);
  assert.match(result.message, /PDF/u);
  assert.equal(state.stored.size, 0);
  assert.equal(state.batches.length, 0);
});

test('rejects an invalid presentation preference', async () => {
  const form = makeForm();
  form.set('presentationPreference', 'invalid');
  const state = makeEnvironment();

  const response = await onRequestPost({
    request: makeRequest(form),
    env: state.env
  });

  assert.equal(response.status, 400);
  assert.equal(state.stored.size, 0);
  assert.equal(state.batches.length, 0);
});

test('fails safely when storage bindings are unavailable', async () => {
  const response = await onRequestPost({
    request: makeRequest(makeForm()),
    env: {}
  });

  assert.equal(response.status, 503);
});
