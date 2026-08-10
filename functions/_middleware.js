const CANONICAL_HOST = "scdsg-med.com";
const REDIRECT_HOSTS = new Set([
  "www.scdsg-med.com",
  "scdsg-med-homepage.pages.dev",
]);

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (REDIRECT_HOSTS.has(url.hostname)) {
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    url.port = "";
    return Response.redirect(url, 301);
  }

  return context.next();
}
