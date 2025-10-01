import { executeQuery, executeQueryRaw, executeTransaction } from '../database/connection.js'
import crypto from 'crypto'

export class FormVisit {
  constructor(data) {
    this.id = data.id
    this.formId = data.form_id
    this.userId = data.user_id
    this.sessionId = data.session_id
    this.ipAddress = data.ip_address
    this.userAgent = data.user_agent
    this.referrer = data.referrer
    this.country = data.country
    this.city = data.city
    this.deviceType = data.device_type
    this.browser = data.browser
    this.os = data.os
    this.visitedAt = data.visited_at
  }

  // Create a new form visit
  static async create(visitData) {
    const {
      formId,
      userId = null,
      sessionId,
      ipAddress,
      userAgent,
      referrer = null,
      country = null,
      city = null,
      deviceType = 'desktop',
      browser = null,
      os = null
    } = visitData

    const visitId = crypto.randomUUID()

    const sql = `
      INSERT INTO form_visits (id, form_id, user_id, session_id, ip_address, user_agent, referrer, country, city, device_type, browser, os)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const result = await executeQuery(sql, [
      visitId,
      formId,
      userId,
      sessionId,
      ipAddress,
      userAgent,
      referrer,
      country,
      city,
      deviceType,
      browser,
      os
    ])

    if (result.success) {
      return await FormVisit.findById(visitId)
    }

    return null
  }

  // Find visit by ID
  static async findById(id) {
    const sql = 'SELECT * FROM form_visits WHERE id = ?'
    const result = await executeQuery(sql, [id])

    if (result.success && result.data.length > 0) {
      return new FormVisit(result.data[0])
    }

    return null
  }

  // Get visits for a form
  static async findByFormId(formId, limit = 100, offset = 0) {
    const limitNum = parseInt(limit) || 100
    const offsetNum = parseInt(offset) || 0

    const sql = `
      SELECT * FROM form_visits
      WHERE form_id = ?
      ORDER BY visited_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `

    const result = await executeQuery(sql, [formId])

    if (result.success) {
      return result.data.map((visit) => new FormVisit(visit))
    }

    return []
  }

  // Get visits by session
  static async findBySessionId(sessionId) {
    const sql = 'SELECT * FROM form_visits WHERE session_id = ? ORDER BY visited_at ASC'
    const result = await executeQuery(sql, [sessionId])

    if (result.success) {
      return result.data.map((visit) => new FormVisit(visit))
    }

    return []
  }

  // Get visit statistics for a form
  static async getStats(formId, startDate = null, endDate = null) {
    let sql = `
      SELECT
        COUNT(*) as total_visits,
        COUNT(DISTINCT user_id) as unique_logged_users,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT CASE WHEN device_type = 'desktop' THEN session_id END) as desktop_visits,
        COUNT(DISTINCT CASE WHEN device_type = 'mobile' THEN session_id END) as mobile_visits,
        COUNT(DISTINCT CASE WHEN device_type = 'tablet' THEN session_id END) as tablet_visits,
        DATE(MIN(visited_at)) as first_visit,
        DATE(MAX(visited_at)) as last_visit
      FROM form_visits
      WHERE form_id = ?
    `
    const params = [formId]

    if (startDate && endDate) {
      sql += ' AND visited_at >= ? AND visited_at <= ?'
      params.push(startDate, endDate)
    }

    const result = await executeQuery(sql, params)

    if (result.success && result.data.length > 0) {
      return result.data[0]
    }

    return {
      total_visits: 0,
      unique_logged_users: 0,
      unique_sessions: 0,
      desktop_visits: 0,
      mobile_visits: 0,
      tablet_visits: 0,
      first_visit: null,
      last_visit: null
    }
  }

  // Get aggregated visits across all forms
  static async getStatsForAll(startDate = null, endDate = null, userId = null) {
    let sql, params = []

    if (userId) {
      // Filter by form owner
      sql = `
        SELECT
          COUNT(*) as total_visits,
          COUNT(DISTINCT fv.session_id) as unique_sessions,
          DATE(MIN(fv.visited_at)) as first_visit,
          DATE(MAX(fv.visited_at)) as last_visit
        FROM form_visits fv
        INNER JOIN forms f ON fv.form_id = f.id
        WHERE f.user_id = ?
      `
      params.push(userId)
    } else {
      sql = `
        SELECT
          COUNT(*) as total_visits,
          COUNT(DISTINCT session_id) as unique_sessions,
          DATE(MIN(visited_at)) as first_visit,
          DATE(MAX(visited_at)) as last_visit
        FROM form_visits
        WHERE 1=1
      `
    }

    if (startDate && endDate) {
      sql += userId ? ' AND fv.visited_at >= ? AND fv.visited_at <= ?' : ' AND visited_at >= ? AND visited_at <= ?'
      params.push(startDate, endDate)
    }

    const result = await executeQuery(sql, params)

    if (result.success && result.data.length > 0) {
      return result.data[0]
    }

    return {
      total_visits: 0,
      unique_sessions: 0,
      first_visit: null,
      last_visit: null
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      formId: this.formId,
      userId: this.userId,
      sessionId: this.sessionId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      referrer: this.referrer,
      country: this.country,
      city: this.city,
      deviceType: this.deviceType,
      browser: this.browser,
      os: this.os,
      visitedAt: this.visitedAt
    }
  }
}

export class FormStepTracking {
  constructor(data) {
    this.id = data.id
    this.formId = data.form_id
    this.stepId = data.step_id
    this.sessionId = data.session_id
    this.userId = data.user_id
    this.stepOrder = data.step_order
    this.timeSpentMs = data.time_spent_ms
    this.fieldInteractions = data.field_interactions
    this.validationErrors = data.validation_errors
    this.stepStartedAt = data.step_started_at
    this.stepCompletedAt = data.step_completed_at
  }

  // Create a new step tracking record
  static async create(trackingData) {
    const {
      formId,
      stepId,
      sessionId,
      userId = null,
      stepOrder,
      timeSpentMs = 0,
      fieldInteractions = 0,
      validationErrors = 0
    } = trackingData

    const trackingId = crypto.randomUUID()

    const sql = `
      INSERT INTO form_step_tracking (id, form_id, step_id, session_id, user_id, step_order, time_spent_ms, field_interactions, validation_errors)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const result = await executeQuery(sql, [
      trackingId,
      formId,
      stepId,
      sessionId,
      userId,
      stepOrder,
      timeSpentMs,
      fieldInteractions,
      validationErrors
    ])

