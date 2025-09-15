import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

// Verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token d'accès requis",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide',
      })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide',
      })
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré',
      })
    }

    console.error('Auth middleware error:', error)
    return res.status(500).json({
      success: false,
      message: "Erreur d'authentification",
    })
  }
}

// Check if user is admin
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès administrateur requis',
    })
  }
  next()
}

// Check if user owns the resource or is admin
export const requireOwnershipOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    if (req.user.role === 'admin' || req.user.id === resourceUserId) {
      return next()
    }

    return res.status(403).json({
      success: false,
      message: 'Accès refusé',
    })
  }
}

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.userId)

      if (user) {
        req.user = user
      }
    }

    next()
  } catch (error) {
    // Continue without authentication
    next()
  }
}
