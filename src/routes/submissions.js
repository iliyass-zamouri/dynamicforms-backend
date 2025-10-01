import express from 'express'
import { FormSubmission } from '../models/FormSubmission.js'
import { Form } from '../models/Form.js'
import { SubscriptionService } from '../services/subscriptionService.js'
import { FormAnalyticsService } from '../services/formAnalyticsService.js'
import {
  validateFormSubmission,
  validateSubmissionId,
  validatePagination,
} from '../middleware/validation.js'
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js'
import { 
  checkSubscriptionLimits, 
  trackSubscriptionUsage, 
  addSubscriptionContext 
} from '../middleware/subscriptionValidation.js'
import { sendSubmissionNotification } from '../utils/email.js'

const router = express.Router()

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     summary: Soumettre un formulaire
 *     tags: [Submissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - formId
 *               - data
 *             properties:
 *               formId:
 *                 oneOf:
 *                   - type: integer
 *                     description: ID du formulaire
 *                     example: 1
 *                   - type: string
 *                     description: Slug du formulaire
 *                     example: "formulaire-contact-abc123"
 *               data:
 *                 type: object
 *                 description: Données soumises du formulaire
 *                 example:
 *                   name: "Jean Dupont"
 *                   email: "jean.dupont@example.com"
 *                   message: "Bonjour, je souhaite vous contacter"
 *     security: []
 *     responses:
 *       201:
 *         description: Formulaire soumis avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         submission:
 *                           $ref: '#/components/schemas/FormSubmission'
 *       400:
 *         description: Données de soumission invalides ou formulaire inactif
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentification requise pour ce formulaire
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Formulaire non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Submit form
router.post('/', 
  optionalAuth, 
  addSubscriptionContext,
  validateFormSubmission, 
  async (req, res) => {
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

    // Check subscription limits for form owner (if authenticated)
    if (req.user && req.user.id === form.userId) {
      const limitCheck = await SubscriptionService.checkSubscriptionLimits(
        req.user.id,
        'create_submission',
        form.id
      )

      if (!limitCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: `Limite de soumissions atteinte pour ce formulaire. Limite: ${limitCheck.limit}, Actuel: ${limitCheck.current}`,
          data: {
            limitCheck,
            upgradeOptions: await SubscriptionService.getAvailableAccountTypes(req.user.id)
          }
        })
      }
    }

    if (form.status !== 'active') {
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

    // Check if user can create more submissions for this form (if authenticated)
    if (req.user) {
      const canCreateSubmission = await req.user.canCreateSubmission(form.id)
      
      if (!canCreateSubmission) {
        const preferences = await req.user.getPreferences()
        return res.status(403).json({
          success: false,
          message: `Limite de soumissions atteinte pour ce formulaire. Votre plan ${preferences.accountType} permet ${preferences.maxSubmissionsPerForm} soumissions maximum par formulaire.`,
          data: {
            limit: preferences.maxSubmissionsPerForm,
            accountType: preferences.accountType
          }
        })
      }
    }

    // Generate session ID if not provided
    const sessionId = req.body.sessionId || FormAnalyticsService.generateSessionId()

    // Start submission session tracking
    const deviceInfo = FormAnalyticsService.parseUserAgent(req.get('User-Agent'))
    const sessionData = {
      formId: form.id,
      userId: req.user?.id || null,
      sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer'),
      ...deviceInfo
    }

    const submissionSession = await FormAnalyticsService.startSubmissionSession(sessionData)

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

    // Complete submission session tracking
    if (submissionSession) {
      const sessionStats = {
        totalTimeSpentMs: req.body.sessionStats?.totalTimeSpentMs || 0,
        totalStepsCompleted: req.body.sessionStats?.totalStepsCompleted || 0,
        totalFieldInteractions: req.body.sessionStats?.totalFieldInteractions || 0,
        totalValidationErrors: req.body.sessionStats?.totalValidationErrors || 0
      }

      await FormAnalyticsService.completeSubmissionSession(
        sessionId,
        submission.id,
        sessionStats
      )
    }

    // Send email notification if configured
    try {
      if (form.emailNotifications && form.notificationEmail) {
        await sendSubmissionNotification(form, submission)
      }
    } catch (e) {
      console.error('Submission notification failed:', e)
    }

    res.status(201).json({
      success: true,
      message: 'Formulaire soumis avec succès',
      data: {
        submission: submission.toJSON(),
        sessionId: sessionId
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

/**
 * @swagger
 * /api/submissions:
 *   get:
 *     summary: Obtenir toutes les soumissions (admin uniquement)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Décalage de pagination
 *     responses:
 *       200:
 *         description: Soumissions récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         submissions:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/FormSubmission'
 *       401:
 *         description: Token d'authentification invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès refusé (admin requis)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/submissions/{id}:
 *   get:
 *     summary: Obtenir une soumission par son ID
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la soumission
 *     responses:
 *       200:
 *         description: Soumission récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         submission:
 *                           $ref: '#/components/schemas/FormSubmission'
 *       401:
 *         description: Token d'authentification invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès refusé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Soumission non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/submissions/user/my-submissions:
 *   get:
 *     summary: Obtenir les soumissions de l'utilisateur connecté
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Décalage de pagination
 *     responses:
 *       200:
 *         description: Soumissions de l'utilisateur récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         submissions:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/FormSubmission'
 *       401:
 *         description: Token d'authentification invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/submissions/stats/overview:
 *   get:
 *     summary: Obtenir les statistiques générales des soumissions (admin uniquement)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         stats:
 *                           type: object
 *                           description: Statistiques générales
 *                           properties:
 *                             totalSubmissions:
 *                               type: integer
 *                               description: Nombre total de soumissions
 *                             submissionsToday:
 *                               type: integer
 *                               description: Soumissions aujourd'hui
 *                             submissionsThisWeek:
 *                               type: integer
 *                               description: Soumissions cette semaine
 *                             submissionsThisMonth:
 *                               type: integer
 *                               description: Soumissions ce mois
 *       401:
 *         description: Token d'authentification invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès refusé (admin requis)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/submissions/{id}:
 *   delete:
 *     summary: Supprimer une soumission (admin uniquement)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la soumission
 *     responses:
 *       200:
 *         description: Soumission supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Token d'authentification invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès refusé (admin requis)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Soumission non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
