import express from 'express'
import { UserPreferences } from '../models/UserPreferences.js'
import { User } from '../models/User.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { sendErrorResponse } from '../utils/errorResponse.js'
import logger from '../utils/logger.js'

const router = express.Router()

/**
 * @swagger
 * /api/preferences:
 *   get:
 *     summary: Get current user's preferences
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
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
 *                         preferences:
 *                           $ref: '#/components/schemas/UserPreferences'
 *       401:
 *         description: Invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get current user's preferences
router.get('/', authenticateToken, async (req, res) => {
  try {
    const preferences = await req.user.getPreferences()

    res.json({
      success: true,
      data: {
        preferences: preferences.toJSON(),
      },
    })
  } catch (error) {
    console.error('Get user preferences error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/preferences:
 *   put:
 *     summary: Update current user's preferences
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               additionalPreferences:
 *                 type: object
 *                 description: Additional preferences (only this field can be updated by regular users)
 *                 example:
 *                   theme: "dark"
 *                   notifications: true
 *                   language: "fr"
 *     responses:
 *       200:
 *         description: Preferences updated successfully
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
 *                         preferences:
 *                           $ref: '#/components/schemas/UserPreferences'
 *       400:
 *         description: Invalid preferences data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Update current user's preferences (limited to additionalPreferences for regular users)
router.put('/', authenticateToken, async (req, res) => {
  try {
    const preferences = await req.user.getPreferences()
    
    // Regular users can only update additionalPreferences
    const updateData = {
      additionalPreferences: req.body.additionalPreferences
    }

    const success = await preferences.update(updateData)

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update preferences',
      })
    }

    // Get updated preferences
    const updatedPreferences = await req.user.getPreferences()

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: updatedPreferences.toJSON(),
      },
    })
  } catch (error) {
    console.error('Update user preferences error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/preferences/admin:
 *   get:
 *     summary: Get all user preferences (admin only)
 *     tags: [Preferences]
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
 *         description: Number of items per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: All user preferences retrieved successfully
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
 *                         preferences:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/UserPreferences'
 *                               - type: object
 *                                 properties:
 *                                   user:
 *                                     type: object
 *                                     properties:
 *                                       name:
 *                                         type: string
 *                                         description: User's full name
 *                                       email:
 *                                         type: string
 *                                         description: User's email address
 *                                       role:
 *                                         type: string
 *                                         enum: [admin, user]
 *                                         description: User's role
 *                                       createdAt:
 *                                         type: string
 *                                         format: date-time
 *                                         description: User account creation date
 *       401:
 *         description: Invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied (admin required)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get all user preferences (admin only)
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0

    const preferences = await UserPreferences.findAll(limitNum, offsetNum)

    res.json({
      success: true,
      data: {
        preferences: preferences.map(pref => pref.toJSON()),
        pagination: {
          limit: limitNum,
          offset: offsetNum,
        }
      },
    })
  } catch (error) {
    console.error('Get all preferences error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/preferences/admin/{userId}:
 *   get:
 *     summary: Get specific user's preferences (admin only)
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
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
 *                         preferences:
 *                           $ref: '#/components/schemas/UserPreferences'
 *       401:
 *         description: Invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied (admin required)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User preferences not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get specific user's preferences (admin only)
router.get('/admin/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    const preferences = await user.getPreferences()

    res.json({
      success: true,
      data: {
        preferences: preferences.toJSON(),
      },
    })
  } catch (error) {
    console.error('Get user preferences by ID error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/preferences/admin/{userId}:
 *   put:
 *     summary: Update specific user's preferences (admin only)
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountType:
 *                 type: string
 *                 enum: [free, basic, premium, enterprise]
 *                 description: Account type
 *               maxForms:
 *                 type: integer
 *                 minimum: 0
 *                 description: Maximum number of forms
 *               maxSubmissionsPerForm:
 *                 type: integer
 *                 minimum: 0
 *                 description: Maximum submissions per form
 *               canExportForms:
 *                 type: boolean
 *                 description: Can export forms
 *               canExportSubmissions:
 *                 type: boolean
 *                 description: Can export submissions
 *               maxExportsPerForm:
 *                 type: integer
 *                 minimum: 0
 *                 description: Maximum exports per form
 *               maxExportsPerSubmission:
 *                 type: integer
 *                 minimum: 0
 *                 description: Maximum exports per submission
 *               additionalPreferences:
 *                 type: object
 *                 description: Additional preferences
 *     responses:
 *       200:
 *         description: Preferences updated successfully
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
 *                         preferences:
 *                           $ref: '#/components/schemas/UserPreferences'
 *       400:
 *         description: Invalid preferences data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied (admin required)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Update specific user's preferences (admin only)
router.put('/admin/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    const preferences = await user.getPreferences()

    // Validate the update data
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

    const updateData = {}
    for (const [key, value] of Object.entries(req.body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateData[key] = value
      }
    }

    // Validate account type
    if (updateData.accountType && !['free', 'basic', 'premium', 'enterprise'].includes(updateData.accountType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account type. Must be one of: free, basic, premium, enterprise',
      })
    }

    // Validate numeric fields
    const numericFields = ['maxForms', 'maxSubmissionsPerForm', 'maxExportsPerForm', 'maxExportsPerSubmission']
    for (const field of numericFields) {
      if (updateData[field] !== undefined && (typeof updateData[field] !== 'number' || updateData[field] < 0)) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a non-negative number`,
        })
      }
    }

    const success = await preferences.update(updateData)

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update preferences',
      })
    }

    // Get updated preferences
    const updatedPreferences = await user.getPreferences()

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: updatedPreferences.toJSON(),
      },
    })
  } catch (error) {
    console.error('Update user preferences by ID error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/preferences/admin/{userId}/reset:
 *   post:
 *     summary: Reset user's preferences to default (admin only)
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - in: query
 *         name: accountType
 *         schema:
 *           type: string
 *           enum: [free, basic, premium, enterprise]
 *           default: free
 *         description: Account type to reset to
 *     responses:
 *       200:
 *         description: Preferences reset successfully
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
 *                         preferences:
 *                           $ref: '#/components/schemas/UserPreferences'
 *       401:
 *         description: Invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied (admin required)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Reset user's preferences to default (admin only)
router.post('/admin/:userId/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { accountType = 'free' } = req.query

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    // Validate account type
    if (!['free', 'basic', 'premium', 'enterprise'].includes(accountType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account type. Must be one of: free, basic, premium, enterprise',
      })
    }

    // Get current preferences
    const currentPreferences = await user.getPreferences()
    
    // Get default preferences for the specified account type
    const defaultPreferences = UserPreferences.getDefaultPreferences(accountType)
    
    // Update preferences with default values
    const success = await currentPreferences.update({
      accountType: accountType,
      maxForms: defaultPreferences.maxForms,
      maxSubmissionsPerForm: defaultPreferences.maxSubmissionsPerForm,
      canExportForms: defaultPreferences.canExportForms,
      canExportSubmissions: defaultPreferences.canExportSubmissions,
      maxExportsPerForm: defaultPreferences.maxExportsPerForm,
      maxExportsPerSubmission: defaultPreferences.maxExportsPerSubmission,
      additionalPreferences: defaultPreferences.additionalPreferences
    })

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to reset preferences',
      })
    }

    // Get updated preferences
    const updatedPreferences = await user.getPreferences()

    res.json({
      success: true,
      message: `Preferences reset to ${accountType} defaults successfully`,
      data: {
        preferences: updatedPreferences.toJSON(),
      },
    })
  } catch (error) {
    console.error('Reset user preferences error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

export default router
