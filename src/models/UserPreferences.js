import { executeQuery, executeTransaction } from '../database/connection.js'
import logger from '../utils/logger.js'
import { AccountType } from './AccountType.js'

export class UserPreferences {
  constructor(data) {
    this.id = data.id
    this.userId = data.user_id
    this.accountType = data.account_type
    this.maxForms = data.max_forms
    this.maxSubmissionsPerForm = data.max_submissions_per_form
    this.canExportForms = data.can_export_forms
    this.canExportSubmissions = data.can_export_submissions
    this.maxExportsPerForm = data.max_exports_per_form
    this.maxExportsPerSubmission = data.max_exports_per_submission
    this.additionalPreferences = data.additional_preferences
    this.createdAt = data.created_at
    this.updatedAt = data.updated_at
  }

  // Create default preferences for a user
  static async createDefault(userId, accountTypeName = 'free') {
    const startTime = Date.now()
    
    logger.logTrace('user_preferences_create_default_start', { userId, accountTypeName })

    try {
      const preferencesId = crypto.randomUUID()
      
      // Get defaults from AccountType
      const accountType = await AccountType.findByName(accountTypeName)
      if (!accountType) {
        throw new Error(`Account type '${accountTypeName}' not found`)
      }

      const defaults = accountType.getPreferences()

      const sql = `
        INSERT INTO user_preferences (
          id, user_id, account_type, max_forms, max_submissions_per_form,
          can_export_forms, can_export_submissions, max_exports_per_form, max_exports_per_submission,
          additional_preferences
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      const result = await executeQuery(sql, [
        preferencesId,
        userId,
        defaults.accountType,
        defaults.maxForms,
        defaults.maxSubmissionsPerForm,
        defaults.canExportForms,
        defaults.canExportSubmissions,
        defaults.maxExportsPerForm,
        defaults.maxExportsPerSubmission,
        JSON.stringify(defaults.additionalPreferences || {})
      ])

      if (result.success) {
        const preferences = await UserPreferences.findByUserId(userId)
        const duration = Date.now() - startTime
        
        logger.logTrace('user_preferences_create_default_success', { 
          userId, 
          accountTypeName, 
          preferencesId: preferences?.id,
          duration: `${duration}ms` 
        })
        
        return preferences
      }

      logger.logTrace('user_preferences_create_default_failed', { 
        userId, 
        accountTypeName,
        reason: 'Database insert failed',
        duration: `${Date.now() - startTime}ms`
      })

      return null
    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.logError(error, {
        operation: 'user_preferences_create_default',
        userId,
        accountTypeName,
        duration: `${duration}ms`
      })
      
      throw error
    }
  }

  // Update user preferences to match account type defaults
  async updateToAccountTypeDefaults(accountTypeName) {
    const accountType = await AccountType.findByName(accountTypeName)
    if (!accountType) {
      throw new Error(`Account type '${accountTypeName}' not found`)
    }

    const defaults = accountType.getPreferences()
    
    return await this.update({
      accountType: defaults.accountType,
      maxForms: defaults.maxForms,
      maxSubmissionsPerForm: defaults.maxSubmissionsPerForm,
      canExportForms: defaults.canExportForms,
      canExportSubmissions: defaults.canExportSubmissions,
      maxExportsPerForm: defaults.maxExportsPerForm,
      maxExportsPerSubmission: defaults.maxExportsPerSubmission,
      additionalPreferences: defaults.additionalPreferences
    })
  }

  // Find preferences by user ID
  static async findByUserId(userId) {
    const startTime = Date.now()
    const sql = 'SELECT * FROM user_preferences WHERE user_id = ?'
    
    logger.logTrace('user_preferences_find_by_user_id', { userId })
    
    const result = await executeQuery(sql, [userId])
    const duration = Date.now() - startTime

    if (result.success && result.data.length > 0) {
      const preferences = new UserPreferences(result.data[0])
      
      // Parse additional preferences JSON
      if (preferences.additionalPreferences && typeof preferences.additionalPreferences === 'string') {
        try {
          preferences.additionalPreferences = JSON.parse(preferences.additionalPreferences)
        } catch (error) {
          logger.logError(error, {
            operation: 'user_preferences_parse_additional',
            userId,
            preferencesId: preferences.id
          })
          preferences.additionalPreferences = {}
        }
      }
      
      logger.logTrace('user_preferences_find_by_user_id_success', { 
        userId, 
        preferencesId: preferences.id,
        accountType: preferences.accountType,
        duration: `${duration}ms`
      })
      return preferences
    }

    logger.logTrace('user_preferences_find_by_user_id_not_found', { 
      userId, 
      duration: `${duration}ms`
    })
    return null
  }

  // Find preferences by ID
  static async findById(id) {
    const sql = 'SELECT * FROM user_preferences WHERE id = ?'
    const result = await executeQuery(sql, [id])

    if (result.success && result.data.length > 0) {
      const preferences = new UserPreferences(result.data[0])
      
      // Parse additional preferences JSON
      if (preferences.additionalPreferences && typeof preferences.additionalPreferences === 'string') {
        try {
          preferences.additionalPreferences = JSON.parse(preferences.additionalPreferences)
        } catch (error) {
          preferences.additionalPreferences = {}
        }
      }
      
      return preferences
    }

    return null
  }

  // Update preferences
  async update(updateData) {
    const allowedFields = [
      'accountType',
      'maxForms',
      'maxSubmissionsPerForm',
      'canExportForms',
      'canExportSubmissions',
      'maxExportsPerForm',
      'maxExportsPerSubmission',
      'additionalPreferences'
    ]

    const updates = []
    const values = []

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        const dbField = key === 'accountType' ? 'account_type' :
                       key === 'maxForms' ? 'max_forms' :
                       key === 'maxSubmissionsPerForm' ? 'max_submissions_per_form' :
                       key === 'canExportForms' ? 'can_export_forms' :
                       key === 'canExportSubmissions' ? 'can_export_submissions' :
                       key === 'maxExportsPerForm' ? 'max_exports_per_form' :
                       key === 'maxExportsPerSubmission' ? 'max_exports_per_submission' :
                       key === 'additionalPreferences' ? 'additional_preferences' : key

        updates.push(`${dbField} = ?`)
        
        // Handle JSON fields
        if (key === 'additionalPreferences') {
          values.push(JSON.stringify(value))
        } else {
          values.push(value)
        }
      }
    }

    if (updates.length === 0) {
      return false
    }

    values.push(this.id)
    const sql = `UPDATE user_preferences SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`

    const result = await executeQuery(sql, values)
    return result.success
  }

  // Check if user can create more forms
  async canCreateForm() {
    const currentFormCount = await this.getCurrentFormCount()
    return currentFormCount < this.maxForms
  }

  // Check if user can create more submissions for a form
  async canCreateSubmission(formId) {
    const currentSubmissionCount = await this.getCurrentSubmissionCount(formId)
    return currentSubmissionCount < this.maxSubmissionsPerForm
  }

  // Check if user can export forms
  async canExportForm() {
    return this.canExportForms
  }

  // Check if user can export submissions
  async canExportSubmission() {
    return this.canExportSubmissions
  }

  // Check if user can export a specific form (within limits)
  async canExportFormWithinLimits(formId) {
    if (!this.canExportForms) {
      return false
    }

    if (this.maxExportsPerForm === 0) {
      return false
    }

    const currentExportCount = await this.getCurrentFormExportCount(formId)
    return currentExportCount < this.maxExportsPerForm
  }

  // Check if user can export a specific submission (within limits)
  async canExportSubmissionWithinLimits(submissionId) {
    if (!this.canExportSubmissions) {
      return false
    }

    if (this.maxExportsPerSubmission === 0) {
      return false
    }

    const currentExportCount = await this.getCurrentSubmissionExportCount(submissionId)
    return currentExportCount < this.maxExportsPerSubmission
  }

  // Get current form count for user
  async getCurrentFormCount() {
    const sql = 'SELECT COUNT(*) as count FROM forms WHERE user_id = ?'
    const result = await executeQuery(sql, [this.userId])
    
    if (result.success) {
      return result.data[0].count
    }
    
    return 0
  }

  // Get current submission count for a form
  async getCurrentSubmissionCount(formId) {
    const sql = 'SELECT COUNT(*) as count FROM form_submissions WHERE form_id = ?'
    const result = await executeQuery(sql, [formId])
    
    if (result.success) {
      return result.data[0].count
    }
    
    return 0
  }

  // Get current export count for a form
  async getCurrentFormExportCount(formId) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM export_tracking 
      WHERE user_id = ? AND form_id = ? AND export_type = 'form'
    `
    const result = await executeQuery(sql, [this.userId, formId])
    
    if (result.success) {
      return result.data[0].count
    }
    
    return 0
  }

  // Get current export count for a submission
  async getCurrentSubmissionExportCount(submissionId) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM export_tracking 
      WHERE user_id = ? AND submission_id = ? AND export_type = 'submission'
    `
    const result = await executeQuery(sql, [this.userId, submissionId])
    
    if (result.success) {
      return result.data[0].count
    }
    
    return 0
  }

  // Record an export
  static async recordExport(exportData) {
    const { userId, formId, submissionId, exportType, exportFormat, filePath, fileSize } = exportData
    
    const exportId = crypto.randomUUID()
    
    const sql = `
      INSERT INTO export_tracking (
        id, user_id, form_id, submission_id, export_type, export_format, file_path, file_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const result = await executeQuery(sql, [
      exportId,
      userId,
      formId,
      submissionId,
      exportType,
      exportFormat,
      filePath,
      fileSize
    ])
    
    return result.success
  }

  // Get all preferences (admin only)
  static async findAll(limit = 50, offset = 0) {
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0

    const sql = `
      SELECT up.*, u.name as user_name, u.email as user_email, u.role as user_role, u.created_at as user_created_at
      FROM user_preferences up
      JOIN users u ON up.user_id = u.id
      ORDER BY up.updated_at DESC
      LIMIT ? OFFSET ?
    `

    const result = await executeQuery(sql, [limitNum, offsetNum])

    if (result.success) {
      return result.data.map((preferences) => {
        const userPreferences = new UserPreferences(preferences)
        userPreferences.userName = preferences.user_name
        userPreferences.userEmail = preferences.user_email
        userPreferences.userRole = preferences.user_role
        userPreferences.userCreatedAt = preferences.user_created_at
        
        // Parse additional preferences JSON
        if (userPreferences.additionalPreferences && typeof userPreferences.additionalPreferences === 'string') {
          try {
            userPreferences.additionalPreferences = JSON.parse(userPreferences.additionalPreferences)
          } catch (error) {
            userPreferences.additionalPreferences = {}
          }
        }
        
        return userPreferences
      })
    }

    return []
  }

  // Delete preferences
  async delete() {
    const sql = 'DELETE FROM user_preferences WHERE id = ?'
    const result = await executeQuery(sql, [this.id])
    return result.success
  }

  // Convert to JSON
  toJSON() {
    const baseData = {
      id: this.id,
      userId: this.userId,
      accountType: this.accountType,
      maxForms: this.maxForms,
      maxSubmissionsPerForm: this.maxSubmissionsPerForm,
      canExportForms: this.canExportForms,
      canExportSubmissions: this.canExportSubmissions,
      maxExportsPerForm: this.maxExportsPerForm,
      maxExportsPerSubmission: this.maxExportsPerSubmission,
      additionalPreferences: this.additionalPreferences,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }

    // Include user data if available (for admin endpoints)
    if (this.userName || this.userEmail) {
      baseData.user = {
        name: this.userName,
        email: this.userEmail,
        role: this.userRole,
        createdAt: this.userCreatedAt
      }
    }

    return baseData
  }
}