    if (result.success) {
      return await FormStepTracking.findById(trackingId)
    }

    return null
  }

  // Find step tracking by ID
  static async findById(id) {
    const sql = 'SELECT * FROM form_step_tracking WHERE id = ?'
    const result = await executeQuery(sql, [id])

    if (result.success && result.data.length > 0) {
      return new FormStepTracking(result.data[0])
    }

    return null
  }

  // Update step tracking
  async update(updateData) {
    const allowedFields = [
      'timeSpentMs',
      'fieldInteractions',
      'validationErrors',
      'stepCompletedAt'
    ]

    const updates = []
    const values = []

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        const dbField = key === 'timeSpentMs' ? 'time_spent_ms' :
                       key === 'fieldInteractions' ? 'field_interactions' :
                       key === 'validationErrors' ? 'validation_errors' :
                       key === 'stepCompletedAt' ? 'step_completed_at' : key

        updates.push(`${dbField} = ?`)
        values.push(value)
      }
    }

    if (updates.length === 0) {
      return false
    }

    values.push(this.id)
    const sql = `UPDATE form_step_tracking SET ${updates.join(', ')} WHERE id = ?`

    const result = await executeQuery(sql, values)
    return result.success
  }

  // Complete step tracking
  async complete() {
    return await this.update({
      stepCompletedAt: new Date()
    })
  }

  // Get step tracking for a form
  static async findByFormId(formId, limit = 100, offset = 0) {
    const limitNum = parseInt(limit) || 100
    const offsetNum = parseInt(offset) || 0

    const sql = `
      SELECT fst.*, fs.title as step_title
      FROM form_step_tracking fst
      JOIN form_steps fs ON fst.step_id = fs.id
      WHERE fst.form_id = ?
      ORDER BY fst.step_started_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `

    const result = await executeQuery(sql, [formId])

    if (result.success) {
      return result.data.map((tracking) => {
        const stepTracking = new FormStepTracking(tracking)
        stepTracking.stepTitle = tracking.step_title
        return stepTracking
      })
    }

    return []
  }

  // Get step statistics for a form
  static async getStepStats(formId, stepId = null, startDate = null, endDate = null) {
    let sql = `
      SELECT
        fst.step_id,
        fs.step_order,
        COUNT(*) as total_visits,
        COUNT(DISTINCT fst.user_id) as unique_logged_users,
        COUNT(DISTINCT fst.session_id) as unique_sessions,
        AVG(fst.time_spent_ms) as avg_time_spent_ms,
        AVG(fst.field_interactions) as avg_field_interactions,
        AVG(fst.validation_errors) as avg_validation_errors,
        COUNT(CASE WHEN fst.step_completed_at IS NOT NULL THEN 1 END) as completed_steps,
        COUNT(CASE WHEN fst.step_completed_at IS NULL THEN 1 END) as abandoned_steps
      FROM form_step_tracking fst
      JOIN form_steps fs ON fst.step_id = fs.id
      WHERE fst.form_id = ?
    `
    const params = [formId]

    if (stepId) {
      sql += ' AND fst.step_id = ?'
      params.push(stepId)
    }

    // Add date filtering if provided
    if (startDate) {
      sql += ' AND fst.step_started_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      sql += ' AND fst.step_started_at <= ?'
      params.push(endDate)
    }

    sql += ' GROUP BY fst.step_id, fs.step_order ORDER BY fs.step_order'

    const result = await executeQuery(sql, params)

    if (result.success) {
      return result.data.map((stat) => ({
        stepId: stat.step_id,
        totalVisits: stat.total_visits,
        uniqueLoggedUsers: stat.unique_logged_users,
        uniqueSessions: stat.unique_sessions,
        avgTimeSpentMs: Math.round(stat.avg_time_spent_ms || 0),
        avgFieldInteractions: Math.round(stat.avg_field_interactions || 0),
        avgValidationErrors: Math.round(stat.avg_validation_errors || 0),
        completedSteps: stat.completed_steps,
        abandonedSteps: stat.abandoned_steps,
        completionRate: stat.total_visits > 0 ? 
          Math.round((stat.completed_steps / stat.total_visits) * 100) : 0
      }))
    }

    return []
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      formId: this.formId,
      stepId: this.stepId,
      sessionId: this.sessionId,
      userId: this.userId,
      stepOrder: this.stepOrder,
      timeSpentMs: this.timeSpentMs,
      fieldInteractions: this.fieldInteractions,
      validationErrors: this.validationErrors,
      stepStartedAt: this.stepStartedAt,
      stepCompletedAt: this.stepCompletedAt,
      stepTitle: this.stepTitle
    }
  }
}

