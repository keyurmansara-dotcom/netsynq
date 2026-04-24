import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendResetPasswordEmail } from '../services/mailService.js';
import {
    buildRefreshTokenRecord,
    generateAccessToken,
    generateCsrfToken,
    generateRefreshToken,
    getAccessTokenMaxAgeMs,
    getCookieNamesByRole,
    getCookieOptions,
    getRefreshTokenMaxAgeMs,
    hashRefreshToken,
    normalizeRole,
    verifyRefreshToken
} from '../services/tokenService.js';

const clearAuthCookies = (res, role) => {
  const cookieNames = getCookieNamesByRole(role);
  if (!cookieNames) return;

  const cookieOptions = getCookieOptions();
  res.clearCookie(cookieNames.access, cookieOptions.httpOnlyTokenCookie);
  res.clearCookie(cookieNames.refresh, cookieOptions.httpOnlyTokenCookie);
  res.clearCookie(cookieNames.csrf, cookieOptions.csrfCookie);
};

const clearAllAuthCookies = (res) => {
  clearAuthCookies(res, 'seeker');
  clearAuthCookies(res, 'recruiter');
};

const setAuthCookies = (res, role, accessToken, refreshToken, csrfToken) => {
  const cookieNames = getCookieNamesByRole(role);
  const cookieOptions = getCookieOptions();

  res.cookie(cookieNames.access, accessToken, {
    ...cookieOptions.httpOnlyTokenCookie,
    maxAge: getAccessTokenMaxAgeMs()
  });
  res.cookie(cookieNames.refresh, refreshToken, {
    ...cookieOptions.httpOnlyTokenCookie,
    maxAge: getRefreshTokenMaxAgeMs()
  });
  res.cookie(cookieNames.csrf, csrfToken, {
    ...cookieOptions.csrfCookie,
    maxAge: getRefreshTokenMaxAgeMs()
  });
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profile: user.profile || {},
  skills: user.skills || [],
  experience: user.experience || [],
  education: user.education || [],
  projects: user.projects || [],
  links: user.links || {},
  privacy: user.privacy || {},
  openToWork: user.openToWork || false
});

