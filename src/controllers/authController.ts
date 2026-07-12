import httpStatus from "../constants/httpStatus";
import authService from "../services/authService";
import asyncHandler from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";

const sanitizeUser = (user) => ({
  id: user._id,
  isVerified: user.isVerified,
});

const signup = asyncHandler(async (req, res) => {
  const user = await authService.signup(req.body);
  return sendSuccess(
    res,
    httpStatus.CREATED,
    "Signup successful. Verify your email.",
    sanitizeUser(user),
  );
});

const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.body.token);
  return sendSuccess(res, httpStatus.OK, "Email verified successfully");
});

const login = asyncHandler(async (req, res) => {
  const metadata = {
    ipAddress: req.ip || "",
    userAgent: req.headers["user-agent"] || "",
  };
  const { user, accessToken, refreshToken } = await authService.login(
    req.body,
    metadata,
  );
  return sendSuccess(res, httpStatus.OK, "Login successful", {
    tokens: {
      accessToken,
      refreshToken,
    },
    user: sanitizeUser(user),
  });
});

const refresh = asyncHandler(async (req, res) => {
  const metadata = {
    ipAddress: req.ip || "",
    userAgent: req.headers["user-agent"] || "",
  };
  const result = await authService.refresh(req.body.refreshToken, metadata);
  return sendSuccess(res, httpStatus.OK, "Token refreshed", {
    tokens: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    user: sanitizeUser(result.user),
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken, req.user._id);
  return sendSuccess(res, httpStatus.OK, "Logout successful");
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  return sendSuccess(
    res,
    httpStatus.OK,
    "If the email exists, reset instructions were sent",
  );
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  return sendSuccess(res, httpStatus.OK, "Password reset successful");
});

export {
  signup,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};

export default {
  signup,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};