export class FormFieldInteraction {
  constructor(data) {
    this.id = data.id
    this.formId = data.form_id
    this.stepId = data.step_id
    this.fieldId = data.field_id
    this.sessionId = data.session_id
    this.userId = data.user_id
    this.interactionType = data.interaction_type
    this.fieldValueLength = data.field_value_length
    this.timeSpentMs = data.time_spent_ms
    this.interactionData = data.interaction_data
    this.createdAt = data.created_at
  }

  // Create a new field interaction
  static async create(interactionData) {
    const {
      formId,
      stepId,
      fieldId,
      sessionId,
      userId = null,
      interactionType,
      fieldValueLength = 0,
      timeSpentMs = 0,
      interactionData: additionalData = null
    } = interactionData

    const interactionId = crypto.randomUUID()

    const sql = `
      INSERT INTO form_field_interactions (id, form_id, step_id, field_id, session_id, user_id, interaction_type, field_value_length, time_spent_ms, interaction_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const result = await executeQuery(sql, [
      interactionId,
      formId,
      stepId,
      fieldId,
      sessionId,
      userId,
      interactionType,
      fieldValueLength,
      timeSpentMs,
      additionalData ? JSON.stringify(additionalData) : null
    ])

    if (result.success) {
      return await FormFieldInteraction.findById(interactionId)
    }

    return null
  }

  // Find field interaction by ID
  static async findById(id) {
    const sql = 'SELECT * FROM form_field_interactions WHERE id = ?'
    const result = await executeQuery(sql, [id])

    if (result.success && result.data.length > 0) {
      return new FormFieldInteraction(result.data[0])
    }

    return null
  }

  // Get field interactions for a form
  static async findByFormId(formId, limit = 100, offset = 0) {
    const limitNum = parseInt(limit) || 100
    const offsetNum = parseInt(offset) || 0

    const sql = `
      SELECT ffi.*, ff.label as field_label, ff.field_type, fs.title as step_title
      FROM form_field_interactions ffi
      JOIN form_fields ff ON ffi.field_id = ff.id
      JOIN form_steps fs ON ffi.step_id = fs.id
      WHERE ffi.form_id = ?
      ORDER BY ffi.created_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `

    const result = await executeQuery(sql, [formId])

    if (result.success) {
      return result.data.map((interaction) => {
        const fieldInteraction = new FormFieldInteraction(interaction)
        fieldInteraction.fieldLabel = interaction.field_label
        fieldInteraction.fieldType = interaction.field_type
        fieldInteraction.stepTitle = interaction.step_title
        return fieldInteraction
      })
    }

    return []
  }

  // Get field statistics for a form
  static async getFieldStats(formId, fieldId = null, startDate = null, endDate = null) {
    let sql = `
      SELECT
        field_id,
        ff.label as field_label,
        ff.field_type,
        COUNT(*) as total_interactions,
        COUNT(DISTINCT user_id) as unique_logged_users,
        COUNT(DISTINCT session_id) as unique_sessions,
        AVG(time_spent_ms) as avg_time_spent_ms,
        AVG(field_value_length) as avg_value_length,
        COUNT(CASE WHEN interaction_type = 'validation_error' THEN 1 END) as validation_errors,
        COUNT(CASE WHEN interaction_type = 'validation_success' THEN 1 END) as validation_successes
      FROM form_field_interactions ffi
      JOIN form_fields ff ON ffi.field_id = ff.id
      WHERE ffi.form_id = ?
    `
    const params = [formId]

    if (fieldId) {
      sql += ' AND field_id = ?'
      params.push(fieldId)
    }

    // Add date filtering if provided
    if (startDate) {
      sql += ' AND ffi.created_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      sql += ' AND ffi.created_at <= ?'
      params.push(endDate)
    }

    sql += ' GROUP BY field_id, ff.label, ff.field_type, ff.field_order ORDER BY ff.field_order'

    const result = await executeQuery(sql, params)

    if (result.success) {
      return result.data.map((stat) => ({
        fieldId: stat.field_id,
        fieldLabel: stat.field_label,
        fieldType: stat.field_type,
        totalInteractions: stat.total_interactions,
        uniqueLoggedUsers: stat.unique_logged_users,
        uniqueSessions: stat.unique_sessions,
        avgTimeSpentMs: Math.round(stat.avg_time_spent_ms || 0),
        avgValueLength: Math.round(stat.avg_value_length || 0),
        validationErrors: stat.validation_errors,
        validationSuccesses: stat.validation_successes,
        errorRate: stat.total_interactions > 0 ? 
          Math.round((stat.validation_errors / stat.total_interactions) * 100) : 0
      }))
    }

    return []
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      formId: this.formId,
      stepId: this.stepId,
      fieldId: this.fieldId,
      sessionId: this.sessionId,
      userId: this.userId,
      interactionType: this.interactionType,
      fieldValueLength: this.fieldValueLength,
      timeSpentMs: this.timeSpentMs,
      interactionData: this.interactionData,
      createdAt: this.createdAt,
      fieldLabel: this.fieldLabel,
      fieldType: this.fieldType,
      stepTitle: this.stepTitle
    }
  }
}

export class FormSubmissionSession {
  constructor(data) {
    this.id = data.id
    this.formId = data.form_id
    this.userId = data.user_id
    this.sessionId = data.session_id
    this.submissionId = data.submission_id
    this.ipAddress = data.ip_address
    this.userAgent = data.user_agent
    this.referrer = data.referrer
    this.country = data.country
    this.city = data.city
    this.deviceType = data.device_type
    this.browser = data.browser
    this.os = data.os
    this.totalTimeSpentMs = data.total_time_spent_ms
    this.totalStepsCompleted = data.total_steps_completed
    this.totalFieldInteractions = data.total_field_interactions
    this.totalValidationErrors = data.total_validation_errors
    this.sessionStartedAt = data.session_started_at
    this.sessionCompletedAt = data.session_completed_at
    this.submissionCompleted = data.submission_completed
    this.abandonedAtStep = data.abandoned_at_step
  }

  // Create a new submission session
  static async create(sessionData) {
    const {
      formId,
      userId = null,
      sessionId,
      ipAddress,
      userAgent,
      referrer = null,
      country = null,
      city = null,
      deviceType = 'desktop',
      browser = null,
      os = null
    } = sessionData

    const sessionRecordId = crypto.randomUUID()

    const sql = `
      INSERT INTO form_submission_sessions (id, form_id, user_id, session_id, ip_address, user_agent, referrer, country, city, device_type, browser, os)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const result = await executeQuery(sql, [
      sessionRecordId,
      formId,
      userId,
      sessionId,
      ipAddress,
      userAgent,
      referrer,
      country,
      city,
      deviceType,
      browser,
      os
    ])

    if (result.success) {
      return await FormSubmissionSession.findById(sessionRecordId)
    }

    return null
  }

