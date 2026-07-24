const MAX_REQUEST_BYTES = 100 * 1024;
const MAX_ABSTRACT_WORDS = 300;

const CAREER_STAGES = new Set([
  'doctoral',
  'postdoc',
  'clinician',
  'pi',
  'industry',
  'other'
]);

const RESEARCH_AREAS = new Set([
  'basic',
  'clinical',
  'translational',
  'ai',
  'pharma',
  'other'
]);

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

function cleanString(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/gu, ' ').slice(0, maxLength);
}

function cleanMultiline(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\r\n?/gu, '\n').slice(0, maxLength);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(email);
}

function countWords(value) {
  return value.trim() ? value.trim().split(/\s+/u).length : 0;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');

  if (origin && origin !== url.origin) {
    return json({ message: 'Invalid request origin.' }, 403);
  }

  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('multipart/form-data')) {
    return json({ message: 'Expected multipart form data.' }, 415);
  }

  const contentLengthHeader = request.headers.get('Content-Length');
  const contentLength = Number(contentLengthHeader);
  if (!contentLengthHeader || !Number.isFinite(contentLength) || contentLength <= 0) {
    return json({ message: '无法确认投稿大小，请刷新页面后重试。' }, 411);
  }

  if (contentLength > MAX_REQUEST_BYTES) {
    return json({ message: '投稿内容超过允许大小。' }, 413);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ message: '无法读取投稿表，请刷新页面后重试。' }, 400);
  }

  if (form.get('website')) {
    return json({ message: 'Submission could not be processed.' }, 400);
  }

  const locale = form.get('locale') === 'de' ? 'de' : 'zh';
  const submission = {
    fullName: cleanString(form.get('fullName'), 80),
    email: cleanString(form.get('email'), 160).toLowerCase(),
    institution: cleanString(form.get('institution'), 160),
    careerStage: cleanString(form.get('careerStage'), 24),
    contributionTitle: cleanString(form.get('contributionTitle'), 240),
    researchArea: cleanString(form.get('researchArea'), 24),
    abstractText: cleanMultiline(form.get('abstractText'), 3000),
    keywords: cleanString(form.get('keywords'), 220),
    locale
  };

  const consent = form.get('consent') === 'true';
  const invalid =
    !submission.fullName ||
    !validateEmail(submission.email) ||
    !submission.institution ||
    !CAREER_STAGES.has(submission.careerStage) ||
    !submission.contributionTitle ||
    !RESEARCH_AREAS.has(submission.researchArea) ||
    !submission.abstractText ||
    countWords(submission.abstractText) > MAX_ABSTRACT_WORDS ||
    !submission.keywords ||
    !consent;

  if (invalid) {
    return json(
      {
        message: locale === 'de'
          ? 'Bitte prüfen Sie Titel, Fachgebiet, Abstract, Schlüsselwörter und Pflichtfelder.'
          : '请检查题目、研究方向、摘要、关键词及其他必填项目。'
      },
      400
    );
  }

  const id = crypto.randomUUID();
  const submissionCode = `SCDSG26-A-${id.replaceAll('-', '').slice(0, 10).toUpperCase()}`;
  const createdAt = new Date().toISOString();

  try {
    await env.REGISTRATIONS_DB
      .prepare(
        `INSERT INTO abstract_submissions (
          id,
          submission_code,
          full_name,
          email,
          institution,
          career_stage,
          contribution_title,
          research_area,
          abstract_text,
          keywords,
          cv_object_key,
          cv_file_name,
          cv_size,
          figure_object_key,
          figure_file_name,
          figure_content_type,
          figure_size,
          locale,
          status,
          consented_at,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', 0, '', '', '', 0, ?, 'files_pending', ?, ?)`
      )
      .bind(
        id,
        submissionCode,
        submission.fullName,
        submission.email,
        submission.institution,
        submission.careerStage,
        submission.contributionTitle,
        submission.researchArea,
        submission.abstractText,
        submission.keywords,
        submission.locale,
        createdAt,
        createdAt
      )
      .run();
  } catch (error) {
    console.error({
      event: 'abstract_submission_failed',
      submissionCode,
      error: error instanceof Error ? error.message : String(error)
    });
    return json(
      {
        message: locale === 'de'
          ? 'Die Einreichung konnte nicht gespeichert werden. Bitte versuchen Sie es später erneut.'
          : '投稿暂时无法保存，请稍后重试。'
      },
      500
    );
  }

  console.log({
    event: 'abstract_submission_created',
    submissionCode,
    researchArea: submission.researchArea,
    filesStatus: 'pending'
  });

  return json({ submissionId: submissionCode, filesPending: true }, 201);
}

export function onRequestGet() {
  return json({ message: 'Method not allowed.' }, 405);
}
