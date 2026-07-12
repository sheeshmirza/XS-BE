import jwt from 'jsonwebtoken';
import env from '../config/env';
import ApiError from '../utils/ApiError';
import httpStatus from '../constants/httpStatus';
import userService from '../services/userService';
const auth = async (req, _res, next) => { const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) { return next(new ApiError(httpStatus.UNAUTHORIZED, 'Missing or invalid Authorization header')); }
  const token = authHeader.split(' ')[1];
  try { const decoded = jwt.verify(token, env.jwtAccessSecret);
    const user = await userService.getUserById(decoded.sub);
    if (!user) { return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token user')); }
    req.user = user;
    req.auth = decoded;
    return next(); } catch (_error) { return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token')); } };
export default auth;
