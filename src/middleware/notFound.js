const ApiError = require('../utils/ApiError');
const httpStatus = require('../constants/httpStatus');

const notFound = (req, _res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, `Route not found: ${req.originalUrl}`));
};

module.exports = notFound;
