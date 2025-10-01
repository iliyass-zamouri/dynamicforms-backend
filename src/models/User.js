import { executeQuery } from '../database/connection.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import logger from '../utils/logger.js'
import { UserPreferences } from './UserPreferences.js'

export class User {
  constructor(data) {
    this.id = data.id
    this.email = data.email
    this.name = data.name
    this.password = data.password
    this.role = data.role
    this.createdAt = data.created_at
    this.updatedAt = data.updated_at
    this.blockedAt = data.blocked_at || null
    this.emailVerifiedAt = data.email_verified_at || null
    this.passwordResetToken = data.password_reset_token || null
    this.passwordResetExpiresAt = data.password_reset_expires_at || null
    this.emailVerificationToken = data.email_verification_token || null
    this.emailVerificationCode = data.email_verification_code || null
    this.emailVerificationCodeExpiresAt = data.email_verification_code_expires_at || null
  }

  // Create a new user
  static async create(userData) {
    const { email, name, password, role = 'user' } = userData
    const startTime = Date.now()

    logger.logTrace('user_create_start', { email, role })

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)
      
      // Generate email verification token and code
      const emailVerificationToken = crypto.randomBytes(32).toString('hex')
      const emailVerificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

      const userId = crypto.randomUUID()
      
      const sql = `
        INSERT INTO users (id, email, name, password, role, email_verification_token, email_verification_code, email_verification_code_expires_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `

      const result = await executeQuery(sql, [userId, email, name, hashedPassword, role, emailVerificationToken, emailVerificationCode, codeExpiresAt])

      if (result.success) {
        const user = await User.findById(userId)
        const duration = Date.now() - startTime
        
        logger.logTrace('user_create_success', { 
          userId: user?.id, 
          email, 
          role, 
          duration: `${duration}ms` 
        })
        
        return user
      }

      logger.logTrace('user_create_failed', { 
        email, 
        reason: 'Database insert failed',
        duration: `${Date.now() - startTime}ms`
      })

      return null
    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.logError(error, {
        operation: 'user_create',
        email,
        duration: `${duration}ms`
      })
      
