const CONFIRMATION_FROM = 'forum@scdsg-med.com';
const CONTACT_EMAIL = 'scdsg.heidelberg@gmail.com';
const SUBMISSION_CODE_PATTERN = /^SCDSG26-A-[A-F0-9]{10}$/u;

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
  if (locale === 'de') {
    return {
      to: recipient,
      from: { email: CONFIRMATION_FROM, name: 'SCDSG Nachwuchsforum' },
      replyTo: CONTACT_EMAIL,
      subject: 'Bestätigung Ihrer Abstract-Einreichung · SCDSG 2026',
      html: `<p>Ihre Einreichung wurde erfolgreich übermittelt.</p><p><strong>Einreichungsnummer: ${submissionCode}</strong></p><p>Wir wünschen Ihnen weiterhin viel Erfolg bei Ihrer Forschung.</p><p>Bei Fragen kontaktieren Sie bitte <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>`,
      text: `Ihre Einreichung wurde erfolgreich übermittelt.\n\nEinreichungsnummer: ${submissionCode}\n\nWir wünschen Ihnen weiterhin viel Erfolg bei Ihrer Forschung.\n\nBei Fragen kontaktieren Sie bitte ${CONTACT_EMAIL}.`
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

    const locale = body.locale === 'de' ? 'de' : 'zh';
    if (!validEmail(body.recipient) || !SUBMISSION_CODE_PATTERN.test(body.submissionCode)) {
      return json({ message: 'Invalid confirmation request.' }, 400);
    }

    try {
      await env.EMAIL.send(confirmationEmail(body.recipient, body.submissionCode, locale));
      console.log({ event: 'submission_confirmation_email_sent', submissionCode: body.submissionCode });
      return json({ sent: true });
    } catch (error) {
      console.error({
        event: 'submission_confirmation_email_failed',
        submissionCode: body.submissionCode,
        errorCode: error && typeof error === 'object' && 'code' in error ? error.code : 'unknown'
      });
      return json({ message: 'Email delivery request failed.' }, 502);
    }
  }
};
