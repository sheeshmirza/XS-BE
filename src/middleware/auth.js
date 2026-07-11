const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const httpStatus = require('../constants/httpStatus');
const userService = require('../services/userService');

const auth = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Missing or invalid Authorization header'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret);
    const user = await userService.getUserById(decoded.sub);

    if (!user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token user'));
    }

    req.user = user;
    req.auth = decoded;
    return next();
  } catch (_error) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token'));
  }
};

module.exports = auth;
