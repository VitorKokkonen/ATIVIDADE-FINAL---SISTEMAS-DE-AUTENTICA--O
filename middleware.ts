import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ISSUER = 'smart-gestor';
const AUDIENCE = 'smart-gestor-web';

const DEV_JWT_SECRET = 'dev-insecure-jwt-secret-change-me';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET ausente/fraco. Defina um valor forte (>= 32 chars).');
  }
  return secret && secret.length > 0 ? secret : DEV_JWT_SECRET;
}

async function verifyAccessToken(token: string) {
  const secretKey = new TextEncoder().encode(getJwtSecret());
  const { payload } = await jwtVerify(token, secretKey, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  if (payload.tokenType !== 'access') return null;
  const role = payload.role;
  if (role !== 'ADMIN' && role !== 'USER') return null;

  return { role } as const;
}

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get('accessToken')?.value;

  if (!accessToken) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    const auth = await verifyAccessToken(accessToken);
    if (!auth || auth.role !== 'ADMIN') {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
