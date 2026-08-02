import { createRemoteJWKSet, jwtVerify } from 'jose';

function jsonError(message, status) {
  return Response.json({ message }, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function allowedEmails(value) {
  return new Set(
    String(value || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function authenticateAdmin(request, env) {
  const teamDomain = String(env.TEAM_DOMAIN || '').replace(/\/+$/u, '');
  const audience = String(env.POLICY_AUD || '').trim();
  const allowlist = allowedEmails(env.ADMIN_ALLOWED_EMAILS);

  if (!teamDomain || !audience || !allowlist.size) {
    return {
      response: jsonError('管理后台尚未完成 Cloudflare Access 配置。', 503)
    };
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) {
    return { response: jsonError('需要管理员身份验证。', 403) };
  }

  try {
    const jwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(token, jwks, {
      issuer: teamDomain,
      audience
    });
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';

    if (!email || !allowlist.has(email)) {
      return { response: jsonError('当前账号没有投稿管理权限。', 403) };
    }

    return { email };
  } catch (error) {
    console.error({
      event: 'admin_access_denied',
      error: error instanceof Error ? error.message : String(error)
    });
    return { response: jsonError('管理员身份验证失败。', 403) };
  }
}