const bcryptHashPattern = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const verifyPasswordWithLegacySupport = async (user, plainPassword) => {
  const storedPassword = user?.password;

  if (!storedPassword || typeof storedPassword !== 'string') {
    return false;
  }

  // Handle expected bcrypt hashes first.
  if (bcryptHashPattern.test(storedPassword)) {
    try {
      return await bcrypt.compare(plainPassword, storedPassword);
    } catch {
      return false;
    }
  }

  // Dev fallback: migrate old plaintext seeded passwords to bcrypt on successful login.
  if (process.env.NODE_ENV !== 'production' && plainPassword === storedPassword) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(plainPassword, salt);
    await user.save();
    return true;
  }

  return false;
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, role, companyName, headline } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create profile defaults based on role
    const profile = {
      headline: role === 'seeker' ? headline : '',
      companyName: role === 'recruiter' ? companyName : '',
      location: '',
      resumeUrl: '',
      summary: ''
    };

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      profile,
      skills: [],
      experience: [],
      education: [],
      projects: [],
      links: {},
      privacy: {},
      openToWork: false
    });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user
    const user = await User.findOne({ email });
    if (!user) {
       return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await verifyPasswordWithLegacySupport(user, password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile || {},
        skills: user.skills || [],
        experience: user.experience || [],
        education: user.education || [],
        projects: user.projects || [],
        links: user.links || {},
        privacy: user.privacy || {},
        openToWork: user.openToWork || false
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const loginByRole = async (req, res) => {
  try {
    const routeRole = normalizeRole(req.params.role);
    const { email, password } = req.body;

    if (!routeRole) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (normalizeRole(user.role) !== routeRole) {
      return res.status(403).json({ message: 'Account role does not match selected login role' });
    }

    const isMatch = await verifyPasswordWithLegacySupport(user, password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken({ userId: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id, role: user.role, tokenId: crypto.randomUUID() });
    const csrfToken = generateCsrfToken();

    clearAllAuthCookies(res);
    user.refreshTokens = [
      ...(user.refreshTokens || []),
      buildRefreshTokenRecord(refreshToken)
    ];
    await user.save();

    setAuthCookies(res, user.role, accessToken, refreshToken, csrfToken);

    return res.status(200).json({
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Role Login Error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

export const refreshByRole = async (req, res) => {
  try {
    const routeRole = normalizeRole(req.params.role);
    if (!routeRole) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    const cookieNames = getCookieNamesByRole(routeRole);
    const refreshToken = req.cookies?.[cookieNames.refresh];

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token found' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (normalizeRole(decoded.role) !== routeRole || decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token role/type' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const tokenRecord = (user.refreshTokens || []).find((item) => item.tokenHash === tokenHash);
    if (!tokenRecord || (tokenRecord.expiresAt && new Date(tokenRecord.expiresAt) < new Date())) {
      return res.status(401).json({ message: 'Refresh token expired or revoked' });
    }

    const accessToken = generateAccessToken({ userId: user._id, role: user.role });
    const csrfToken = req.cookies?.[cookieNames.csrf] || generateCsrfToken();
    setAuthCookies(res, user.role, accessToken, refreshToken, csrfToken);

    return res.status(200).json({
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Role Refresh Error:', error);
    return res.status(401).json({ message: 'Unable to refresh session' });
  }
};

export const logoutByRole = async (req, res) => {
  try {
    const routeRole = normalizeRole(req.params.role);
    if (!routeRole) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    const cookieNames = getCookieNamesByRole(routeRole);
    const refreshToken = req.cookies?.[cookieNames.refresh];

    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        const user = await User.findById(decoded.userId);
        if (user) {
          const tokenHash = hashRefreshToken(refreshToken);
          user.refreshTokens = (user.refreshTokens || []).filter((item) => item.tokenHash !== tokenHash);
          await user.save();
        }
      } catch {
        // Clear cookies below even if the token cannot be verified.
      }
    }

    clearAuthCookies(res, routeRole);
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Role Logout Error:', error);
    return res.status(500).json({ message: 'Server error during logout' });
  }
};

export const getAuthenticatedJobseekerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -refreshTokens -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (normalizeRole(user.role) !== 'seeker') {
      return res.status(403).json({ message: 'Not authorized as job seeker' });
    }

    return res.status(200).json(sanitizeUser(user));
  } catch (error) {
    console.error('Jobseeker Profile Error:', error);
    return res.status(500).json({ message: 'Server error while loading profile' });
  }
};

export const getAuthenticatedRecruiterDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -refreshTokens -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (normalizeRole(user.role) !== 'recruiter') {
      return res.status(403).json({ message: 'Not authorized as recruiter' });
    }

    return res.status(200).json(sanitizeUser(user));
  } catch (error) {
    console.error('Recruiter Dashboard Error:', error);
    return res.status(500).json({ message: 'Server error while loading dashboard' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    // Return a generic response so the endpoint does not reveal whether an account exists.
    const genericResponse = {
      message: 'If an account exists with this email, a reset link has been sent.'
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientBaseUrl}/reset-password?token=${resetToken}`;

    try {
      const mailResult = await sendResetPasswordEmail(user.email, resetUrl);

      if (!mailResult?.delivered) {
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save({ validateBeforeSave: false });
        return res.status(503).json({
          message: 'Password reset email is not configured on the server. Please set SMTP_USER and SMTP_PASS. Optional: MAIL_FROM and CLIENT_URL.'
        });
      }

      return res.status(200).json(genericResponse);
    } catch (mailError) {
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save({ validateBeforeSave: false });
      console.error('Forgot Password Mail Error:', mailError);
      return res.status(500).json({ message: 'Unable to send reset email' });
    }
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Server error during forgot password' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};