import { type NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://automatework-tmfr.onrender.com';

/**
 * GET /s/[code]
 * Proxies the short-link redirect through the web domain.
 * The API handles click tracking and returns a 302 to the original URL.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } },
) {
  const { code } = params;
  const password = request.nextUrl.searchParams.get('p');

  const apiUrl = `${API_BASE}/s/${encodeURIComponent(code)}${password ? `?p=${encodeURIComponent(password)}` : ''}`;

  try {
    // Follow the redirect from the API and get the final destination
    const res = await fetch(apiUrl, {
      redirect: 'manual',
      headers: {
        'User-Agent':      request.headers.get('user-agent') ?? '',
        'CF-IPCountry':    request.headers.get('cf-ipcountry') ?? '',
        'Referer':         request.headers.get('referer') ?? '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') ?? '',
      },
    });

    // Password-protected — return HTML form
    if (res.status === 401) {
      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Protected Link</title>
        <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;margin:0}
        .box{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;max-width:360px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
        h2{margin:0 0 8px;font-size:18px;color:#1e293b}p{color:#64748b;font-size:14px;margin:0 0 20px}
        input{width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;box-sizing:border-box;margin-bottom:12px}
        button{width:100%;padding:10px;background:#2563eb;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer}</style>
        </head><body><div class="box"><h2>Protected Link</h2><p>This link is password-protected.</p>
        <form method="get"><input name="p" type="password" placeholder="Enter password" autofocus/><button type="submit">Open Link</button></form></div></body></html>`;
      return new NextResponse(html, { status: 401, headers: { 'Content-Type': 'text/html' } });
    }

    // Expired
    if (res.status === 410) {
      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Link Expired</title>
        <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;margin:0}
        .box{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;max-width:360px;width:100%;text-align:center}
        h2{color:#dc2626}p{color:#64748b;font-size:14px}</style>
        </head><body><div class="box"><h2>Link Expired</h2><p>This short link has expired and is no longer available.</p></div></body></html>`;
      return new NextResponse(html, { status: 410, headers: { 'Content-Type': 'text/html' } });
    }

    // Not found
    if (res.status === 404) {
      return NextResponse.redirect(new URL('/?error=link_not_found', request.url));
    }

    // Successful redirect — forward the Location header
    const location = res.headers.get('location');
    if (location) {
      return NextResponse.redirect(location, 302);
    }

    return NextResponse.redirect(new URL('/', request.url));
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }
}
