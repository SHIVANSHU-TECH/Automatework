import { type NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://automatework-tmfr.onrender.com';

/**
 * GET /s/[code]
 * Proxies the short-link redirect through the web domain.
 * Calls the API /s/:code endpoint which returns a 302 or HTML status page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } },
) {
  const { code } = params;
  const password = request.nextUrl.searchParams.get('p');

  const apiUrl = `${API_BASE}/s/${encodeURIComponent(code)}${password ? `?p=${encodeURIComponent(password)}` : ''}`;

  try {
    const res = await fetch(apiUrl, {
      redirect: 'manual',
      headers: {
        'User-Agent':      request.headers.get('user-agent') ?? '',
        'CF-IPCountry':    request.headers.get('cf-ipcountry') ?? '',
        'Referer':         request.headers.get('referer') ?? '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') ?? '',
      },
    });

    // Password / expired / not-found HTML from API — pass through
    if (res.status === 401 || res.status === 410 || res.status === 404) {
      const html = await res.text();
      if (html.includes('<html') || html.includes('<!DOCTYPE')) {
        return new NextResponse(html, {
          status: res.status,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      if (res.status === 404) {
        return NextResponse.redirect(new URL('/?error=link_not_found', request.url));
      }
    }

    // Successful redirect — resolve relative Location against the API origin
    const location = res.headers.get('location');
    if (location) {
      const absolute = location.startsWith('http')
        ? location
        : new URL(location, API_BASE).toString();
      return NextResponse.redirect(absolute, 302);
    }

    return NextResponse.redirect(new URL('/', request.url));
  } catch {
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Temporarily Unavailable</title>
      <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc}
      .box{text-align:center;max-width:360px;padding:24px}h2{color:#1e293b}p{color:#64748b;font-size:14px}</style></head>
      <body><div class="box"><h2>Temporarily Unavailable</h2><p>Please try again in a moment.</p></div></body></html>`;
    return new NextResponse(html, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}
