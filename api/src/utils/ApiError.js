// Lets controllers throw a single error type that already knows its own
// HTTP status code, instead of every route reimplementing status/message logic.
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static notFound(message = "Not found") {
    return new ApiError(404, message);
  }

  static conflict(message = "Conflict", details) {
    return new ApiError(409, message, details);
  }
}

module.exports = ApiError;
