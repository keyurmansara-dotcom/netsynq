import { getCookieNamesByRole, normalizeRole } from '../services/tokenService.js';

export const validateCsrfByRole = (requestedRole) => (req, res, next) => {
  const normalizedRole = normalizeRole(requestedRole);
  const cookieNames = getCookieNamesByRole(normalizedRole);

  if (!cookieNames) {
    return res.status(400).json({ message: 'Invalid role for CSRF validation' });
  }

  const csrfFromCookie = req.cookies?.[cookieNames.csrf];
  const csrfFromHeader = req.get('x-csrf-token');

  if (!csrfFromCookie || !csrfFromHeader || csrfFromCookie !== csrfFromHeader) {
    return res.status(403).json({ message: 'CSRF token validation failed' });
  }

  return next();
};

export const validateCsrfFromRouteRole = (req, res, next) => {
  const role = normalizeRole(req.params.role);
  if (!role) {
    return res.status(400).json({ message: 'Invalid role route for CSRF validation' });
  }
  return validateCsrfByRole(role)(req, res, next);
};
