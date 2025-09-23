/**
 * Utility function to create standardized error responses with debugging information
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {string} message - Custom error message
 * @param {number} status - HTTP status code
 * @returns {Object} Formatted error response
 */
export const createErrorResponse = (error, req, message = 'Erreur interne du serveur', status = 500) => {
  const response = {
    success: false,
    message,
  }

  // Add development debugging information
  if (process.env.NODE_ENV === 'development') {
    response.debug = {
      stack: error.stack,
      name: error.name,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      timestamp: new Date().toISOString(),
      url: req.originalUrl,
      method: req.method,
      query: req.query,
      body: req.body,
      user: req.user ? { id: req.user.id, role: req.user.role } : null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }
  }

  return { response, status }
}

/**
 * Helper function to send error response with debugging info
 * @param {Object} res - Express response object
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {string} message - Custom error message
 * @param {number} status - HTTP status code
 */
export const sendErrorResponse = (res, error, req, message = 'Erreur interne du serveur', status = 500) => {
  const { response, status: responseStatus } = createErrorResponse(error, req, message, status)
  res.status(responseStatus).json(response)
}
