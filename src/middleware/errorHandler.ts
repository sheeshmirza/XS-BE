import httpStatus from '../constants/httpStatus';
const errorHandler = (err, _req, res, _next) => { const statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal server error';
  if (statusCode >= 500) { console.error({ message, stack: err.stack, details: err.details }); }
  return res.status(statusCode).json({ success: false,
    message,
    details: err.details || null }); };
export default errorHandler;
