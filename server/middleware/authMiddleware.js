import jwt from 'jsonwebtoken';
import {
  getCookieNamesByRole,
  normalizeRole,
  verifyAccessToken
} from '../services/tokenService.js';

const legacyJwtSecret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;

const parseBearerToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

const attachUserFromPayload = (req, payload, source) => {
  req.user = {
    userId: payload.userId,
    role: normalizeRole(payload.role) || payload.role
  };
  req.authSource = source;
};

const authByRoleCookie = (requiredRole) => {
  const normalizedRole = normalizeRole(requiredRole);
  const cookieNames = getCookieNamesByRole(normalizedRole);

  return (req, res, next) => {
    const accessToken = req.cookies?.[cookieNames.access];
    if (!accessToken) {
      return res.status(401).json({ message: 'Not authorized, no access token cookie' });
    }

    try {
      const decoded = verifyAccessToken(accessToken);
      if (normalizeRole(decoded.role) !== normalizedRole || decoded.type !== 'access') {
        return res.status(401).json({ message: 'Invalid access token role/type' });
      }
      attachUserFromPayload(req, decoded, 'cookie');
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, access token invalid or expired' });
    }
  };
};

export const authenticateJobseeker = authByRoleCookie('seeker');

export const authenticateRecruiter = authByRoleCookie('recruiter');

export const protect = (req, res, next) => {
  const jobseekerCookie = getCookieNamesByRole('seeker');
  const recruiterCookie = getCookieNamesByRole('recruiter');

  const roleCookies = [
    { role: 'seeker', accessCookieName: jobseekerCookie.access },
    { role: 'recruiter', accessCookieName: recruiterCookie.access }
  ];

  for (const roleCookie of roleCookies) {
    const token = req.cookies?.[roleCookie.accessCookieName];
    if (!token) continue;
    try {
      const decoded = verifyAccessToken(token);
      if (normalizeRole(decoded.role) !== roleCookie.role || decoded.type !== 'access') {
        continue;
      }
      attachUserFromPayload(req, decoded, 'cookie');
      return next();
    } catch (error) {
      // Try other cookies or bearer fallback.
    }
  }

  const bearerToken = parseBearerToken(req);
  if (bearerToken) {
    try {
      const decoded = jwt.verify(bearerToken, legacyJwtSecret);
      attachUserFromPayload(req, decoded, 'bearer');
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, bearer token failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token found' });
};

export const recruiterOnly = (req, res, next) => {
  if (req.user && normalizeRole(req.user.role) === 'recruiter') {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized as recruiter' });
};