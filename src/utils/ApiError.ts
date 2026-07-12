class ApiError extends Error {
  statusCode: any;
  details: any;
  isOperational: any;
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
export default ApiError;
