import { executeQuery } from '../database/connection.js'
import bcrypt from 'bcryptjs'

export class User {
  constructor(data) {
    this.id = data.id
    this.email = data.email
    this.name = data.name
    this.password = data.password
    this.role = data.role
    this.createdAt = data.created_at
    this.updatedAt = data.updated_at
  }

  // Create a new user
  static async create(userData) {
    const { email, name, password, role = 'user' } = userData

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const sql = `
      INSERT INTO users (id, email, name, password, role) 
      VALUES (UUID(), ?, ?, ?, ?)
    `

    const result = await executeQuery(sql, [email, name, hashedPassword, role])

    if (result.success) {
      return await User.findById(result.data.insertId)
    }

    return null
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
    const sql = 'SELECT * FROM users WHERE email = ?'
    const result = await executeQuery(sql, [email])

    if (result.success && result.data.length > 0) {
      return new User(result.data[0])
    }

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

  // Convert to JSON (exclude password)
  toJSON() {
    const { password, ...userWithoutPassword } = this
    return userWithoutPassword
  }
}
