import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const authHttp = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const roleToRoute = {
  seeker: 'jobseeker',
  jobseeker: 'jobseeker',
  recruiter: 'recruiter'
};

export const normalizeRoleForRoute = (role) => roleToRoute[String(role || '').toLowerCase()] || null;

const readCookie = (name) => {
  const cookiePair = document.cookie.split('; ').find((item) => item.startsWith(`${name}=`));
  if (!cookiePair) return null;
  return decodeURIComponent(cookiePair.split('=').slice(1).join('='));
};

export const getCsrfTokenForRole = (role) => {
  const roleRoute = normalizeRoleForRoute(role);
  if (!roleRoute) return null;
  return readCookie(`${roleRoute}_csrf_token`);
};

export const loginByRole = async ({ role, email, password }) => {
  const roleRoute = normalizeRoleForRoute(role);
  if (!roleRoute) {
    throw new Error('Invalid role selected');
  }

  return authHttp.post(`/api/auth/${roleRoute}/login`, { email, password });
};

export const refreshByRole = async (role) => {
  const roleRoute = normalizeRoleForRoute(role);
  if (!roleRoute) {
    throw new Error('Invalid role selected');
  }

  const csrfToken = getCsrfTokenForRole(roleRoute);
  return authHttp.post(
    `/api/auth/${roleRoute}/refresh`,
    {},
    { headers: { 'x-csrf-token': csrfToken || '' } }
  );
};

export const logoutByRole = async (role) => {
  const roleRoute = normalizeRoleForRoute(role);
  if (!roleRoute) {
    throw new Error('Invalid role selected');
  }

  const csrfToken = getCsrfTokenForRole(roleRoute);
  return authHttp.post(
    `/api/auth/${roleRoute}/logout`,
    {},
    { headers: { 'x-csrf-token': csrfToken || '' } }
  );
};

export const getJobseekerProfile = () => authHttp.get('/api/auth/jobseeker/profile');

export const getRecruiterDashboard = () => authHttp.get('/api/auth/recruiter/dashboard');
