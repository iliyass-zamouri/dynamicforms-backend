// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  // Default error
  let error = {
    success: false,
    message: 'Erreur interne du serveur',
    status: 500,
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error.message = 'Validation Error'
    error.status = 400
    error.errors = Object.values(err.errors).map((val) => val.message)
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    error.message = 'Duplicate field value entered'
    error.status = 400
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token'
    error.status = 401
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired'
    error.status = 401
  }

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    error.message = 'Duplicate entry'
    error.status = 409
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error.message = 'Referenced record not found'
    error.status = 400
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    error.message = 'Cannot delete record, it is referenced by other records'
    error.status = 400
  }

  // Custom error
  if (err.status) {
    error.status = err.status
    error.message = err.message
  }

  res.status(error.status).json({
    success: error.success,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

// 404 handler
export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`)
  error.status = 404
  next(error)
}
