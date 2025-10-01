import express from 'express'
import { User } from '../models/User.js'
import { Form } from '../models/Form.js'
import { Subscription } from '../models/Subscription.js'
import { UserPreferences } from '../models/UserPreferences.js'
import { executeQuery } from '../database/connection.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { sendErrorResponse } from '../utils/errorResponse.js'
import logger from '../utils/logger.js'

const router = express.Router()

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, user]
 *         description: Filter by role
 *       - in: query
 *         name: blocked
 *         schema:
 *           type: boolean
 *         description: Filter by blocked status
 *       - in: query
 *         name: email_verified
 *         schema:
 *           type: boolean
 *         description: Filter by email verification status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                         users:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/User'
 *                               - type: object
 *                                 properties:
 *                                   formsCount:
 *                                     type: integer
 *                                     description: Number of forms created by the user
 *                                   submissionsCount:
 *                                     type: integer
 *                                     description: Total number of submissions received across all user's forms
 *                                   subscriptionType:
 *                                     type: string
 *                                     nullable: true
 *                                     description: Name of the user's active subscription type
 *                                   subscriptionEnd:
 *                                     type: string
 *                                     format: date-time
 *                                     nullable: true
 *                                     description: End date of the user's active subscription
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       500:
 *         description: Server error
 */
