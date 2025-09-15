import jwt from 'jsonwebtoken'

// Generate JWT token
export const generateToken = (userId, role = 'user') => {
  const payload = {
    userId,
    role,
    iat: Math.floor(Date.now() / 1000),
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// Decode JWT token without verification (for debugging)
export const decodeToken = (token) => {
  try {
    return jwt.decode(token)
  } catch (error) {
    throw new Error('Invalid token format')
  }
}
