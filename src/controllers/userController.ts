import asyncHandler from '../utils/asyncHandler';
import userService from '../services/userService';
import ApiError from '../utils/ApiError';
import httpStatus from '../constants/httpStatus';
import { sendSuccess } from '../utils/response';
const getMe = asyncHandler(async (req, res) => { const user = await userService.getUserById(req.user._id);
  if (!user) { throw new ApiError(httpStatus.NOT_FOUND, 'User not found'); }
  return sendSuccess(res, httpStatus.OK, 'Profile fetched', { id: user._id,
    email: user.email,
    isVerified: user.isVerified,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt }); });
const updateMe = asyncHandler(async (req, res) => { const user = await userService.updateProfile(req.user._id, req.body);
  return sendSuccess(res, httpStatus.OK, 'Profile updated', { id: user._id,
    email: user.email,
    isVerified: user.isVerified,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt }); });
const changePassword = asyncHandler(async (req, res) => { const result = await userService.changePassword(
    req.user._id,
    req.body.oldPassword,
    req.body.newPassword
  );
  if (result === null) { throw new ApiError(httpStatus.NOT_FOUND, 'User not found'); }
  if (result === false) { throw new ApiError(httpStatus.BAD_REQUEST, 'Old password is incorrect'); }
  return sendSuccess(res, httpStatus.OK, 'Password changed successfully'); });
const deleteMe = asyncHandler(async (req, res) => { await userService.deleteUser(req.user._id);
  return sendSuccess(res, httpStatus.OK, 'Account deleted successfully'); });
export { getMe, updateMe, changePassword, deleteMe };
export default { getMe, updateMe, changePassword, deleteMe };
