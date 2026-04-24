import crypto from 'crypto';
import 'dotenv/config';
import jwt from 'jsonwebtoken';

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('ACCESS_TOKEN_SECRET/REFRESH_TOKEN_SECRET (or JWT_SECRET) must be configured');
}

const roleAliases = {
  seeker: 'seeker',
  jobseeker: 'seeker',
  recruiter: 'recruiter'
};

const prefixByRole = {
  seeker: 'jobseeker',
  recruiter: 'recruiter'
};

export const normalizeRole = (inputRole) => roleAliases[String(inputRole || '').toLowerCase()] || null;

export const getCookiePrefixByRole = (role) => {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return null;
  return prefixByRole[normalizedRole];
};

export const getCookieNamesByRole = (role) => {
  const prefix = getCookiePrefixByRole(role);
  if (!prefix) return null;
  return {
    access: `${prefix}_access_token`,
    refresh: `${prefix}_refresh_token`,
    csrf: `${prefix}_csrf_token`
  };
};

export const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnlyTokenCookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/'
    },
    csrfCookie: {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/'
    }
  };
};

export const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

export const generateAccessToken = ({ userId, role }) => jwt.sign(
  { userId, role, type: 'access' },
  ACCESS_SECRET,
  { expiresIn: ACCESS_TTL_SECONDS }
);

export const generateRefreshToken = ({ userId, role, tokenId }) => jwt.sign(
  { userId, role, type: 'refresh', tokenId },
  REFRESH_SECRET,
  { expiresIn: REFRESH_TTL_SECONDS }
);

export const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);

export const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

export const hashRefreshToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const buildRefreshTokenRecord = (token) => ({
  tokenHash: hashRefreshToken(token),
  expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
  createdAt: new Date()
});

export const tokenExpToDate = (exp) => new Date(exp * 1000);

export const getAccessTokenMaxAgeMs = () => ACCESS_TTL_SECONDS * 1000;

export const getRefreshTokenMaxAgeMs = () => REFRESH_TTL_SECONDS * 1000;
