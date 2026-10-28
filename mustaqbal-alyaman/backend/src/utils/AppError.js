/**
 * AppError - Custom Error class for operational errors
 * Usage: throw new AppError('رسالة الخطأ', 404)
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
