const MIB = 1024 * 1024;
const MAX_REQUEST_BYTES = 32 * MIB;
const MAX_CV_BYTES = 10 * MIB;
const MAX_FIGURE_BYTES = 20 * MIB;
const MAX_ABSTRACT_WORDS = 300;
const CONSENT_VERSION = 'forum-2026-v2';
const CONFIRMATION_FROM = 'forum@scdsg-med.com';
const CONTACT_EMAIL = 'scdsg.heidelberg@gmail.com';

const CAREER_STAGES = new Set([
  'doctoral',
  'postdoc',
  'clinician',
  'pi',
  'industry',
  'other'
]);

const RESEARCH_AREAS = new Set([
  'molecular',
  'immunology',
  'clinical',
  'translational',
  'pharma',
  'bioinformatics',
  'other'
]);

const PRESENTATION_PREFERENCES = new Set([
  'oral',
  'poster',
  'either'
]);

const FIGURE_TYPES = {
  jpeg: {
    contentType: 'image/jpeg',
    extensions: new Set(['jpg', 'jpeg'])
  },
  png: {
    contentType: 'image/png',
    extensions: new Set(['png'])
  },
  webp: {
    contentType: 'image/webp',
    extensions: new Set(['webp'])
  }
};

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

function cleanFileName(value) {
  if (typeof value !== 'string') return '';
  const baseName = value.split(/[\\/]/u).at(-1) || '';
  return baseName.replace(/[\u0000-\u001f\u007f]/gu, '').trim().slice(0, 180);
}

function getExtension(fileName) {
  return fileName.includes('.') ? fileName.split('.').at(-1).toLowerCase() : '';
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(email);
}

function countWords(value) {
  return value.trim() ? value.trim().split(/\s+/u).length : 0;
}

function isUploadedFile(value) {
  return value &&
    typeof value === 'object' &&
    typeof value.name === 'string' &&
    typeof value.type === 'string' &&
    typeof value.size === 'number' &&
    typeof value.arrayBuffer === 'function';
}

function startsWith(bytes, signature) {
  return signature.every((byte, index) => bytes[index] === byte);
}

function detectFileType(buffer) {
  const bytes = new Uint8Array(buffer);

  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'pdf';
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) return 'webp';

  return '';
}

