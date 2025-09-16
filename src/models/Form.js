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
          title,
          description || null,
          status,
          allowMultipleSubmissions,
          requireAuthentication,
          theme,
          primaryColor,
          notificationEmail || null,
          emailNotifications,
          userId,
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
          params: [stepId, formId, step.title, i],
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
                field.type,
                field.label,
                field.placeholder,
                field.required,
                j,
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
                  params: [fieldId, option.label, option.value, k],
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
  static async findByUserId(userId, limit = 50, offset = 0) {
    // Ensure we have valid numbers
    const limitNum = Number(limit) || 50
    const offsetNum = Number(offset) || 0

    const sql = `
      SELECT f.*, 0 as submissions_count
      FROM forms f
      WHERE f.user_id = ?
      ORDER BY f.updated_at DESC
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
  static async findAll(limit = 50, offset = 0) {
    // Ensure we have valid numbers
    const limitNum = Number(limit) || 50
    const offsetNum = Number(offset) || 0

    const sql = `
      SELECT f.*, 0 as submissions_count
      FROM forms f
      ORDER BY f.updated_at DESC
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
      return result.data.map((step) => ({
        id: step.id,
        title: step.title,
        fields: step.fields.filter((field) => field !== null),
      }))
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
        INSERT INTO marketing_settings (id, form_id, sidebar_title, sidebar_description, sidebar_logo, footer_text, social_media_enabled, social_media_title)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      params: [
        marketingId,
        formId,
        marketingData.sidebar.title || '',
        marketingData.sidebar.description || '',
        marketingData.sidebar.logo || '',
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

  // Update form
  async update(updateData) {
    const allowedFields = [
      'title',
      'description',
      'status',
      'allowMultipleSubmissions',
      'requireAuthentication',
      'theme',
      'primaryColor',
      'notificationEmail',
      'emailNotifications',
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
                    : key

        updates.push(`${dbField} = ?`)
        values.push(value)
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
    const queries = [
      {
        sql: 'DELETE FROM field_options WHERE field_id IN (SELECT id FROM form_fields WHERE step_id IN (SELECT id FROM form_steps WHERE form_id = ?))',
        params: [this.id],
      },
      {
        sql: 'DELETE FROM form_fields WHERE step_id IN (SELECT id FROM form_steps WHERE form_id = ?)',
        params: [this.id],
      },
      { sql: 'DELETE FROM form_steps WHERE form_id = ?', params: [this.id] },
    ]

    // Add new steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const stepId = crypto.randomUUID()

      queries.push({
        sql: 'INSERT INTO form_steps (id, form_id, title, step_order) VALUES (?, ?, ?, ?)',
        params: [stepId, this.id, step.title, i],
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
              field.type,
              field.label,
              field.placeholder,
              field.required,
              j,
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
                params: [fieldId, option.label, option.value, k],
              })
            }
          }
        }
      }
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
    }
  }
}
