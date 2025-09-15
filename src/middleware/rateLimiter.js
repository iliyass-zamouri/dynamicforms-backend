import rateLimit from 'express-rate-limit'

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Auth rate limiter (stricter for login/register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Trop de tentatives d'authentification, veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Form submission rate limiter
export const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 submissions per minute
  message: {
    success: false,
    message: 'Trop de soumissions de formulaires, veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// API rate limiter (for general API calls)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: {
    success: false,
    message: 'Trop de requêtes API, veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
