const MAX_REQUEST_BYTES = 14 * 1024 * 1024;
const MAX_CV_BYTES = 5 * 1024 * 1024;
const MAX_FIGURE_BYTES = 8 * 1024 * 1024;
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

const FIGURE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

function safeFileName(name, fallback) {
  const cleaned = name
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 120);
  return cleaned || fallback;
}

async function hasPdfSignature(file) {
  const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return bytes.length === 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d;
}

async function hasValidImageSignature(file) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  if (file.type === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (file.type === 'image/png') {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return png.every((value, index) => bytes[index] === value);
  }

  if (file.type === 'image/webp') {
    return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  }

  return false;
}

function extensionFor(contentType) {
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  return 'bin';
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
    return json({ message: '无法确认上传大小，请刷新页面后重试。' }, 411);
  }

  if (contentLength > MAX_REQUEST_BYTES) {
    return json({ message: '上传内容超过允许大小。' }, 413);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ message: '无法读取投稿表，请检查文件后重试。' }, 400);
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

  const cvFile = form.get('cvFile');
  const figureValue = form.get('figureFile');
  const figureFile = figureValue instanceof File && figureValue.size > 0 ? figureValue : null;
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

  if (!(cvFile instanceof File) ||
      cvFile.type !== 'application/pdf' ||
      cvFile.size === 0 ||
      cvFile.size > MAX_CV_BYTES ||
      !(await hasPdfSignature(cvFile))) {
    return json(
      {
        message: locale === 'de'
          ? 'Der Lebenslauf muss eine gültige PDF-Datei bis 5 MB sein.'
          : '个人简历须为有效的 PDF 文件，且不超过 5 MB。'
      },
      400
    );
  }

  if (figureFile &&
      (!FIGURE_TYPES.has(figureFile.type) ||
       figureFile.size > MAX_FIGURE_BYTES ||
       !(await hasValidImageSignature(figureFile)))) {
    return json(
      {
        message: locale === 'de'
          ? 'Die Abbildung muss eine gültige JPG-, PNG- oder WebP-Datei bis 8 MB sein.'
          : '研究图片须为有效的 JPG、PNG 或 WebP 文件，且不超过 8 MB。'
      },
      400
    );
  }

  const id = crypto.randomUUID();
  const submissionCode = `SCDSG26-A-${id.replaceAll('-', '').slice(0, 10).toUpperCase()}`;
  const createdAt = new Date().toISOString();
  const objectPrefix = `submissions/${id}`;
  const cvKey = `${objectPrefix}/cv.pdf`;
  const figureKey = figureFile
    ? `${objectPrefix}/figure.${extensionFor(figureFile.type)}`
    : '';
  const uploadedKeys = [];

  try {
    await env.SUBMISSION_FILES.put(cvKey, cvFile.stream(), {
      httpMetadata: {
        contentType: 'application/pdf',
        contentDisposition: 'attachment; filename="cv.pdf"'
      },
      customMetadata: {
        submissionCode,
        kind: 'cv'
      }
    });
    uploadedKeys.push(cvKey);

    if (figureFile) {
      await env.SUBMISSION_FILES.put(figureKey, figureFile.stream(), {
        httpMetadata: {
          contentType: figureFile.type,
          contentDisposition: `attachment; filename="figure.${extensionFor(figureFile.type)}"`
        },
        customMetadata: {
          submissionCode,
          kind: 'figure'
        }
      });
      uploadedKeys.push(figureKey);
    }

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
          consented_at,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        cvKey,
        safeFileName(cvFile.name, 'cv.pdf'),
        cvFile.size,
        figureKey,
        figureFile ? safeFileName(figureFile.name, `figure.${extensionFor(figureFile.type)}`) : '',
        figureFile?.type || '',
        figureFile?.size || 0,
        submission.locale,
        createdAt,
        createdAt
      )
      .run();
  } catch (error) {
    if (uploadedKeys.length > 0) {
      try {
        await env.SUBMISSION_FILES.delete(uploadedKeys);
      } catch (cleanupError) {
        console.error({
          event: 'abstract_submission_cleanup_failed',
          submissionCode,
          error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
        });
      }
    }

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
    hasFigure: Boolean(figureFile)
  });

  return json({ submissionId: submissionCode }, 201);
}

export function onRequestGet() {
  return json({ message: 'Method not allowed.' }, 405);
}
