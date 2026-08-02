const CONFIRMATION_FROM = 'forum@scdsg-med.com';
const CONTACT_EMAIL = 'scdsg.heidelberg@gmail.com';
const SUBMISSION_CODE_PATTERN = /^SCDSG26-A-[A-F0-9]{10}$/u;
const GMAIL_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

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

function validEmail(value) {
  return typeof value === 'string' &&
    value.length <= 160 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(value);
}

function confirmationEmail(recipient, submissionCode, locale) {
  if (locale === 'en') {
    return {
      to: recipient,
      from: { email: CONFIRMATION_FROM, name: 'SCDSG Young Scholars Forum' },
      replyTo: CONTACT_EMAIL,
      subject: 'Abstract Submission Confirmation · SCDSG 2026',
      html: `<p>Your abstract has been submitted successfully.</p><p><strong>Submission number: ${submissionCode}</strong></p><p>We wish you every success in your research.</p><p>If you have any questions, please contact <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>`,
      text: `Your abstract has been submitted successfully.\n\nSubmission number: ${submissionCode}\n\nWe wish you every success in your research.\n\nIf you have any questions, please contact ${CONTACT_EMAIL}.`
    };
  }

  return {
    to: recipient,
    from: { email: CONFIRMATION_FROM, name: 'SCDSG 青年学术论坛' },
    replyTo: CONTACT_EMAIL,
    subject: '摘要投稿确认 · SCDSG 2026',
    html: `<p>您的摘要投稿已成功提交。</p><p><strong>投稿编号：${submissionCode}</strong></p><p>祝科研顺利。</p><p>如有问题，请联系 <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>。</p>`,
    text: `您的摘要投稿已成功提交。\n\n投稿编号：${submissionCode}\n\n祝科研顺利。\n\n如有问题，请联系 ${CONTACT_EMAIL}。`
  };
}

function errorCode(error) {
  return error && typeof error === 'object' && 'code' in error ? String(error.code) : 'unknown';
}

function gmailFallbackConfigured(env) {
  return Boolean(env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN);
}

function utf8Base64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}

function base64Url(value) {
  return utf8Base64(value).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/gu, '');
}

function encodedWord(value) {
  return `=?UTF-8?B?${utf8Base64(value)}?=`;
}

function gmailMime(message) {
  const boundary = `scdsg-${crypto.randomUUID()}`;
  return [
    `From: ${encodedWord('SCDSG 青年学术论坛')} <${CONTACT_EMAIL}>`,
    `To: ${message.to}`,
    `Reply-To: ${CONTACT_EMAIL}`,
    `Subject: ${encodedWord(message.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    utf8Base64(message.text),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    utf8Base64(message.html),
    `--${boundary}--`,
    ''
  ].join('\r\n');
}

async function sendWithGmail(env, message) {
  if (!gmailFallbackConfigured(env)) throw Object.assign(new Error('Gmail fallback is not configured.'), { code: 'GMAIL_NOT_CONFIGURED' });
  const gmailFetch = env.GMAIL_HTTP?.fetch
    ? env.GMAIL_HTTP.fetch.bind(env.GMAIL_HTTP)
    : fetch;
  const tokenResponse = await gmailFetch(GMAIL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GMAIL_CLIENT_ID,
      client_secret: env.GMAIL_CLIENT_SECRET,
      refresh_token: env.GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });
  if (!tokenResponse.ok) {
    await tokenResponse.body?.cancel();
    throw Object.assign(new Error('Gmail token request failed.'), { code: 'GMAIL_TOKEN_FAILED' });
  }
  const token = await tokenResponse.json();
  if (typeof token.access_token !== 'string' || !token.access_token) {
    throw Object.assign(new Error('Gmail token response was invalid.'), { code: 'GMAIL_TOKEN_INVALID' });
  }
  const sendResponse = await gmailFetch(GMAIL_SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: base64Url(gmailMime(message)) })
  });
  if (!sendResponse.ok) {
    await sendResponse.body?.cancel();
    throw Object.assign(new Error('Gmail send request failed.'), { code: 'GMAIL_SEND_FAILED' });
  }
  await sendResponse.body?.cancel();
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) {
      return json({ message: 'Invalid request format.' }, 415);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ message: 'Invalid request format.' }, 400);
    }

    const locale = body.locale === 'en' ? 'en' : 'zh';
    if (!validEmail(body.recipient) || !SUBMISSION_CODE_PATTERN.test(body.submissionCode)) {
      return json({ message: 'Invalid confirmation request.' }, 400);
    }

    const message = confirmationEmail(body.recipient, body.submissionCode, locale);
    try {
      await env.EMAIL.send(message);
      console.log({ event: 'submission_confirmation_email_sent', submissionCode: body.submissionCode, channel: 'cloudflare' });
      return json({ sent: true, channel: 'cloudflare' });
    } catch (primaryError) {
      const primaryErrorCode = errorCode(primaryError);
      try {
        await sendWithGmail(env, message);
        console.log({
          event: 'submission_confirmation_email_sent',
          submissionCode: body.submissionCode,
          channel: 'gmail_fallback',
          primaryErrorCode
        });
        return json({ sent: true, channel: 'gmail_fallback' });
      } catch (fallbackError) {
        console.error({
          event: 'submission_confirmation_email_failed',
          submissionCode: body.submissionCode,
          primaryErrorCode,
          fallbackErrorCode: errorCode(fallbackError)
        });
        return json({ message: 'Email delivery request failed.' }, 502);
      }
    }
  }
};
