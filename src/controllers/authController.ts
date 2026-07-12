import asyncHandler from '../utils/asyncHandler';
import authService from '../services/authService';
import httpStatus from '../constants/httpStatus';
import { sendSuccess } from '../utils/response';
const signup = asyncHandler(async (req, res) => { const user = await authService.signup(req.body);
  return sendSuccess(res, httpStatus.CREATED, 'Signup successful. Verify your email.', { id: user._id,
    email: user.email,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt }); });
const verifyEmail = asyncHandler(async (req, res) => { await authService.verifyEmail(req.body.token);
  return sendSuccess(res, httpStatus.OK, 'Email verified successfully'); });
const login = asyncHandler(async (req, res) => { const metadata = { userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || '' };
  const { user, accessToken, refreshToken } = await authService.login(req.body, metadata);
  return sendSuccess(res, httpStatus.OK, 'Login successful', { user: { id: user._id,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt },
    tokens: { accessToken, refreshToken } }); });
const refresh = asyncHandler(async (req, res) => { const metadata = { userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || '' };
  const result = await authService.refresh(req.body.refreshToken, metadata);
  return sendSuccess(res, httpStatus.OK, 'Token refreshed', { user: { id: result.user._id,
      email: result.user.email,
      isVerified: result.user.isVerified },
    tokens: { accessToken: result.accessToken,
      refreshToken: result.refreshToken } }); });
const logout = asyncHandler(async (req, res) => { await authService.logout(req.body.refreshToken, req.user?._id);
  return sendSuccess(res, httpStatus.OK, 'Logout successful'); });
const forgotPassword = asyncHandler(async (req, res) => { await authService.forgotPassword(req.body.email);
  return sendSuccess(res, httpStatus.OK, 'If the email exists, reset instructions were sent'); });
const resetPassword = asyncHandler(async (req, res) => { await authService.resetPassword(req.body.token, req.body.newPassword);
  return sendSuccess(res, httpStatus.OK, 'Password reset successful'); });
export { signup, verifyEmail, login, refresh, logout, forgotPassword, resetPassword };