async function sha256(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function localizedMessage(locale, zh, de) {
  return locale === 'de' ? de : zh;
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

async function sendConfirmationEmail(env, submission, submissionCode) {
  if (!env.EMAIL) {
    console.error({ event: 'submission_confirmation_email_unavailable', submissionCode });
    return;
  }

  try {
    await env.EMAIL.send(confirmationEmail(
      submission.email,
      submissionCode,
      submission.locale
    ));
    console.log({ event: 'submission_confirmation_email_sent', submissionCode });
  } catch (error) {
    console.error({
      event: 'submission_confirmation_email_failed',
      submissionCode,
      errorCode: error && typeof error === 'object' && 'code' in error ? error.code : 'unknown'
    });
  }
}

async function prepareCv(file, locale) {
  if (!isUploadedFile(file) || !file.name || file.size <= 0) {
    throw new Error(localizedMessage(locale, '请上传 PDF 格式的个人简历。', 'Bitte laden Sie Ihren Lebenslauf als PDF hoch.'));
  }
  if (file.size > MAX_CV_BYTES) {
    throw new Error(localizedMessage(locale, '个人简历不能超过 10 MB。', 'Der Lebenslauf darf maximal 10 MB groß sein.'));
  }

  const originalFileName = cleanFileName(file.name);
  const extension = getExtension(originalFileName);
  const buffer = await file.arrayBuffer();

  if (
    extension !== 'pdf' ||
    file.type !== 'application/pdf' ||
    detectFileType(buffer) !== 'pdf'
  ) {
    throw new Error(localizedMessage(locale, '个人简历必须为有效的 PDF 文件。', 'Der Lebenslauf muss eine gültige PDF-Datei sein.'));
  }

  return {
    buffer,
    originalFileName,
    extension,
    contentType: 'application/pdf',
    size: file.size,
    checksum: await sha256(buffer)
  };
}

async function prepareFigure(file, locale) {
  if (!isUploadedFile(file) || !file.name || file.size <= 0) return null;
  if (file.size > MAX_FIGURE_BYTES) {
    throw new Error(localizedMessage(locale, '补充图表不能超过 20 MB。', 'Die ergänzende Abbildung darf maximal 20 MB groß sein.'));
  }

  const originalFileName = cleanFileName(file.name);
  const extension = getExtension(originalFileName);
  const buffer = await file.arrayBuffer();
  const detectedType = detectFileType(buffer);
  const typeConfig = FIGURE_TYPES[detectedType];

  if (
    !typeConfig ||
    !typeConfig.extensions.has(extension) ||
    file.type !== typeConfig.contentType
  ) {
    throw new Error(localizedMessage(locale, '补充图表必须为有效的 JPG、PNG 或 WebP 文件。', 'Die ergänzende Abbildung muss eine gültige JPG-, PNG- oder WebP-Datei sein.'));
  }

  return {
    buffer,
    originalFileName,
    extension,
    contentType: typeConfig.contentType,
    size: file.size,
    checksum: await sha256(buffer)
  };
}

async function removeObjects(bucket, keys) {
  const validKeys = keys.filter(Boolean);
  if (!validKeys.length) return;

  try {
    await bucket.delete(validKeys);
  } catch {
    console.error({ event: 'submission_file_cleanup_failed', objectCount: validKeys.length });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');

  if (origin && origin !== url.origin) {
    return json({ message: 'Invalid request origin.' }, 403);
  }

  if (!env.REGISTRATIONS_DB || !env.SUBMISSION_FILES) {
    return json({ message: '投稿服务暂未完成配置，请稍后重试。' }, 503);
  }

  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('multipart/form-data')) {
    return json({ message: 'Expected multipart form data.' }, 415);
  }

  const contentLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
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
    presentationPreference: cleanString(form.get('presentationPreference'), 16),
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
    !PRESENTATION_PREFERENCES.has(submission.presentationPreference) ||
    !submission.abstractText ||
    countWords(submission.abstractText) > MAX_ABSTRACT_WORDS ||
    !submission.keywords ||
    !consent;

  if (invalid) {
    return json(
      {
        message: localizedMessage(
          locale,
          '请检查题目、研究方向、摘要、关键词及其他必填项目。',
          'Bitte prüfen Sie Titel, Fachgebiet, Abstract, Schlüsselwörter und Pflichtfelder.'
        )
      },
      400
    );
  }

  let cv;
  let figure;
  try {
    cv = await prepareCv(form.get('cvFile'), locale);
    figure = await prepareFigure(form.get('figureFile'), locale);
  } catch (error) {
    return json({ message: error instanceof Error ? error.message : '文件校验失败。' }, 400);
  }

  const id = crypto.randomUUID();
  const submissionCode = `SCDSG26-A-${id.replaceAll('-', '').slice(0, 10).toUpperCase()}`;
  const createdAt = new Date().toISOString();
  const objectPrefix = `private/forum/2026/${crypto.randomUUID()}`;
  const cvObjectKey = `${objectPrefix}/cv.pdf`;
  const figureObjectKey = figure ? `${objectPrefix}/figure.${figure.extension}` : '';
  const uploadedKeys = [];

  try {
    await env.SUBMISSION_FILES.put(cvObjectKey, cv.buffer, {
      httpMetadata: { contentType: cv.contentType },
      customMetadata: { submissionId: id, purpose: 'cv' }
    });
    uploadedKeys.push(cvObjectKey);

    if (figure) {
      await env.SUBMISSION_FILES.put(figureObjectKey, figure.buffer, {
        httpMetadata: { contentType: figure.contentType },
        customMetadata: { submissionId: id, purpose: 'figure' }
      });
      uploadedKeys.push(figureObjectKey);
    }

    const statements = [
      env.REGISTRATIONS_DB.prepare(
        `INSERT INTO abstract_submissions (
          id,
          submission_code,
          full_name,
          email,
          institution,
          career_stage,
          contribution_title,
          research_area,
          presentation_preference,
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
          consent_version,
          consented_at,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?)`
      ).bind(
        id,
        submissionCode,
        submission.fullName,
        submission.email,
        submission.institution,
        submission.careerStage,
        submission.contributionTitle,
        submission.researchArea,
        submission.presentationPreference,
        submission.abstractText,
        submission.keywords,
        cvObjectKey,
        cv.originalFileName,
        cv.size,
        figureObjectKey,
        figure?.originalFileName || '',
        figure?.contentType || '',
        figure?.size || 0,
        submission.locale,
        CONSENT_VERSION,
        createdAt,
        createdAt
      ),
      env.REGISTRATIONS_DB.prepare(
        `INSERT INTO submission_files (
          id,
          submission_id,
          object_key,
          original_file_name,
          mime_type,
          file_extension,
          size_bytes,
          checksum_sha256,
          purpose,
          review_status,
          uploaded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'cv', 'pending_review', ?)`
      ).bind(
        crypto.randomUUID(),
        id,
        cvObjectKey,
        cv.originalFileName,
        cv.contentType,
        cv.extension,
        cv.size,
        cv.checksum,
        createdAt
      )
    ];

    if (figure) {
      statements.push(
        env.REGISTRATIONS_DB.prepare(
          `INSERT INTO submission_files (
            id,
            submission_id,
            object_key,
            original_file_name,
            mime_type,
            file_extension,
            size_bytes,
            checksum_sha256,
            purpose,
            review_status,
            uploaded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'figure', 'pending_review', ?)`
        ).bind(
          crypto.randomUUID(),
          id,
          figureObjectKey,
          figure.originalFileName,
          figure.contentType,
          figure.extension,
          figure.size,
          figure.checksum,
          createdAt
        )
      );
    }

    await env.REGISTRATIONS_DB.batch(statements);
  } catch (error) {
    await removeObjects(env.SUBMISSION_FILES, uploadedKeys);
    console.error({
      event: 'abstract_submission_failed',
      submissionCode,
      error: error instanceof Error ? error.message : String(error)
    });
    return json(
      {
        message: localizedMessage(
          locale,
          '投稿暂时无法保存，请稍后重试。',
          'Die Einreichung konnte nicht gespeichert werden. Bitte versuchen Sie es später erneut.'
        )
      },
      500
    );
  }

  console.log({
    event: 'abstract_submission_created',
    submissionCode,
    researchArea: submission.researchArea,
    fileCount: uploadedKeys.length
  });

  const emailTask = sendConfirmationEmail(env, submission, submissionCode);
  if (typeof context.waitUntil === 'function') context.waitUntil(emailTask);
  else await emailTask;

  return json({ submissionId: submissionCode }, 201);
}

export function onRequestGet() {
  return json({ message: 'Method not allowed.' }, 405);
}
