import { executeQuery, executeQueryRaw, executeTransaction } from '../database/connection.js'

export class Form {
  constructor(data) {
    this.id = data.id
    this.slug = data.slug
    this.title = data.title
    this.description = data.description
    this.status = data.status
    this.allowMultipleSubmissions = data.allow_multiple_submissions
    this.requireAuthentication = data.require_authentication
    this.theme = data.theme
    this.primaryColor = data.primary_color
    this.notificationEmail = data.notification_email
    this.emailNotifications = data.email_notifications
    this.userId = data.user_id
    this.createdAt = data.created_at
    this.updatedAt = data.updated_at
    this.steps = data.steps || []
    this.submissionsCount = data.submissions_count || 0
    this.marketing = data.marketing || null
    this.successModal = data.success_modal 
      ? (typeof data.success_modal === 'string' ? 
          (() => {
            try {
              return JSON.parse(data.success_modal)
            } catch (error) {
              console.error('Error parsing success_modal JSON:', error.message, 'Data:', data.success_modal)
              return null
            }
          })() : data.success_modal)
      : null
  }

  // Create a new form
  static async create(formData) {
    const {
      slug,
      title,
      description,
      status = 'draft',
      allowMultipleSubmissions = true,
      requireAuthentication = false,
      theme = 'default',
      primaryColor = '#3b82f6',
      notificationEmail,
      emailNotifications = false,
      userId,
      steps = [],
    } = formData

    const formId = crypto.randomUUID()

    const queries = [
      {
        sql: `
          INSERT INTO forms (id, slug, title, description, status, allow_multiple_submissions,
                           require_authentication, theme, primary_color, notification_email, email_notifications, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          formId,
          slug || null,
          title || 'Formulaire sans titre',
          description || null,
          status || 'draft',
          allowMultipleSubmissions !== undefined ? allowMultipleSubmissions : true,
          requireAuthentication !== undefined ? requireAuthentication : false,
          theme || 'default',
          primaryColor || '#3b82f6',
          notificationEmail || null,
          emailNotifications !== undefined ? emailNotifications : false,
          userId || null,
        ],
      },
    ]

    // Add steps if provided
    if (steps.length > 0) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        const stepId = crypto.randomUUID()

        queries.push({
          sql: 'INSERT INTO form_steps (id, form_id, title, step_order) VALUES (?, ?, ?, ?)',
          params: [stepId, formId, step.title || null, i],
        })

        // Add fields for this step
        if (step.fields && step.fields.length > 0) {
          for (let j = 0; j < step.fields.length; j++) {
            const field = step.fields[j]
            const fieldId = crypto.randomUUID()

            queries.push({
              sql: `
                INSERT INTO form_fields (id, step_id, field_type, label, placeholder, is_required, field_order, validation_config, file_config)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `,
              params: [
                fieldId,
                stepId,
                field.type || null,
                field.label || null,
                field.placeholder || null,
                field.required !== undefined ? field.required : false,
                field.order,
                JSON.stringify(field.validation || {}),
                JSON.stringify(field.fileConfig || {}),
              ],
            })

            // Add field options if they exist
            if (field.options && field.options.length > 0) {
              for (let k = 0; k < field.options.length; k++) {
                const option = field.options[k]
                queries.push({
                  sql: 'INSERT INTO field_options (id, field_id, label, value, option_order) VALUES (UUID(), ?, ?, ?, ?)',
                  params: [fieldId, option.label || null, option.value || null, k],
                })
              }
            }
          }
        }
      }
    }

    const result = await executeTransaction(queries)

    if (result.success) {
      return await Form.findById(formId)
    }

    return null
  }

  // Find form by ID
  static async findById(id) {
    const sql = 'SELECT * FROM forms WHERE id = ?'
    const result = await executeQuery(sql, [id])

    if (result.success && result.data.length > 0) {
      const form = new Form(result.data[0])
      form.steps = await Form.getStepsWithFields(id)
      form.submissionsCount = await Form.getSubmissionsCount(id)
      form.marketing = await Form.getMarketingSettings(id)
      return form
    }

    return null
  }

  // Find form by slug
  static async findBySlug(slug) {
    const sql = 'SELECT * FROM forms WHERE slug = ? AND status = "active"'
    const result = await executeQuery(sql, [slug])

    if (result.success && result.data.length > 0) {
      const form = new Form(result.data[0])
      form.steps = await Form.getStepsWithFields(form.id)
      form.submissionsCount = await Form.getSubmissionsCount(form.id)
      form.marketing = await Form.getMarketingSettings(form.id)
      return form
    }

    return null
  }

  // Get all forms for a user
  static async findByUserId(userId, limit = 50, offset = 0, sortOrder = 'desc') {
    // Ensure we have valid numbers
    const limitNum = Number(limit) || 50
    const offsetNum = Number(offset) || 0
    const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

    const sql = `
      SELECT f.*, 0 as submissions_count
      FROM forms f
      WHERE f.user_id = ?
      ORDER BY f.updated_at ${orderDirection}
      LIMIT ? OFFSET ?
    `

    const result = await executeQueryRaw(sql, [userId, limitNum, offsetNum])

    if (result.success) {
      const forms = result.data.map((form) => new Form(form))
      // Get submission counts, steps and marketing for each form
      for (const form of forms) {
        form.submissionsCount = await Form.getSubmissionsCount(form.id)
        form.steps = await Form.getStepsWithFields(form.id)
        form.marketing = await Form.getMarketingSettings(form.id)
      }
      return forms
    }

    return []
  }

  // Get all forms (admin only)
  static async findAll(limit = 50, offset = 0, sortOrder = 'desc') {
    // Ensure we have valid numbers
    const limitNum = Number(limit) || 50
    const offsetNum = Number(offset) || 0
    const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

    const sql = `
      SELECT f.*, 0 as submissions_count
      FROM forms f
      ORDER BY f.updated_at ${orderDirection}
      LIMIT ? OFFSET ?
    `

    const result = await executeQueryRaw(sql, [limitNum, offsetNum])

    if (result.success) {
      const forms = result.data.map((form) => new Form(form))
      // Get submission counts, steps and marketing for each form
      for (const form of forms) {
        form.submissionsCount = await Form.getSubmissionsCount(form.id)
        form.steps = await Form.getStepsWithFields(form.id)
        form.marketing = await Form.getMarketingSettings(form.id)
      }
      return forms
    }

    return []
  }

  // Get steps with fields for a form
  static async getStepsWithFields(formId) {
    const sql = `
      SELECT s.*,
             COALESCE(
               (SELECT JSON_ARRAYAGG(
                 JSON_OBJECT(
                   'id', f2.id,
                   'type', f2.field_type,
                   'label', f2.label,
                   'placeholder', f2.placeholder,
                   'required', f2.is_required,
                   'order', f2.field_order,
                   'validation', f2.validation_config,
                   'fileConfig', f2.file_config,
                   'options', COALESCE(
                     (SELECT JSON_ARRAYAGG(
                       JSON_OBJECT('label', o.label, 'value', o.value)
                     ) FROM field_options o WHERE o.field_id = f2.id ORDER BY o.option_order),
                     JSON_ARRAY()
                   )
                 )
               )
               FROM form_fields f2
               WHERE f2.step_id = s.id
               ORDER BY f2.field_order),
               JSON_ARRAY()
             ) as fields
      FROM form_steps s
      WHERE s.form_id = ?
      ORDER BY s.step_order
    `

    const result = await executeQuery(sql, [formId])

    if (result.success) {
      return result.data.map((step) => {
        let fields = []
        try {
          // Handle different field data types
          if (typeof step.fields === 'string') {
            fields = JSON.parse(step.fields)
          } else if (Array.isArray(step.fields)) {
            fields = step.fields
          } else if (step.fields && typeof step.fields === 'object') {
            fields = Object.values(step.fields)
          }
          
          // Ensure fields is an array and filter out null values
          if (Array.isArray(fields)) {
            fields = fields.filter((field) => field !== null)
          } else {
            fields = []
          }
        } catch (error) {
          console.error('Error parsing step fields:', error, 'Step:', step.id)
          fields = []
        }
        
        return {
          id: step.id,
          title: step.title,
          fields: fields,
        }
      })
    }

    return []
  }

  // Get submissions count for a form
  static async getSubmissionsCount(formId) {
    const sql = 'SELECT COUNT(*) as count FROM form_submissions WHERE form_id = ?'
    const result = await executeQuery(sql, [formId])

    if (result.success) {
      return result.data[0].count
    }

    return 0
  }

  // Get marketing settings for a form
  static async getMarketingSettings(formId) {
    const sql = `
      SELECT
        sidebar_title,
        sidebar_description,
        sidebar_logo,
        sidebar_enabled,
        footer_text,
        social_media_enabled,
        social_media_title
      FROM marketing_settings
      WHERE form_id = ?
    `
    const result = await executeQuery(sql, [formId])

    if (result.success && result.data.length > 0) {
      const settings = result.data[0]

      // Get social media buttons
      const buttonsSql = `
        SELECT platform, url, icon, is_enabled, button_order
        FROM social_media_buttons
        WHERE marketing_id = (SELECT id FROM marketing_settings WHERE form_id = ?)
        ORDER BY button_order
      `
      const buttonsResult = await executeQuery(buttonsSql, [formId])

      const socialButtons = buttonsResult.success
        ? buttonsResult.data.map((btn) => ({
            id: crypto.randomUUID(), // Generate ID for frontend compatibility
            platform: btn.platform,
            url: btn.url,
            icon: btn.icon,
            enabled: btn.is_enabled,
            order: btn.button_order,
          }))
        : []

      return {
        sidebar: {
          title: settings.sidebar_title || '',
          description: settings.sidebar_description || '',
          logo: settings.sidebar_logo || '',
          enabled: settings.sidebar_enabled === 1 || settings.sidebar_enabled === true, // Only true if explicitly 1 or true
          socialMedia: {
            enabled: settings.social_media_enabled || false,
            title: settings.social_media_title || '',
            buttons: socialButtons,
          },
          footer: {
            text: settings.footer_text || '',
          },
        },
      }
    }

    return null
  }

  // Save marketing settings for a form
  static async saveMarketingSettings(formId, marketingData) {
    const queries = []

    // Delete existing marketing settings
    queries.push({
      sql: 'DELETE FROM social_media_buttons WHERE marketing_id IN (SELECT id FROM marketing_settings WHERE form_id = ?)',
      params: [formId],
    })
    queries.push({
      sql: 'DELETE FROM marketing_settings WHERE form_id = ?',
      params: [formId],
    })

    // Insert new marketing settings
    const marketingId = crypto.randomUUID()
    queries.push({
      sql: `
        INSERT INTO marketing_settings (id, form_id, sidebar_title, sidebar_description, sidebar_logo, sidebar_enabled, footer_text, social_media_enabled, social_media_title)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      params: [
        marketingId,
        formId,
        marketingData.sidebar.title || '',
        marketingData.sidebar.description || '',
        marketingData.sidebar.logo || '',
        marketingData.sidebar.enabled === true, // Only true if explicitly set to true
        marketingData.sidebar.footer.text || '',
        marketingData.sidebar.socialMedia.enabled || false,
        marketingData.sidebar.socialMedia.title || '',
      ],
    })

    // Insert social media buttons
    if (
      marketingData.sidebar.socialMedia.buttons &&
      marketingData.sidebar.socialMedia.buttons.length > 0
    ) {
      for (const button of marketingData.sidebar.socialMedia.buttons) {
        queries.push({
          sql: `
            INSERT INTO social_media_buttons (id, marketing_id, platform, url, icon, is_enabled, button_order)
            VALUES (UUID(), ?, ?, ?, ?, ?, ?)
          `,
          params: [
            marketingId,
            button.platform || '',
            button.url || '',
            button.icon || 'bi-link',
            button.enabled !== false,
            button.order || 0,
          ],
        })
      }
    }

    const result = await executeTransaction(queries)
    return result.success
  }

