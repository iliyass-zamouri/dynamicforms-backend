import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get environment
const env = process.env.NODE_ENV || 'development'

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs', env)
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = ''
    if (Object.keys(meta).length > 0) {
      metaStr = ' ' + JSON.stringify(meta)
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`
  })
)

// Create transports array
const transports = []

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    level: env === 'production' ? 'info' : 'debug',
    format: consoleFormat
  })
)

// File transports for different log levels
const logLevels = ['error', 'warn', 'info', 'debug']

logLevels.forEach(level => {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, `${level}-%DATE%.log`),
      datePattern: 'YYYY-MM-DD',
      level: level,
      format: logFormat,
      maxSize: '20m',
      maxFiles: '14d', // Keep logs for 14 days
      zippedArchive: true
    })
  )
})

// Combined log file (all levels)
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  })
)

// Create logger instance
const logger = winston.createLogger({
  level: env === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports,
  exitOnError: false
})

// Add request logging method
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id || null
  }

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData)
  } else {
    logger.info('HTTP Request', logData)
  }
}

// Add error logging method
logger.logError = (error, context = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context
  })
}

// Add database operation logging method
logger.logDatabase = (operation, table, data = {}) => {
  logger.debug('Database Operation', {
    operation,
    table,
    ...data
  })
}

// Add authentication logging method
logger.logAuth = (action, userId, success, details = {}) => {
  const level = success ? 'info' : 'warn'
  logger[level]('Authentication Event', {
    action,
    userId,
    success,
    ...details
  })
}

// Add Gemini AI logging method
logger.logGemini = (action, success, details = {}) => {
  const level = success ? 'info' : 'error'
  logger[level]('Gemini AI Operation', {
    action,
    success,
    ...details
  })
}

// Add trace logging method
logger.logTrace = (operation, details = {}) => {
  logger.debug('Application Trace', {
    operation,
    timestamp: new Date().toISOString(),
    ...details
  })
}

// Add database exception logging method
logger.logDatabaseException = (error, context = {}) => {
  logger.error('Database Exception', {
    message: error.message,
    code: error.code,
    errno: error.errno,
    sqlState: error.sqlState,
    sqlMessage: error.sqlMessage,
    stack: error.stack,
    ...context
  })
}

// Add database operation trace method
logger.logDatabaseTrace = (operation, table, query, params = [], executionTime = null) => {
  logger.debug('Database Operation Trace', {
    operation,
    table,
    query: query.substring(0, 200) + (query.length > 200 ? '...' : ''), // Truncate long queries
    params: params.length > 0 ? params : undefined,
    executionTime: executionTime ? `${executionTime}ms` : undefined,
    timestamp: new Date().toISOString()
  })
}

// Add performance trace method
logger.logPerformance = (operation, duration, details = {}) => {
  const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug'
  logger[level]('Performance Trace', {
    operation,
    duration: `${duration}ms`,
    ...details
  })
}

// Add stack trace logging method
logger.logStackTrace = (error, context = {}) => {
  logger.error('Stack Trace', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    ...context
  })
}

export default logger
