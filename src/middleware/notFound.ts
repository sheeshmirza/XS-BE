import ApiError from '../utils/ApiError';
import httpStatus from '../constants/httpStatus';
const notFound = (req, _res, next) => { next(new ApiError(httpStatus.NOT_FOUND, `Route not found: ${req.originalUrl}`)); };
export default notFound;