  // Update success modal settings for a form
  static async updateSuccessModal(formId, successModalData) {
    const sql = 'UPDATE forms SET success_modal = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    const result = await executeQuery(sql, [JSON.stringify(successModalData), formId])
    return result.success
  }

  // Update form
  async update(updateData) {
    const allowedFields = [
      'title',
      'description',
      'slug',
      'status',
      'allowMultipleSubmissions',
      'requireAuthentication',
      'theme',
      'primaryColor',
      'notificationEmail',
      'emailNotifications',
      'successModal',
    ]

    const updates = []
    const values = []

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        const dbField =
          key === 'allowMultipleSubmissions'
            ? 'allow_multiple_submissions'
            : key === 'requireAuthentication'
              ? 'require_authentication'
              : key === 'primaryColor'
                ? 'primary_color'
                : key === 'notificationEmail'
                  ? 'notification_email'
                  : key === 'emailNotifications'
                    ? 'email_notifications'
                    : key === 'successModal'
                      ? 'success_modal'
                      : key

        updates.push(`${dbField} = ?`)
        // Pour successModal, on sérialise en JSON
        values.push(key === 'successModal' ? JSON.stringify(value) : value)
      }
    }

    if (updates.length === 0) {
      return false
    }

    values.push(this.id)
    const sql = `UPDATE forms SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`

    const result = await executeQuery(sql, values)
    return result.success
  }

  // Update form steps and fields
  async updateSteps(steps) {
    const queries = []
    
    // Get existing steps and fields to compare
    const existingSteps = await Form.getStepsWithFields(this.id)
    const existingStepsMap = new Map(existingSteps.map(step => [step.id, step]))
    const existingFieldsMap = new Map()
    
    // Build map of existing fields by their IDs
    existingSteps.forEach(step => {
      if (step.fields) {
        step.fields.forEach(field => {
          existingFieldsMap.set(field.id, { ...field, stepId: step.id })
        })
      }
    })

    // Process each step in the new data
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      let stepId = step.id
      let isNewStep = false

      // Check if step exists, if not create new one
      if (!stepId || !existingStepsMap.has(stepId)) {
        stepId = crypto.randomUUID()
        isNewStep = true
        queries.push({
          sql: 'INSERT INTO form_steps (id, form_id, title, step_order) VALUES (?, ?, ?, ?)',
          params: [stepId, this.id, step.title || null, i],
        })
      } else {
        // Update existing step
        queries.push({
          sql: 'UPDATE form_steps SET title = ?, step_order = ? WHERE id = ?',
          params: [step.title || null, i, stepId],
        })
      }

      // Process fields for this step
      if (step.fields && step.fields.length > 0) {
        for (let j = 0; j < step.fields.length; j++) {
          const field = step.fields[j]
          let fieldId = field.id
          let isNewField = false
          
          // Check if field exists, if not create new one
          if (!fieldId || !existingFieldsMap.has(fieldId)) {
            fieldId = crypto.randomUUID()
            isNewField = true
            queries.push({
              sql: `
                INSERT INTO form_fields (id, step_id, field_type, label, placeholder, is_required, field_order, validation_config, file_config)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `,
              params: [
                fieldId,
                stepId,
                field.type || null,
                field.label || null,
                field.placeholder || null,
                field.required !== undefined ? field.required : false,
                field.order,
                JSON.stringify(field.validation || {}),
                JSON.stringify(field.fileConfig || {}),
              ],
            })
          } else {
            // Update existing field - use the order from request body
            queries.push({
              sql: `
                UPDATE form_fields 
                SET field_type = ?, label = ?, placeholder = ?, is_required = ?, field_order = ?, validation_config = ?, file_config = ?
                WHERE id = ?
              `,
              params: [
                field.type || null,
                field.label || null,
                field.placeholder || null,
                field.required !== undefined ? field.required : false,
                field.order,
                JSON.stringify(field.validation || {}),
                JSON.stringify(field.fileConfig || {}),
                fieldId,
              ],
            })
          }

          // Handle field options
          if (field.options && field.options.length > 0) {
            // Delete existing options for this field
            queries.push({
              sql: 'DELETE FROM field_options WHERE field_id = ?',
              params: [fieldId],
            })

            // Insert new options
            for (let k = 0; k < field.options.length; k++) {
              const option = field.options[k]
              queries.push({
                sql: 'INSERT INTO field_options (id, field_id, label, value, option_order) VALUES (UUID(), ?, ?, ?, ?)',
                params: [fieldId, option.label || null, option.value || null, k],
              })
            }
          } else {
            // If no options provided, delete existing ones
            queries.push({
              sql: 'DELETE FROM field_options WHERE field_id = ?',
              params: [fieldId],
            })
          }
        }
      }

      // If this is a new step, we need to handle fields that might have been removed
      if (!isNewStep) {
        // Get existing field IDs for this step
        const existingFieldIds = existingStepsMap.get(step.id)?.fields?.map(f => f.id) || []
        const newFieldIds = step.fields?.map(f => f.id).filter(id => id) || []
        
        // Find fields to delete (exist in DB but not in new data)
        const fieldsToDelete = existingFieldIds.filter(id => !newFieldIds.includes(id))
        
        for (const fieldIdToDelete of fieldsToDelete) {
          queries.push({
            sql: 'DELETE FROM field_options WHERE field_id = ?',
            params: [fieldIdToDelete],
          })
          queries.push({
            sql: 'DELETE FROM form_fields WHERE id = ?',
            params: [fieldIdToDelete],
          })
        }
      }
    }

    // Delete steps that are no longer present
    const newStepIds = steps.map(s => s.id).filter(id => id)
    const existingStepIds = Array.from(existingStepsMap.keys())
    const stepsToDelete = existingStepIds.filter(id => !newStepIds.includes(id))
    
    for (const stepIdToDelete of stepsToDelete) {
      // Delete field options first
      queries.push({
        sql: 'DELETE FROM field_options WHERE field_id IN (SELECT id FROM form_fields WHERE step_id = ?)',
        params: [stepIdToDelete],
      })
      // Delete fields
      queries.push({
        sql: 'DELETE FROM form_fields WHERE step_id = ?',
        params: [stepIdToDelete],
      })
      // Delete step
      queries.push({
        sql: 'DELETE FROM form_steps WHERE id = ?',
        params: [stepIdToDelete],
      })
    }

    const result = await executeTransaction(queries)
    
    
    return result.success
  }

  // Delete form
  async delete() {
    const sql = 'DELETE FROM forms WHERE id = ?'
    const result = await executeQuery(sql, [this.id])
    return result.success
  }

  // Import form (create or update with full data)
  static async import(formData, userId) {
    const { id, title, steps, marketing, successModal } = formData

    // Validate required fields
    if (!title) {
      throw new Error('Le titre du formulaire est requis')
    }

    let form
    let operation = 'created'

    // Check if form ID is provided for update
    if (id) {
      // Try to find existing form
      const existingForm = await Form.findById(id)
      
      if (existingForm) {
        // Update existing form
        const updateData = {
          title: formData.title,
          description: formData.description,
          slug: formData.slug,
          status: formData.status || 'draft',
          allowMultipleSubmissions: formData.allowMultipleSubmissions !== undefined ? formData.allowMultipleSubmissions : true,
          requireAuthentication: formData.requireAuthentication !== undefined ? formData.requireAuthentication : false,
          theme: formData.theme || 'default',
          primaryColor: formData.primaryColor || '#3b82f6',
          notificationEmail: formData.notificationEmail,
          emailNotifications: formData.emailNotifications !== undefined ? formData.emailNotifications : false,
          successModal: successModal,
        }

        // Update form basic data
        const updateSuccess = await existingForm.update(updateData)
        if (!updateSuccess) {
          throw new Error('Échec de la mise à jour du formulaire')
        }

        // Update steps if provided
        if (steps && Array.isArray(steps)) {
          const stepsSuccess = await existingForm.updateSteps(steps)
          if (!stepsSuccess) {
            throw new Error('Échec de la mise à jour des étapes du formulaire')
          }
        }

        // Update marketing settings if provided
        if (marketing) {
          const marketingSuccess = await Form.saveMarketingSettings(id, marketing)
          if (!marketingSuccess) {
            throw new Error('Échec de la mise à jour des paramètres marketing')
          }
        }

        form = existingForm
        operation = 'updated'
      }
    }

    // Create new form if no ID provided or form not found
    if (!id || !form) {
      const newFormData = {
        title: formData.title,
        description: formData.description,
        slug: formData.slug || this.generateSlug(formData.title),
        status: formData.status || 'draft',
        allowMultipleSubmissions: formData.allowMultipleSubmissions !== undefined ? formData.allowMultipleSubmissions : true,
        requireAuthentication: formData.requireAuthentication !== undefined ? formData.requireAuthentication : false,
        theme: formData.theme || 'default',
        primaryColor: formData.primaryColor || '#3b82f6',
        notificationEmail: formData.notificationEmail,
        emailNotifications: formData.emailNotifications !== undefined ? formData.emailNotifications : false,
        userId: userId,
        steps: steps || [],
      }

      form = await Form.create(newFormData)

      if (!form) {
        throw new Error('Échec de la création du formulaire')
      }

      // Save marketing settings if provided
      if (marketing) {
        const marketingSuccess = await Form.saveMarketingSettings(form.id, marketing)
        if (!marketingSuccess) {
          console.warn('Failed to save marketing settings for new form:', form.id)
        }
      }

      operation = 'created'
    }

    // Get the final form with all data
    const finalForm = await Form.findById(form.id)

    return {
      form: finalForm,
      operation
    }
  }

  // Helper method to generate slug
  static generateSlug(title) {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-') +
      '-' +
      crypto.randomUUID().substring(0, 8)
    )
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      slug: this.slug,
      title: this.title,
      description: this.description,
      steps: this.steps,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      status: this.status,
      submissionsCount: this.submissionsCount,
      allowMultipleSubmissions: this.allowMultipleSubmissions,
      requireAuthentication: this.requireAuthentication,
      theme: this.theme,
      primaryColor: this.primaryColor,
      notificationEmail: this.notificationEmail,
      emailNotifications: this.emailNotifications,
      marketing: this.marketing,
      successModal: this.successModal,
    }
  }
}
