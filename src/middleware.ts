import { NextRequest, NextResponse } from 'next/server';
import { isLocale, DEFAULT_LOCALE, LANGUAGE_COOKIE } from '@/lib/i18n';

// Static asset prefixes that must never get a locale prefix
const BYPASS_PREFIXES = [
  '/api',
  '/_next',
  '/uploads',
  '/hero-frames',
  '/favicon',
  '/logo',
  '/icons',
  '/robots.txt',
  '/sitemap.xml',
  '/apple-icon',
  '/admin',
];

// If a locale-prefixed request targets a static asset, rewrite it back.
// e.g. /az/hero-frames/frame-0001.webp → /hero-frames/frame-0001.webp
const STATIC_ASSET_PREFIXES = ['/hero-frames', '/uploads', '/icons', '/logo'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip accidental locale prefix from static assets
  for (const asset of STATIC_ASSET_PREFIXES) {
    const localeAssetRe = /^\/(az|en|ru)(\/.*)/;
    const match = pathname.match(localeAssetRe);
    if (match && match[2].startsWith(asset)) {
      const url = request.nextUrl.clone();
      url.pathname = match[2];
      return NextResponse.rewrite(url);
    }
  }

  // Bypass static asset roots directly
  if (BYPASS_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const segments = pathname.split('/');
  const maybeLocale = segments[1];

  if (isLocale(maybeLocale)) {
    // Guard /{locale}/success — only reachable right after a payment redirect.
    // The backend GET /payments/callback sets br_paid; we consume it here.
    if (segments[2] === 'success') {
      const paid = request.cookies.get('br_paid')?.value;
      if (paid !== '1') {
        const url = request.nextUrl.clone();
        url.pathname = `/${maybeLocale}`;
        return NextResponse.redirect(url, 307);
      }
      const response = NextResponse.next();
      response.cookies.set(LANGUAGE_COOKIE, maybeLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
        httpOnly: false,
      });
      response.cookies.set('br_paid', '', { path: '/', maxAge: 0 });
      return response;
    }

    const response = NextResponse.next();
    response.cookies.set(LANGUAGE_COOKIE, maybeLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      httpOnly: false,
    });
    return response;
  }

  // No locale prefix — detect then redirect
  const cookieLocale = request.cookies.get(LANGUAGE_COOKIE)?.value;
  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : detectFromAcceptLanguage(request.headers.get('accept-language'));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url, 308);
}

function detectFromAcceptLanguage(header: string | null): string {
  if (!header) return DEFAULT_LOCALE;
  const preferred = header.split(',')[0].split('-')[0].trim().toLowerCase();
  return isLocale(preferred) ? preferred : DEFAULT_LOCALE;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|apple-icon.png).*)'],
};