      throw error
    }
  }

  // Find user by ID
  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?'
    const result = await executeQuery(sql, [id])

    if (result.success && result.data.length > 0) {
      return new User(result.data[0])
    }

    return null
  }

  // Find user by email
  static async findByEmail(email) {
    const startTime = Date.now()
    const sql = 'SELECT * FROM users WHERE email = ?'
    
    logger.logTrace('user_find_by_email', { email })
    
    const result = await executeQuery(sql, [email])
    const duration = Date.now() - startTime

    if (result.success && result.data.length > 0) {
      logger.logTrace('user_find_by_email_success', { 
        email, 
        userId: result.data[0].id,
        duration: `${duration}ms`
      })
      return new User(result.data[0])
    }

    logger.logTrace('user_find_by_email_not_found', { 
      email, 
      duration: `${duration}ms`
    })
    return null
  }

  // Update user
  async update(updateData) {
    const allowedFields = ['name', 'email', 'role']
    const updates = []
    const values = []

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`)
        values.push(value)
      }
    }

    if (updates.length === 0) {
      return false
    }

    values.push(this.id)
    const sql = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`

    const result = await executeQuery(sql, values)
    return result.success
  }

  // Update password
  async updatePassword(newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const sql = 'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'

    const result = await executeQuery(sql, [hashedPassword, this.id])
    if (result.success) {
      // Update local password property to keep object in sync
      this.password = hashedPassword
    }
    return result.success
  }

  // Verify password
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password)
  }

  // Delete user
  async delete() {
    const sql = 'DELETE FROM users WHERE id = ?'
    const result = await executeQuery(sql, [this.id])
    return result.success
  }

  // Get all users (admin only)
  static async findAll(limit = 50, offset = 0) {
    const sql = 'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?'
    const result = await executeQuery(sql, [limit, offset])

    if (result.success) {
      return result.data.map((user) => new User(user))
    }

    return []
  }

  // Get user count
  static async count() {
    const sql = 'SELECT COUNT(*) as count FROM users'
    const result = await executeQuery(sql)

    if (result.success) {
      return result.data[0].count
    }

    return 0
  }

  // Get user preferences
  async getPreferences() {
    const preferences = await UserPreferences.findByUserId(this.id)
    return preferences
  }

  // Check if user can create more forms
  async canCreateForm() {
    const preferences = await this.getPreferences()
    if (!preferences) {
      return false // No preferences means no permissions
    }
    return await preferences.canCreateForm()
  }

  // Check if user can create more submissions for a form
  async canCreateSubmission(formId) {
    const preferences = await this.getPreferences()
    if (!preferences) {
      return false // No preferences means no permissions
    }
    return await preferences.canCreateSubmission(formId)
  }

  // Check if user can export forms
  async canExportForm() {
    const preferences = await this.getPreferences()
    if (!preferences) {
      return false // No preferences means no permissions
    }
    return await preferences.canExportForm()
  }

  // Check if user can export submissions
  async canExportSubmission() {
    const preferences = await this.getPreferences()
    if (!preferences) {
      return false // No preferences means no permissions
    }
    return await preferences.canExportSubmission()
  }

  // Check if user can export a specific form (within limits)
  async canExportFormWithinLimits(formId) {
    const preferences = await this.getPreferences()
    if (!preferences) {
      return false // No preferences means no permissions
    }
    return await preferences.canExportFormWithinLimits(formId)
  }

  // Check if user can export a specific submission (within limits)
  async canExportSubmissionWithinLimits(submissionId) {
    const preferences = await this.getPreferences()
    if (!preferences) {
      return false // No preferences means no permissions
    }
    return await preferences.canExportSubmissionWithinLimits(submissionId)
  }

  // Block user
  async block() {
    const sql = 'UPDATE users SET blocked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    const result = await executeQuery(sql, [this.id])
    if (result.success) {
      this.blockedAt = new Date().toISOString()
    }
    return result.success
  }

  // Unblock user
  async unblock() {
    const sql = 'UPDATE users SET blocked_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    const result = await executeQuery(sql, [this.id])
    if (result.success) {
      this.blockedAt = null
    }
    return result.success
  }

  // Verify email
  async verifyEmail() {
    const sql = 'UPDATE users SET email_verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    const result = await executeQuery(sql, [this.id])
    if (result.success) {
      this.emailVerifiedAt = new Date().toISOString()
    }
    return result.success
  }

  // Check if user is blocked
  isBlocked() {
    return this.blockedAt !== null
  }

  // Check if email is verified
  isEmailVerified() {
    return this.emailVerifiedAt !== null
  }

  // Generate email verification token
  generateEmailVerificationToken() {
    return crypto.randomBytes(32).toString('hex')
  }

  // Generate password reset token
  generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex')
  }

  // Set email verification token
  async setEmailVerificationToken(token) {
    const sql = 'UPDATE users SET email_verification_token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    const result = await executeQuery(sql, [token, this.id])
    if (result.success) {
      this.emailVerificationToken = token
    }
    return result.success
  }

  // Set password reset token with expiration (1 hour from now)
  async setPasswordResetToken(token) {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    const sql = 'UPDATE users SET password_reset_token = ?, password_reset_expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    const result = await executeQuery(sql, [token, expiresAt, this.id])
    if (result.success) {
      this.passwordResetToken = token
      this.passwordResetExpiresAt = expiresAt.toISOString()
    }
    return result.success
  }

  // Clear password reset token
  async clearPasswordResetToken() {
    const sql = 'UPDATE users SET password_reset_token = NULL, password_reset_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    const result = await executeQuery(sql, [this.id])
    if (result.success) {
      this.passwordResetToken = null
      this.passwordResetExpiresAt = null
    }
    return result.success
  }

  // Clear email verification token
  async clearEmailVerificationToken() {
    const sql = 'UPDATE users SET email_verification_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    const result = await executeQuery(sql, [this.id])
    if (result.success) {
      this.emailVerificationToken = null
    }
    return result.success
  }

  // Check if password reset token is valid and not expired
  isPasswordResetTokenValid(token) {
    if (!this.passwordResetToken || !this.passwordResetExpiresAt) {
      return false
    }
    
    if (this.passwordResetToken !== token) {
      return false
    }
    
    const now = new Date()
    const expiresAt = new Date(this.passwordResetExpiresAt)
    
    return now < expiresAt
  }

  // Check if email verification token is valid
  isEmailVerificationTokenValid(token) {
    return this.emailVerificationToken === token
  }

  // Find user by password reset token
  static async findByPasswordResetToken(token) {
    const sql = 'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires_at > NOW()'
    const result = await executeQuery(sql, [token])

    if (result.success && result.data.length > 0) {
      return new User(result.data[0])
    }

    return null
  }

  // Find user by email verification token
  static async findByEmailVerificationToken(token) {
    const sql = 'SELECT * FROM users WHERE email_verification_token = ?'
    const result = await executeQuery(sql, [token])

    if (result.success && result.data.length > 0) {
      return new User(result.data[0])
    }

    return null
  }

  // Generate email verification code (6-digit code)
  generateEmailVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Set email verification code with expiration (10 minutes from now)
  async setEmailVerificationCode(code) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    const sql = 'UPDATE users SET email_verification_code = ?, email_verification_code_expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    const result = await executeQuery(sql, [code, expiresAt, this.id])
    if (result.success) {
      this.emailVerificationCode = code
      this.emailVerificationCodeExpiresAt = expiresAt.toISOString()
    }
    return result.success
  }

  // Clear email verification code
  async clearEmailVerificationCode() {
    const sql = 'UPDATE users SET email_verification_code = NULL, email_verification_code_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    const result = await executeQuery(sql, [this.id])
    if (result.success) {
      this.emailVerificationCode = null
      this.emailVerificationCodeExpiresAt = null
    }
    return result.success
  }

  // Check if email verification code is valid and not expired
  isEmailVerificationCodeValid(code) {
    if (!this.emailVerificationCode || !this.emailVerificationCodeExpiresAt) {
      return false
    }
    
    if (this.emailVerificationCode !== code) {
      return false
    }
    
    const now = new Date()
    const expiresAt = new Date(this.emailVerificationCodeExpiresAt)
    
    return now < expiresAt
  }

  // Find user by email verification code
  static async findByEmailVerificationCode(code) {
    const sql = 'SELECT * FROM users WHERE email_verification_code = ? AND email_verification_code_expires_at > NOW()'
    const result = await executeQuery(sql, [code])

    if (result.success && result.data.length > 0) {
      return new User(result.data[0])
    }

    return null
  }

  // Update user
  async update(updateData) {
    const allowedFields = ['name', 'email', 'role']
    const fields = []
    const values = []

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }

    if (fields.length === 0) {
      return true // No fields to update
    }

    values.push(this.id)
    const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    const result = await executeQuery(sql, values)

    if (result.success) {
      // Update local instance
      Object.assign(this, updateData)
    }

    return result.success
  }

  // Delete user
  async delete() {
    const sql = 'DELETE FROM users WHERE id = ?'
    const result = await executeQuery(sql, [this.id])
    return result.success
  }

  // Convert to JSON (exclude sensitive data)
  toJSON() {
    const { 
      password, 
      passwordResetToken, 
      passwordResetExpiresAt,
      emailVerificationToken,
      emailVerificationCode,
      emailVerificationCodeExpiresAt,
      ...userWithoutSensitiveData 
    } = this
    return userWithoutSensitiveData
  }
}
