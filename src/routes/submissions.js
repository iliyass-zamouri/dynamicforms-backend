import express from 'express'
import { FormSubmission } from '../models/FormSubmission.js'
import { Form } from '../models/Form.js'
import {
  validateFormSubmission,
  validateSubmissionId,
  validatePagination,
} from '../middleware/validation.js'
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// Submit form
router.post('/', optionalAuth, validateFormSubmission, async (req, res) => {
  try {
    const { formId, data } = req.body

    if (!formId) {
      return res.status(400).json({
        success: false,
        message: "L'ID du formulaire est requis",
      })
    }

    // Check if form exists and is active
    const form = (await Form.findBySlug(formId)) || (await Form.findById(formId))

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Formulaire non trouvé',
      })
    }

    if (!form.isActive || form.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: "Le formulaire n'est pas actif",
      })
    }

    // Check if authentication is required
    if (form.requireAuthentication && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise pour soumettre ce formulaire',
      })
    }

    // Check if multiple submissions are allowed
    if (!form.allowMultipleSubmissions && req.user) {
      const existingSubmissions = await FormSubmission.findByFormId(form.id)
      const userSubmissions = existingSubmissions.filter((sub) => sub.userId === req.user.id)

      if (userSubmissions.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Les soumissions multiples ne sont pas autorisées pour ce formulaire',
        })
      }
    }

    // Create submission
    const submission = await FormSubmission.create({
      formId: form.id,
      userId: req.user?.id || null,
      data,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    })

    if (!submission) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la soumission du formulaire',
      })
    }

    // TODO: Send email notification if configured
    // if (form.emailNotifications && form.notificationEmail) {
    //   await sendSubmissionNotification(form, submission);
    // }

    res.status(201).json({
      success: true,
      message: 'Formulaire soumis avec succès',
      data: {
        submission: submission.toJSON(),
      },
    })
  } catch (error) {
    console.error('Submit form error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Get all submissions (admin only)
router.get('/', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0
    const submissions = await FormSubmission.findAll(limitNum, offsetNum)

    // Get unique form IDs from submissions
    const formIds = [...new Set(submissions.map((sub) => sub.formId))]

    // Fetch all forms to get field definitions
    const forms = await Promise.all(formIds.map((formId) => Form.findById(formId)))

    // Create a map of formId to form for quick lookup
    const formMap = new Map()
    forms.forEach((form) => {
      if (form) {
        formMap.set(form.id, form)
      }
    })

    res.json({
      success: true,
      data: {
        submissions: submissions.map((submission) => {
          const form = formMap.get(submission.formId)
          return submission.toJSON(form)
        }),
      },
    })
  } catch (error) {
    console.error('Get submissions error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Get submission by ID
router.get('/:id', authenticateToken, validateSubmissionId, async (req, res) => {
  try {
    const { id } = req.params
    const submission = await FormSubmission.findById(id)

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Soumission non trouvée',
      })
    }

    // Get form to check ownership
    const form = await Form.findById(submission.formId)

    // Check if user owns the form, is the submitter, or is admin
    if (
      req.user.role !== 'admin' &&
      form.userId !== req.user.id &&
      submission.userId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      })
    }

    res.json({
      success: true,
      data: {
        submission: submission.toJSON(form),
      },
    })
  } catch (error) {
    console.error('Get submission error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Get user's submissions
router.get('/user/my-submissions', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0

    // Ensure limit and offset are positive integers
    if (limitNum < 0 || offsetNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Limit and offset must be positive numbers',
      })
    }

    const submissions = await FormSubmission.findByUserId(req.user.id, limitNum, offsetNum)

    // Get unique form IDs from submissions
    const formIds = [...new Set(submissions.map((sub) => sub.formId))]

    // Fetch all forms to get field definitions
    const forms = await Promise.all(formIds.map((formId) => Form.findById(formId)))

    // Create a map of formId to form for quick lookup
    const formMap = new Map()
    forms.forEach((form) => {
      if (form) {
        formMap.set(form.id, form)
      }
    })

    res.json({
      success: true,
      data: {
        submissions: submissions.map((submission) => {
          const form = formMap.get(submission.formId)
          return submission.toJSON(form)
        }),
      },
    })
  } catch (error) {
    console.error('Get user submissions error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Get submission statistics
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await FormSubmission.getStats()

    res.json({
      success: true,
      data: {
        stats,
      },
    })
  } catch (error) {
    console.error('Get submission stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Get submissions by date range
router.get('/stats/date-range', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { formId, startDate, endDate, limit = 50, offset = 0 } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'La date de début et la date de fin sont requises',
      })
    }

    const submissions = await FormSubmission.findByDateRange(
      formId,
      new Date(startDate),
      new Date(endDate),
      limitNum,
      offsetNum,
    )

    res.json({
      success: true,
      data: {
        submissions: submissions.map((submission) => submission.toJSON()),
      },
    })
  } catch (error) {
    console.error('Get submissions by date range error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Delete submission (admin only)
router.delete('/:id', authenticateToken, requireAdmin, validateSubmissionId, async (req, res) => {
  try {
    const { id } = req.params
    const submission = await FormSubmission.findById(id)

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Soumission non trouvée',
      })
    }

    const success = await submission.delete()

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la suppression de la soumission',
      })
    }

    res.json({
      success: true,
      message: 'Soumission supprimée avec succès',
    })
  } catch (error) {
    console.error('Delete submission error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

export default router