// Get all users with pagination and filters
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      limit = 10, 
      page = 1, 
      search, 
      role, 
      blocked, 
      email_verified 
    } = req.query

    const limitNum = parseInt(limit) || 10
    const offset = (parseInt(page) - 1) * limitNum

    // Build WHERE clause
    let whereConditions = []
    let params = []

    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }

    if (role) {
      whereConditions.push('role = ?')
      params.push(role)
    }

    // Skip blocked and email_verified filters for now since columns might not exist
    // TODO: Re-enable these filters after migration is run
    /*
    if (blocked !== undefined) {
      if (blocked === 'true') {
        whereConditions.push('blocked_at IS NOT NULL')
      } else {
        whereConditions.push('blocked_at IS NULL')
      }
    }

    if (email_verified !== undefined) {
      if (email_verified === 'true') {
        whereConditions.push('email_verified_at IS NOT NULL')
      } else {
        whereConditions.push('email_verified_at IS NULL')
      }
    }
    */

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`
    const countResult = await executeQuery(countSql, params)
    const total = countResult.data[0]?.total || 0

    // Get users with additional counts and subscription info
    const usersSql = `
      SELECT 
        u.*,
        COALESCE(form_counts.forms_count, 0) as forms_count,
        COALESCE(submission_counts.submissions_count, 0) as submissions_count,
        s.status as subscription_status,
        s.end_date as subscription_end,
        at.name as subscription_type
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as forms_count 
        FROM forms 
        GROUP BY user_id
      ) form_counts ON u.id = form_counts.user_id
      LEFT JOIN (
        SELECT f.user_id, COUNT(fs.id) as submissions_count
        FROM forms f
        LEFT JOIN form_submissions fs ON f.id = fs.form_id
        GROUP BY f.user_id
      ) submission_counts ON u.id = submission_counts.user_id
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
      LEFT JOIN account_types at ON s.account_type_id = at.id
      ${whereClause}
      ORDER BY u.created_at DESC 
      LIMIT ? OFFSET ?
    `
    const usersResult = await executeQuery(usersSql, [...params, limitNum, offset])

    const users = usersResult.data.map(userData => {
      const user = new User(userData)
      // Add additional fields
      user.formsCount = userData.forms_count || 0
      user.submissionsCount = userData.submissions_count || 0
      user.subscriptionType = userData.subscription_type || null
      user.subscriptionEnd = userData.subscription_end || null
      return user
    })

    res.json({
      success: true,
      data: {
        users: users.map(user => user.toJSON()),
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    sendErrorResponse(res, error, req, 'Erreur interne du serveur', 500)
  }
})

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user by ID (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *                         user:
 *                           allOf:
 *                             - $ref: '#/components/schemas/User'
 *                             - type: object
 *                               properties:
 *                                 formsCount:
 *                                   type: integer
 *                                   description: Total number of forms created by the user
 *                                 submissionsCount:
 *                                   type: integer
 *                                   description: Total number of submissions received across all user's forms
 *                                 subscriptionType:
 *                                   type: string
 *                                   nullable: true
 *                                   description: Name of the user's active subscription type
 *                                 subscriptionEnd:
 *                                   type: string
 *                                   format: date-time
 *                                   nullable: true
 *                                   description: End date of the user's active subscription
 *                         forms:
 *                           type: array
 *                           description: User's forms with detailed information
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 description: Form ID
 *                               title:
 *                                 type: string
 *                                 description: Form title
 *                               slug:
 *                                 type: string
 *                                 description: Form slug
 *                               status:
 *                                 type: string
 *                                 enum: [active, inactive, draft]
 *                                 description: Form status
 *                               fieldCount:
 *                                 type: integer
 *                                 description: Number of fields in the form
 *                               stepsCount:
 *                                 type: integer
 *                                 description: Number of steps in the form
 *                               submissionsCount:
 *                                 type: integer
 *                                 description: Number of submissions received
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                                 description: Form creation date
 *                               updatedAt:
 *                                 type: string
 *                                 format: date-time
 *                                 description: Form last update date
 *                         subscription:
 *                           type: object
 *                           nullable: true
 *                           description: User's active subscription details
 *                           properties:
 *                             id:
 *                               type: string
 *                               description: Subscription ID
 *                             status:
 *                               type: string
 *                               enum: [active, inactive, cancelled, expired, suspended, pending]
 *                               description: Subscription status
 *                             billingCycle:
 *                               type: string
 *                               enum: [monthly, yearly]
 *                               description: Billing cycle
 *                             amount:
 *                               type: number
 *                               format: decimal
 *                               description: Subscription amount
 *                             currency:
 *                               type: string
 *                               description: Currency code
 *                             startDate:
 *                               type: string
 *                               format: date-time
 *                               description: Subscription start date
 *                             endDate:
 *                               type: string
 *                               format: date-time
 *                               description: Subscription end date
 *                             nextBillingDate:
 *                               type: string
 *                               format: date-time
 *                               description: Next billing date
 *                             isTrial:
 *                               type: boolean
 *                               description: Whether subscription is in trial
 *                             trialEndDate:
 *                               type: string
 *                               format: date-time
 *                               nullable: true
 *                               description: Trial end date
 *                             autoRenew:
 *                               type: boolean
 *                               description: Whether subscription auto-renews
 *                             accountType:
 *                               type: object
 *                               nullable: true
 *                               description: Account type details
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   description: Account type ID
 *                                 name:
 *                                   type: string
 *                                   description: Account type name
 *                                 displayName:
 *                                   type: string
 *                                   description: Account type display name
 *                                 description:
 *                                   type: string
 *                                   description: Account type description
 *                                 maxForms:
 *                                   type: integer
 *                                   description: Maximum forms allowed
 *                                 maxSubmissionsPerForm:
 *                                   type: integer
 *                                   description: Maximum submissions per form
 *                                 canExportForms:
 *                                   type: boolean
 *                                   description: Can export forms
 *                                 canExportSubmissions:
 *                                   type: boolean
 *                                   description: Can export submissions
 *                                 priceMonthly:
 *                                   type: number
 *                                   format: decimal
 *                                   description: Monthly price
 *                                 priceYearly:
 *                                   type: number
 *                                   format: decimal
 *                                   description: Yearly price
 *                         preferences:
 *                           type: object
 *                           nullable: true
 *                           description: User preferences and limits
 *                           properties:
 *                             id:
 *                               type: string
 *                               description: Preferences ID
 *                             userId:
 *                               type: string
 *                               description: User ID
 *                             accountType:
 *                               type: string
 *                               description: Account type name
 *                             maxForms:
 *                               type: integer
 *                               description: Maximum forms allowed
 *                             maxSubmissionsPerForm:
 *                               type: integer
 *                               description: Maximum submissions per form
 *                             canExportForms:
 *                               type: boolean
 *                               description: Can export forms
 *                             canExportSubmissions:
 *                               type: boolean
 *                               description: Can export submissions
 *                             maxExportsPerForm:
 *                               type: integer
 *                               description: Maximum exports per form
 *                             maxExportsPerSubmission:
 *                               type: integer
 *                               description: Maximum exports per submission
 *                             additionalPreferences:
 *                               type: object
 *                               description: Additional preferences
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *                               description: Preferences creation date
 *                             updatedAt:
 *                               type: string
 *                               format: date-time
 *                               description: Preferences last update date
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       500:
 *         description: Server error
 */
// Get user by ID
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    // Get user's forms with detailed information
    const forms = await Form.findByUserId(id, 100, 0) // Get up to 100 forms
    
    // Get forms with field counts, step counts and submission counts
    const formsWithDetails = await Promise.all(forms.map(async (form) => {
      // Get field count for this form
      const fieldCountSql = `
        SELECT COUNT(*) as field_count
        FROM form_fields ff
        JOIN form_steps fs ON ff.step_id = fs.id
        WHERE fs.form_id = ?
      `
      const fieldCountResult = await executeQuery(fieldCountSql, [form.id])
      const fieldCount = fieldCountResult.success ? fieldCountResult.data[0].field_count : 0

      // Get step count for this form
      const stepCountSql = `
        SELECT COUNT(*) as step_count
        FROM form_steps
        WHERE form_id = ?
      `
      const stepCountResult = await executeQuery(stepCountSql, [form.id])
      const stepCount = stepCountResult.success ? stepCountResult.data[0].step_count : 0

      return {
        id: form.id,
        title: form.title,
        slug: form.slug,
        status: form.status,
        fieldCount: fieldCount,
        stepsCount: stepCount,
        submissionsCount: form.submissionsCount,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt
      }
    }))

    // Get user's active subscription
    const activeSubscription = await Subscription.findActiveByUserId(id)
    let subscriptionDetails = null
    
    if (activeSubscription) {
      const accountType = await activeSubscription.getAccountType()
      subscriptionDetails = {
        id: activeSubscription.id,
        status: activeSubscription.status,
        billingCycle: activeSubscription.billingCycle,
        amount: activeSubscription.amount,
        currency: activeSubscription.currency,
        startDate: activeSubscription.startDate,
        endDate: activeSubscription.endDate,
        nextBillingDate: activeSubscription.nextBillingDate,
        isTrial: activeSubscription.isTrial,
        trialEndDate: activeSubscription.trialEndDate,
        autoRenew: activeSubscription.autoRenew,
        accountType: accountType ? {
          id: accountType.id,
          name: accountType.name,
          displayName: accountType.displayName,
          description: accountType.description,
          maxForms: accountType.maxForms,
          maxSubmissionsPerForm: accountType.maxSubmissionsPerForm,
          canExportForms: accountType.canExportForms,
          canExportSubmissions: accountType.canExportSubmissions,
          priceMonthly: accountType.priceMonthly,
          priceYearly: accountType.priceYearly
        } : null
      }
    }

    // Get user preferences
    const preferences = await user.getPreferences()

    // Calculate summary counts
    const totalFormsCount = formsWithDetails.length
    const totalSubmissionsCount = formsWithDetails.reduce((sum, form) => sum + form.submissionsCount, 0)
    
    // Add summary fields to user object
    const userWithSummary = {
      ...user.toJSON(),
      formsCount: totalFormsCount,
      submissionsCount: totalSubmissionsCount,
      subscriptionType: subscriptionDetails?.accountType?.name || null,
      subscriptionEnd: subscriptionDetails?.endDate || null
    }

    res.json({
      success: true,
      data: {
        user: userWithSummary,
        forms: formsWithDetails,
        subscription: subscriptionDetails,
        preferences: preferences ? preferences.toJSON() : null
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    sendErrorResponse(res, error, req, 'Erreur interne du serveur', 500)
  }
})

/**
 * @swagger
 * /api/admin/users/{id}/block:
 *   post:
 *     summary: Block user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User blocked successfully
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       500:
 *         description: Server error
 */
// Block user
router.post('/:id/block', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    if (user.isBlocked()) {
      return res.status(400).json({
        success: false,
        message: 'Utilisateur déjà bloqué',
      })
    }

    const success = await user.block()
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Échec du blocage de l\'utilisateur',
      })
    }

    logger.logInfo('User blocked', {
      userId: user.id,
      email: user.email,
      blockedBy: req.user.id,
    })

    res.json({
      success: true,
      message: 'Utilisateur bloqué avec succès',
      data: {
        user: user.toJSON(),
      },
    })
  } catch (error) {
    console.error('Block user error:', error)
    sendErrorResponse(res, error, req, 'Erreur interne du serveur', 500)
  }
})

/**
 * @swagger
 * /api/admin/users/{id}/unblock:
 *   post:
 *     summary: Unblock user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User unblocked successfully
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       500:
 *         description: Server error
 */
// Unblock user
router.post('/:id/unblock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    if (!user.isBlocked()) {
      return res.status(400).json({
        success: false,
        message: 'Utilisateur n\'est pas bloqué',
      })
    }

    const success = await user.unblock()
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Échec du déblocage de l\'utilisateur',
      })
    }

    logger.logInfo('User unblocked', {
      userId: user.id,
      email: user.email,
      unblockedBy: req.user.id,
    })

    res.json({
      success: true,
      message: 'Utilisateur débloqué avec succès',
      data: {
        user: user.toJSON(),
      },
    })
  } catch (error) {
    console.error('Unblock user error:', error)
    sendErrorResponse(res, error, req, 'Erreur interne du serveur', 500)
  }
})

/**
 * @swagger
 * /api/admin/users/{id}/verify-email:
 *   post:
 *     summary: Verify user email (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Email verified successfully
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       500:
 *         description: Server error
 */
// Verify user email
router.post('/:id/verify-email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    if (user.isEmailVerified()) {
      return res.status(400).json({
        success: false,
        message: 'Email déjà vérifié',
      })
    }

    const success = await user.verifyEmail()
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la vérification de l\'email',
      })
    }

    logger.logInfo('Email verified', {
      userId: user.id,
      email: user.email,
      verifiedBy: req.user.id,
    })

    res.json({
      success: true,
      message: 'Email vérifié avec succès',
      data: {
        user: user.toJSON(),
      },
    })
  } catch (error) {
    console.error('Verify email error:', error)
    sendErrorResponse(res, error, req, 'Erreur interne du serveur', 500)
  }
})

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: User name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 description: User role
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       500:
 *         description: Server error
 */
// Update user
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, role } = req.body

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email)
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé',
        })
      }
    }

    // Update user
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role

    const success = await user.update(updateData)
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la mise à jour de l\'utilisateur',
      })
    }

    logger.logInfo('User updated', {
      userId: user.id,
      email: user.email,
      updatedBy: req.user.id,
      changes: updateData,
    })

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: {
        user: user.toJSON(),
      },
    })
  } catch (error) {
    console.error('Update user error:', error)
    sendErrorResponse(res, error, req, 'Erreur interne du serveur', 500)
  }
})

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       500:
 *         description: Server error
 */
// Delete user
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte',
      })
    }

    const success = await user.delete()
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la suppression de l\'utilisateur',
      })
    }

    logger.logInfo('User deleted', {
      userId: user.id,
      email: user.email,
      deletedBy: req.user.id,
    })

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
    })
  } catch (error) {
    console.error('Delete user error:', error)
    sendErrorResponse(res, error, req, 'Erreur interne du serveur', 500)
  }
})

export default router
