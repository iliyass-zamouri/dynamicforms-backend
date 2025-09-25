import { executeQuery } from '../database/connection.js'
import logger from '../utils/logger.js'

export class AccountType {
  constructor(data) {
    this.id = data.id
    this.name = data.name
    this.displayName = data.display_name
    this.description = data.description
    this.maxForms = data.max_forms
    this.maxSubmissionsPerForm = data.max_submissions_per_form
    this.canExportForms = data.can_export_forms
    this.canExportSubmissions = data.can_export_submissions
    this.maxExportsPerForm = data.max_exports_per_form
    this.maxExportsPerSubmission = data.max_exports_per_submission
    this.features = data.features
    this.priceMonthly = data.price_monthly
    this.priceYearly = data.price_yearly
    this.currency = data.currency
    this.currencySymbol = data.currency_symbol
    this.isActive = data.is_active
    this.isDefault = data.is_default
    this.createdAt = data.created_at
    this.updatedAt = data.updated_at
  }

  // Create a new account type
  static async create(accountTypeData) {
    const startTime = Date.now()
    
    logger.logTrace('account_type_create_start', { name: accountTypeData.name })

    try {
      const accountTypeId = crypto.randomUUID()
      
      const sql = `
        INSERT INTO account_types (
          id, name, display_name, description, max_forms, max_submissions_per_form,
          can_export_forms, can_export_submissions, max_exports_per_form, max_exports_per_submission,
          features, price_monthly, price_yearly, currency, currency_symbol, is_active, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      const result = await executeQuery(sql, [
        accountTypeId,
        accountTypeData.name,
        accountTypeData.displayName,
        accountTypeData.description,
        accountTypeData.maxForms,
        accountTypeData.maxSubmissionsPerForm,
        accountTypeData.canExportForms,
        accountTypeData.canExportSubmissions,
        accountTypeData.maxExportsPerForm,
        accountTypeData.maxExportsPerSubmission,
        JSON.stringify(accountTypeData.features || {}),
        accountTypeData.priceMonthly,
        accountTypeData.priceYearly,
        accountTypeData.currency,
        accountTypeData.currencySymbol || '$',
        accountTypeData.isActive !== false,
        accountTypeData.isDefault || false
      ])

      if (result.success) {
        const accountType = await AccountType.findById(accountTypeId)
        const duration = Date.now() - startTime
        
        logger.logTrace('account_type_create_success', { 
          accountTypeId: accountType?.id, 
          name: accountTypeData.name,
          duration: `${duration}ms` 
        })
        
        return accountType
      }

      logger.logTrace('account_type_create_failed', { 
        name: accountTypeData.name,
        reason: 'Database insert failed',
        duration: `${Date.now() - startTime}ms`
      })

      return null
    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.logError(error, {
        operation: 'account_type_create',
        name: accountTypeData.name,
        duration: `${duration}ms`
      })
      
      throw error
    }
  }

  // Find account type by ID
  static async findById(id) {
    const sql = 'SELECT * FROM account_types WHERE id = ?'
    const result = await executeQuery(sql, [id])

    if (result.success && result.data.length > 0) {
      const accountType = new AccountType(result.data[0])
      
      // Parse features JSON
      if (accountType.features && typeof accountType.features === 'string') {
        try {
          accountType.features = JSON.parse(accountType.features)
        } catch (error) {
          accountType.features = {}
        }
      }
      
      return accountType
    }

    return null
  }

  // Find account type by name
  static async findByName(name) {
    const sql = 'SELECT * FROM account_types WHERE name = ? AND is_active = TRUE'
    const result = await executeQuery(sql, [name])

    if (result.success && result.data.length > 0) {
      const accountType = new AccountType(result.data[0])
      
      // Parse features JSON
      if (accountType.features && typeof accountType.features === 'string') {
        try {
          accountType.features = JSON.parse(accountType.features)
        } catch (error) {
          accountType.features = {}
        }
      }
      
      return accountType
    }

    return null
  }

  // Get all account types
  static async findAll(includeInactive = false) {
    const sql = includeInactive 
      ? 'SELECT * FROM account_types ORDER BY price_monthly ASC, name ASC'
      : 'SELECT * FROM account_types WHERE is_active = TRUE ORDER BY price_monthly ASC, name ASC'
    
    const result = await executeQuery(sql)

    if (result.success) {
      return result.data.map((accountType) => {
        const type = new AccountType(accountType)
        
        // Parse features JSON
        if (type.features && typeof type.features === 'string') {
          try {
            type.features = JSON.parse(type.features)
          } catch (error) {
            type.features = {}
          }
        }
        
        return type
      })
    }

    return []
  }

  // Get default account type
  static async getDefault() {
    const sql = 'SELECT * FROM account_types WHERE is_default = TRUE AND is_active = TRUE LIMIT 1'
    const result = await executeQuery(sql)

    if (result.success && result.data.length > 0) {
      const accountType = new AccountType(result.data[0])
      
      // Parse features JSON
      if (accountType.features && typeof accountType.features === 'string') {
        try {
          accountType.features = JSON.parse(accountType.features)
        } catch (error) {
          accountType.features = {}
        }
      }
      
      return accountType
    }

    return null
  }

  // Update account type
  async update(updateData) {
    const allowedFields = [
      'displayName',
      'description',
      'maxForms',
      'maxSubmissionsPerForm',
      'canExportForms',
      'canExportSubmissions',
      'maxExportsPerForm',
      'maxExportsPerSubmission',
      'features',
      'priceMonthly',
      'priceYearly',
      'currency',
      'currencySymbol',
      'isActive',
      'isDefault'
    ]

    const updates = []
    const values = []

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        const dbField = key === 'displayName' ? 'display_name' :
                       key === 'maxForms' ? 'max_forms' :
                       key === 'maxSubmissionsPerForm' ? 'max_submissions_per_form' :
                       key === 'canExportForms' ? 'can_export_forms' :
                       key === 'canExportSubmissions' ? 'can_export_submissions' :
                       key === 'maxExportsPerForm' ? 'max_exports_per_form' :
                       key === 'maxExportsPerSubmission' ? 'max_exports_per_submission' :
                       key === 'priceMonthly' ? 'price_monthly' :
                       key === 'priceYearly' ? 'price_yearly' :
                       key === 'currencySymbol' ? 'currency_symbol' :
                       key === 'isActive' ? 'is_active' :
                       key === 'isDefault' ? 'is_default' : key

        updates.push(`${dbField} = ?`)
        
        // Handle JSON fields
        if (key === 'features') {
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
    const sql = `UPDATE account_types SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`

    const result = await executeQuery(sql, values)
    return result.success
  }

  // Set as default account type
  async setAsDefault() {
    // First, unset all other defaults
    await executeQuery('UPDATE account_types SET is_default = FALSE')
    
    // Then set this one as default
    const sql = 'UPDATE account_types SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    const result = await executeQuery(sql, [this.id])
    return result.success
  }

  // Delete account type
  async delete() {
    // Don't allow deletion if it's the default type
    if (this.isDefault) {
      throw new Error('Cannot delete the default account type')
    }

    // Don't allow deletion if users are using this account type
    const userCountResult = await executeQuery(
      'SELECT COUNT(*) as count FROM user_preferences WHERE account_type = ?',
      [this.name]
    )
    
    if (userCountResult.success && userCountResult.data[0].count > 0) {
      throw new Error('Cannot delete account type that is in use by users')
    }

    const sql = 'DELETE FROM account_types WHERE id = ?'
    const result = await executeQuery(sql, [this.id])
    return result.success
  }

  // Get preferences for this account type
  getPreferences() {
    return {
      accountType: this.name,
      maxForms: this.maxForms,
      maxSubmissionsPerForm: this.maxSubmissionsPerForm,
      canExportForms: this.canExportForms,
      canExportSubmissions: this.canExportSubmissions,
      maxExportsPerForm: this.maxExportsPerForm,
      maxExportsPerSubmission: this.maxExportsPerSubmission,
      additionalPreferences: this.features || {}
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      maxForms: this.maxForms,
      maxSubmissionsPerForm: this.maxSubmissionsPerForm,
      canExportForms: this.canExportForms,
      canExportSubmissions: this.canExportSubmissions,
      maxExportsPerForm: this.maxExportsPerForm,
      maxExportsPerSubmission: this.maxExportsPerSubmission,
      features: this.features,
      priceMonthly: this.priceMonthly,
      priceYearly: this.priceYearly,
      currency: this.currency,
      currencySymbol: this.currencySymbol,
      isActive: this.isActive,
      isDefault: this.isDefault,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}