  // Find submission session by ID
  static async findById(id) {
    const sql = 'SELECT * FROM form_submission_sessions WHERE id = ?'
    const result = await executeQuery(sql, [id])

    if (result.success && result.data.length > 0) {
      return new FormSubmissionSession(result.data[0])
    }

    return null
  }

  // Find submission session by session ID
  static async findBySessionId(sessionId) {
    const sql = 'SELECT * FROM form_submission_sessions WHERE session_id = ?'
    const result = await executeQuery(sql, [sessionId])

    if (result.success && result.data.length > 0) {
      return new FormSubmissionSession(result.data[0])
    }

    return null
  }

  // Update submission session
  async update(updateData) {
    const allowedFields = [
      'submissionId',
      'totalTimeSpentMs',
      'totalStepsCompleted',
      'totalFieldInteractions',
      'totalValidationErrors',
      'sessionCompletedAt',
      'submissionCompleted',
      'abandonedAtStep'
    ]

    const updates = []
    const values = []

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        const dbField = key === 'submissionId' ? 'submission_id' :
                       key === 'totalTimeSpentMs' ? 'total_time_spent_ms' :
                       key === 'totalStepsCompleted' ? 'total_steps_completed' :
                       key === 'totalFieldInteractions' ? 'total_field_interactions' :
                       key === 'totalValidationErrors' ? 'total_validation_errors' :
                       key === 'sessionCompletedAt' ? 'session_completed_at' :
                       key === 'submissionCompleted' ? 'submission_completed' :
                       key === 'abandonedAtStep' ? 'abandoned_at_step' : key

        updates.push(`${dbField} = ?`)
        values.push(value)
      }
    }

    if (updates.length === 0) {
      return false
    }

    values.push(this.id)
    const sql = `UPDATE form_submission_sessions SET ${updates.join(', ')} WHERE id = ?`

    const result = await executeQuery(sql, values)
    return result.success
  }

  // Complete submission session
  async complete(submissionId = null) {
    return await this.update({
      submissionId,
      sessionCompletedAt: new Date().toISOString(),
      submissionCompleted: true
    })
  }

  // Abandon session at specific step
  async abandon(stepNumber) {
    return await this.update({
      sessionCompletedAt: new Date().toISOString(),
      submissionCompleted: false,
      abandonedAtStep: stepNumber
    })
  }

  // Get submission sessions for a form
  static async findByFormId(formId, limit = 100, offset = 0) {
    const limitNum = parseInt(limit) || 100
    const offsetNum = parseInt(offset) || 0

    const sql = `
      SELECT * FROM form_submission_sessions
      WHERE form_id = ?
      ORDER BY session_started_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `

    const result = await executeQuery(sql, [formId])

    if (result.success) {
      return result.data.map((session) => new FormSubmissionSession(session))
    }

    return []
  }

  // Get session statistics for a form
  static async getSessionStats(formId, startDate = null, endDate = null) {
    let sql = `
      SELECT
        COUNT(*) as total_sessions,
        COUNT(DISTINCT user_id) as unique_logged_users,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(CASE WHEN submission_completed = TRUE THEN 1 END) as completed_sessions,
        COUNT(CASE WHEN submission_completed = FALSE THEN 1 END) as abandoned_sessions,
        AVG(total_time_spent_ms) as avg_session_duration_ms,
        AVG(total_steps_completed) as avg_steps_completed,
        AVG(total_field_interactions) as avg_field_interactions,
        AVG(total_validation_errors) as avg_validation_errors,
        COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop_sessions,
        COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile_sessions,
        COUNT(CASE WHEN device_type = 'tablet' THEN 1 END) as tablet_sessions
      FROM form_submission_sessions
      WHERE form_id = ?
    `
    const params = [formId]

    if (startDate && endDate) {
      sql += ' AND session_started_at >= ? AND session_started_at <= ?'
      params.push(startDate, endDate)
    }

    const result = await executeQuery(sql, params)

    if (result.success && result.data.length > 0) {
      const stats = result.data[0]
      return {
        totalSessions: stats.total_sessions,
        uniqueLoggedUsers: stats.unique_logged_users,
        uniqueSessions: stats.unique_sessions,
        completedSessions: stats.completed_sessions,
        abandonedSessions: stats.abandoned_sessions,
        avgSessionDurationMs: Math.round(stats.avg_session_duration_ms || 0),
        avgStepsCompleted: Math.round(stats.avg_steps_completed || 0),
        avgFieldInteractions: Math.round(stats.avg_field_interactions || 0),
        avgValidationErrors: Math.round(stats.avg_validation_errors || 0),
        desktopSessions: stats.desktop_sessions,
        mobileSessions: stats.mobile_sessions,
        tabletSessions: stats.tablet_sessions,
        conversionRate: stats.total_sessions > 0 ? 
          Math.round((stats.completed_sessions / stats.total_sessions) * 100) : 0
      }
    }

    return {
      totalSessions: 0,
      uniqueLoggedUsers: 0,
      uniqueSessions: 0,
      completedSessions: 0,
      abandonedSessions: 0,
      avgSessionDurationMs: 0,
      avgStepsCompleted: 0,
      avgFieldInteractions: 0,
      avgValidationErrors: 0,
      desktopSessions: 0,
      mobileSessions: 0,
      tabletSessions: 0,
      conversionRate: 0
    }
  }

  // Get aggregated session stats across all forms
  static async getGlobalSessionStats(startDate = null, endDate = null, userId = null) {
    let sql, params = []

    if (userId) {
      // Filter by form owner
      sql = `
        SELECT
          COUNT(*) as total_sessions,
          COUNT(DISTINCT fss.session_id) as unique_sessions,
          COUNT(CASE WHEN fss.submission_completed = TRUE THEN 1 END) as completed_sessions,
          COUNT(CASE WHEN fss.submission_completed = FALSE THEN 1 END) as abandoned_sessions,
          AVG(fss.total_time_spent_ms) as avg_session_duration_ms
        FROM form_submission_sessions fss
        INNER JOIN forms f ON fss.form_id = f.id
        WHERE f.user_id = ?
      `
      params.push(userId)
    } else {
      sql = `
        SELECT
          COUNT(*) as total_sessions,
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(CASE WHEN submission_completed = TRUE THEN 1 END) as completed_sessions,
          COUNT(CASE WHEN submission_completed = FALSE THEN 1 END) as abandoned_sessions,
          AVG(total_time_spent_ms) as avg_session_duration_ms
        FROM form_submission_sessions
        WHERE 1=1
      `
    }

    if (startDate && endDate) {
      sql += userId ? ' AND fss.session_started_at >= ? AND fss.session_started_at <= ?' : ' AND session_started_at >= ? AND session_started_at <= ?'
      params.push(startDate, endDate)
    }

    const result = await executeQuery(sql, params)

    if (result.success && result.data.length > 0) {
      const stats = result.data[0]
      return {
        totalSessions: stats.total_sessions,
        uniqueSessions: stats.unique_sessions,
        completedSessions: stats.completed_sessions,
        abandonedSessions: stats.abandoned_sessions,
        avgSessionDurationMs: Math.round(stats.avg_session_duration_ms || 0),
        conversionRate: stats.total_sessions > 0 ?
          Math.round((stats.completed_sessions / stats.total_sessions) * 100) : 0
      }
    }

    return {
      totalSessions: 0,
      uniqueSessions: 0,
      completedSessions: 0,
      abandonedSessions: 0,
      avgSessionDurationMs: 0,
      conversionRate: 0
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      formId: this.formId,
      userId: this.userId,
      sessionId: this.sessionId,
      submissionId: this.submissionId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      referrer: this.referrer,
      country: this.country,
      city: this.city,
      deviceType: this.deviceType,
      browser: this.browser,
      os: this.os,
      totalTimeSpentMs: this.totalTimeSpentMs,
      totalStepsCompleted: this.totalStepsCompleted,
      totalFieldInteractions: this.totalFieldInteractions,
      totalValidationErrors: this.totalValidationErrors,
      sessionStartedAt: this.sessionStartedAt,
      sessionCompletedAt: this.sessionCompletedAt,
      submissionCompleted: this.submissionCompleted,
      abandonedAtStep: this.abandonedAtStep
    }
  }
}
