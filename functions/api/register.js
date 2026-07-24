const MAX_BODY_BYTES = 20_000;

const CAREER_STAGES = new Set([
  'doctoral',
  'postdoc',
  'clinician',
  'pi',
  'industry',
  'other'
]);
const ATTENDANCE_MODES = new Set(['onsite', 'online', 'undecided']);
const ABSTRACT_INTEREST = new Set(['yes', 'no', 'undecided']);

const limits = {
  fullName: 80,
  email: 160,
  institution: 160,
  researchArea: 180,
  location: 120,
  notes: 1000
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
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(email);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');

  if (origin && origin !== url.origin) {
    return json({ message: 'Invalid request origin.' }, 403);
  }

  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    return json({ message: 'Expected a JSON request.' }, 415);
  }

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ message: 'Request is too large.' }, 413);
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return json({ message: 'Request is too large.' }, 413);
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return json({ message: 'Invalid JSON request.' }, 400);
  }

  if (payload.website) {
    return json({ message: 'Registration could not be processed.' }, 400);
  }

  const registration = {
    fullName: cleanString(payload.fullName, limits.fullName),
    email: cleanString(payload.email, limits.email).toLowerCase(),
    institution: cleanString(payload.institution, limits.institution),
    careerStage: cleanString(payload.careerStage, 24),
    attendanceMode: cleanString(payload.attendanceMode, 16),
    researchArea: cleanString(payload.researchArea, limits.researchArea),
    abstractInterest: cleanString(payload.abstractInterest, 16),
    location: cleanString(payload.location, limits.location),
    notes: cleanString(payload.notes, limits.notes),
    locale: payload.locale === 'de' ? 'de' : 'zh'
  };

  const invalid =
    !registration.fullName ||
    !validateEmail(registration.email) ||
    !registration.institution ||
    !CAREER_STAGES.has(registration.careerStage) ||
    !ATTENDANCE_MODES.has(registration.attendanceMode) ||
    !registration.researchArea ||
    !ABSTRACT_INTEREST.has(registration.abstractInterest) ||
    payload.consent !== true;

  if (invalid) {
    return json(
      {
        message: registration.locale === 'de'
          ? 'Bitte prüfen Sie die Pflichtfelder.'
          : '请检查必填项目后重新提交。'
      },
      400
    );
  }

  const id = crypto.randomUUID();
  const registrationCode = `SCDSG26-${id.replaceAll('-', '').slice(0, 12).toUpperCase()}`;
  const createdAt = new Date().toISOString();

  try {
    await env.REGISTRATIONS_DB
      .prepare(
        `INSERT INTO registrations (
          id,
          registration_code,
          full_name,
          email,
          institution,
          career_stage,
          attendance_mode,
          research_area,
          abstract_interest,
          location,
          notes,
          locale,
          consented_at,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        registrationCode,
        registration.fullName,
        registration.email,
        registration.institution,
        registration.careerStage,
        registration.attendanceMode,
        registration.researchArea,
        registration.abstractInterest,
        registration.location,
        registration.notes,
        registration.locale,
        createdAt,
        createdAt
      )
      .run();
  } catch (error) {
    if (String(error).includes('UNIQUE constraint failed: registrations.email')) {
      return json(
        {
          message: registration.locale === 'de'
            ? 'Diese E-Mail-Adresse wurde bereits registriert.'
            : '该邮箱已经提交过报名信息。'
        },
        409
      );
    }

    console.error({
      event: 'registration_insert_failed',
      error: error instanceof Error ? error.message : String(error)
    });
    return json(
      {
        message: registration.locale === 'de'
          ? 'Die Registrierung konnte nicht gespeichert werden. Bitte versuchen Sie es später erneut.'
          : '报名信息暂时无法保存，请稍后重试。'
      },
      500
    );
  }

  console.log({
    event: 'registration_created',
    registrationCode,
    attendanceMode: registration.attendanceMode,
    abstractInterest: registration.abstractInterest
  });

  return json({ registrationId: registrationCode }, 201);
}

export function onRequestGet() {
  return json({ message: 'Method not allowed.' }, 405);
}
