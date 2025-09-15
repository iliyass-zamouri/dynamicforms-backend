import { executeQuery, executeQueryRaw } from '../database/connection.js'
import { mapSubmissionDataToLabels } from '../utils/submissionMapper.js'

export class FormSubmission {
  constructor(data) {
    this.id = data.id
    this.formId = data.form_id
    this.userId = data.user_id
    this.submissionData = data.submission_data
    this.ipAddress = data.ip_address
    this.userAgent = data.user_agent
    this.submittedAt = data.submitted_at
  }

  // Create a new submission
  static async create(submissionData) {
    const { formId, userId, data, ipAddress, userAgent } = submissionData

    const submissionId = crypto.randomUUID()

    const sql = `
      INSERT INTO form_submissions (id, form_id, user_id, submission_data, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `

    const result = await executeQuery(sql, [
      submissionId,
      formId,
      userId,
      JSON.stringify(data),
      ipAddress,
      userAgent,
    ])

    if (result.success) {
      return await FormSubmission.findById(submissionId)
    }

    return null
  }

  // Find submission by ID
  static async findById(id) {
    const sql = 'SELECT * FROM form_submissions WHERE id = ?'
    const result = await executeQuery(sql, [id])

    if (result.success && result.data.length > 0) {
      return new FormSubmission(result.data[0])
    }

    return null
  }

  // Get submissions for a form
  static async findByFormId(formId, limit = 50, offset = 0) {
    // Ensure limit and offset are integers
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0

    const sql = `
      SELECT * FROM form_submissions
      WHERE form_id = ?
      ORDER BY submitted_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `

    const result = await executeQuery(sql, [formId])

    if (result.success) {
      return result.data.map((submission) => new FormSubmission(submission))
    }

    return []
  }

  // Get submissions for a user
  static async findByUserId(userId, limit = 50, offset = 0) {
    // Ensure limit and offset are integers
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0

    const sql = `
      SELECT fs.*, f.title as form_title, f.slug as form_slug
      FROM form_submissions fs
      JOIN forms f ON fs.form_id = f.id
      WHERE fs.user_id = ?
      ORDER BY fs.submitted_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `

    const result = await executeQuery(sql, [userId])

    if (result.success) {
      return result.data.map((submission) => {
        const formSubmission = new FormSubmission(submission)
        formSubmission.formTitle = submission.form_title
        formSubmission.formSlug = submission.form_slug
        return formSubmission
      })
    }

    return []
  }

  // Get all submissions (admin only)
  static async findAll(limit = 50, offset = 0) {
    // Ensure limit and offset are integers
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0

    const sql = `
      SELECT fs.*, f.title as form_title, f.slug as form_slug, u.name as user_name, u.email as user_email
      FROM form_submissions fs
      JOIN forms f ON fs.form_id = f.id
      LEFT JOIN users u ON fs.user_id = u.id
      ORDER BY fs.submitted_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `

    const result = await executeQuery(sql, [])

    if (result.success) {
      return result.data.map((submission) => {
        const formSubmission = new FormSubmission(submission)
        formSubmission.formTitle = submission.form_title
        formSubmission.formSlug = submission.form_slug
        formSubmission.userName = submission.user_name
        formSubmission.userEmail = submission.user_email
        return formSubmission
      })
    }

    return []
  }

  // Get submission statistics
  static async getStats(formId = null) {
    let sql, params

    if (formId) {
      sql = `
        SELECT
          COUNT(*) as total_submissions,
          COUNT(DISTINCT user_id) as unique_users,
          DATE(MIN(submitted_at)) as first_submission,
          DATE(MAX(submitted_at)) as last_submission
        FROM form_submissions
        WHERE form_id = ?
      `
      params = [formId]
    } else {
      sql = `
        SELECT
          COUNT(*) as total_submissions,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT form_id) as total_forms,
          DATE(MIN(submitted_at)) as first_submission,
          DATE(MAX(submitted_at)) as last_submission
        FROM form_submissions
      `
      params = []
    }

    const result = await executeQuery(sql, params)

    if (result.success && result.data.length > 0) {
      return result.data[0]
    }

    return {
      total_submissions: 0,
      unique_users: 0,
      total_forms: 0,
      first_submission: null,
      last_submission: null,
    }
  }

  // Get submissions by date range
  static async findByDateRange(formId, startDate, endDate, limit = 50, offset = 0) {
    // Ensure limit and offset are integers
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0

    const sql = `
      SELECT * FROM form_submissions
      WHERE form_id = ?
      AND submitted_at >= ?
      AND submitted_at <= ?
      ORDER BY submitted_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `

    const result = await executeQuery(sql, [formId, startDate, endDate])

    if (result.success) {
      return result.data.map((submission) => new FormSubmission(submission))
    }

    return []
  }

  // Delete submission
  async delete() {
    const sql = 'DELETE FROM form_submissions WHERE id = ?'
    const result = await executeQuery(sql, [this.id])
    return result.success
  }

  // Convert to JSON with field labels instead of IDs
  toJSON(form = null) {
    const data = form ? mapSubmissionDataToLabels(this.submissionData, form) : this.submissionData

    return {
      id: this.id,
      formId: this.formId,
      userId: this.userId,
      data: data,
      submittedAt: this.submittedAt,
    }
  }

  // Convert to JSON with original field IDs (for backward compatibility)
  toJSONWithIds() {
    return {
      id: this.id,
      formId: this.formId,
      userId: this.userId,
      data: this.submissionData,
      submittedAt: this.submittedAt,
    }
  }
}
