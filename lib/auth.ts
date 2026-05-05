import crypto from 'crypto';
import jwt, { type JwtPayload } from 'jsonwebtoken';

export type Role = 'ADMIN' | 'USER';


const ISSUER = 'smart-gestor';
const AUDIENCE = 'smart-gestor-web';

const DEV_JWT_SECRET = 'dev-insecure-jwt-secret-change-me';
const DEV_REFRESH_SECRET = 'dev-insecure-refresh-secret-change-me';

function getSecret(name: 'JWT_SECRET' | 'REFRESH_SECRET', devFallback: string) {
  const value = process.env[name];
  if (value && value.length >= 32) return value;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} ausente/fraco. Defina um valor forte (>= 32 chars) no ambiente.`);
  }

  return value && value.length > 0 ? value : devFallback;
}

const JWT_SECRET = getSecret('JWT_SECRET', DEV_JWT_SECRET);
const REFRESH_SECRET = getSecret('REFRESH_SECRET', DEV_REFRESH_SECRET);

type AccessTokenJwtPayload = JwtPayload & {
  tokenType: 'access';
  role: Role;
};

type RefreshTokenJwtPayload = JwtPayload & {
  tokenType: 'refresh';
  jti: string;
};

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(input: { userId: string; role: Role }) {
  return jwt.sign(
    { tokenType: 'access', role: input.role },
    JWT_SECRET,
    {
      expiresIn: '15m',
      subject: input.userId,
      issuer: ISSUER,
      audience: AUDIENCE,
    }
  );
}

export function signRefreshToken(input: { userId: string; tokenId: string }) {
  return jwt.sign(
    { tokenType: 'refresh', jti: input.tokenId },
    REFRESH_SECRET,
    {
      expiresIn: '7d',
      subject: input.userId,
      issuer: ISSUER,
      audience: AUDIENCE,
    }
  );
}

export function verifyAccessToken(token: string): { userId: string; role: Role } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { issuer: ISSUER, audience: AUDIENCE });
    if (typeof decoded === 'string') return null;

    const payload = decoded as AccessTokenJwtPayload;
    if (payload.tokenType !== 'access') return null;
    if (payload.sub == null || payload.sub.length === 0) return null;
    if (payload.role !== 'ADMIN' && payload.role !== 'USER') return null;

    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string; tokenId: string } | null {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET, { issuer: ISSUER, audience: AUDIENCE });
    if (typeof decoded === 'string') return null;

    const payload = decoded as RefreshTokenJwtPayload;
    if (payload.tokenType !== 'refresh') return null;
    if (payload.sub == null || payload.sub.length === 0) return null;
    if (payload.jti == null || payload.jti.length === 0) return null;

    return { userId: payload.sub, tokenId: payload.jti };
  } catch {
    return null;
  }
}
