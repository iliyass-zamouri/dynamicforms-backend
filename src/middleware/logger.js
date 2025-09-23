import logger from '../utils/logger.js'

/**
 * Express middleware for logging HTTP requests
 * Logs request details including method, URL, status code, response time, etc.
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now()

  // Override res.end to capture response time
  const originalEnd = res.end
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime
    
    // Log the request
    logger.logRequest(req, res, responseTime)
    
    // Call original end method
    originalEnd.call(this, chunk, encoding)
  }

  next()
}

/**
 * Express middleware for logging errors
 * Should be used after error handling middleware
 */
export const errorLogger = (err, req, res, next) => {
  logger.logError(err, {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || null,
    body: req.method !== 'GET' ? req.body : undefined
  })

  next(err)
}

export default { requestLogger, errorLogger }
