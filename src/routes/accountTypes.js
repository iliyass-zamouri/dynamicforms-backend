import express from 'express'
import { AccountType } from '../models/AccountType.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { sendErrorResponse } from '../utils/errorResponse.js'
import logger from '../utils/logger.js'

const router = express.Router()

/**
 * @swagger
 * /api/admin/account-types:
 *   get:
 *     summary: Get all account types
 *     tags: [Account Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive account types
 *     responses:
 *       200:
 *         description: Account types retrieved successfully
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
 *                         accountTypes:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/AccountType'
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
// Get all account types
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { includeInactive = false } = req.query
    const accountTypes = await AccountType.findAll(includeInactive === 'true')

    res.json({
      success: true,
      data: {
        accountTypes: accountTypes.map(type => type.toJSON()),
      },
    })
  } catch (error) {
    console.error('Get account types error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/admin/account-types/{id}:
 *   get:
 *     summary: Get account type by ID
 *     tags: [Account Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Account type ID
 *     responses:
 *       200:
 *         description: Account type retrieved successfully
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
 *                         accountType:
 *                           $ref: '#/components/schemas/AccountType'
 *       401:
 *         description: Invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Account type not found
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
// Get account type by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const accountType = await AccountType.findById(id)

    if (!accountType) {
      return res.status(404).json({
        success: false,
        message: 'Account type not found',
      })
    }

    res.json({
      success: true,
      data: {
        accountType: accountType.toJSON(),
      },
    })
  } catch (error) {
    console.error('Get account type error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/admin/account-types/name/{name}:
 *   get:
 *     summary: Get account type by name
 *     tags: [Account Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Account type name
 *     responses:
 *       200:
 *         description: Account type retrieved successfully
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
 *                         accountType:
 *                           $ref: '#/components/schemas/AccountType'
 *       401:
 *         description: Invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Account type not found
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
// Get account type by name
router.get('/name/:name', authenticateToken, async (req, res) => {
  try {
    const { name } = req.params
    const accountType = await AccountType.findByName(name)

    if (!accountType) {
      return res.status(404).json({
        success: false,
        message: 'Account type not found',
      })
    }

    res.json({
      success: true,
      data: {
        accountType: accountType.toJSON(),
      },
    })
  } catch (error) {
    console.error('Get account type by name error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/admin/account-types:
 *   post:
 *     summary: Create new account type (admin only)
 *     tags: [Account Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - displayName
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unique account type name
 *                 example: "pro"
 *               displayName:
 *                 type: string
 *                 description: Display name for the account type
 *                 example: "Pro Plan"
 *               description:
 *                 type: string
 *                 description: Description of the account type
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
 *               features:
 *                 type: object
 *                 description: Additional features
 *               priceMonthly:
 *                 type: number
 *                 minimum: 0
 *                 description: Monthly price
 *               priceYearly:
 *                 type: number
 *                 minimum: 0
 *                 description: Yearly price
 *               currency:
 *                 type: string
 *                 description: Currency code
 *                 example: "USD"
 *               currencySymbol:
 *                 type: string
 *                 description: Currency symbol for display
 *                 example: "$"
 *               isActive:
 *                 type: boolean
 *                 description: Whether the account type is active
 *               isDefault:
 *                 type: boolean
 *                 description: Whether this is the default account type
 *     responses:
 *       201:
 *         description: Account type created successfully
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
 *                         accountType:
 *                           $ref: '#/components/schemas/AccountType'
 *       400:
 *         description: Invalid account type data
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Create new account type (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      displayName,
      description,
      maxForms = 5,
      maxSubmissionsPerForm = 100,
      canExportForms = false,
      canExportSubmissions = false,
      maxExportsPerForm = 0,
      maxExportsPerSubmission = 0,
      features = {},
      priceMonthly = 0,
      priceYearly = 0,
      currency = 'USD',
      currencySymbol = '$',
      isActive = true,
      isDefault = false
    } = req.body

    // Validate required fields
    if (!name || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Name and displayName are required',
      })
    }

    // Validate numeric fields
    const numericFields = ['maxForms', 'maxSubmissionsPerForm', 'maxExportsPerForm', 'maxExportsPerSubmission', 'priceMonthly', 'priceYearly']
    for (const field of numericFields) {
      if (req.body[field] !== undefined && (typeof req.body[field] !== 'number' || req.body[field] < 0)) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a non-negative number`,
        })
      }
    }

    const accountType = await AccountType.create({
      name,
      displayName,
      description,
      maxForms,
      maxSubmissionsPerForm,
      canExportForms,
      canExportSubmissions,
      maxExportsPerForm,
      maxExportsPerSubmission,
      features,
      priceMonthly,
      priceYearly,
      currency,
      currencySymbol,
      isActive,
      isDefault
    })

    if (!accountType) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create account type',
      })
    }

    res.status(201).json({
      success: true,
      message: 'Account type created successfully',
      data: {
        accountType: accountType.toJSON(),
      },
    })
  } catch (error) {
    console.error('Create account type error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/admin/account-types/{id}:
 *   put:
 *     summary: Update account type (admin only)
 *     tags: [Account Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Account type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 description: Display name for the account type
 *               description:
 *                 type: string
 *                 description: Description of the account type
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
 *               features:
 *                 type: object
 *                 description: Additional features
 *               priceMonthly:
 *                 type: number
 *                 minimum: 0
 *                 description: Monthly price
 *               priceYearly:
 *                 type: number
 *                 minimum: 0
 *                 description: Yearly price
 *               currency:
 *                 type: string
 *                 description: Currency code
 *               currencySymbol:
 *                 type: string
 *                 description: Currency symbol for display
 *               isActive:
 *                 type: boolean
 *                 description: Whether the account type is active
 *               isDefault:
 *                 type: boolean
 *                 description: Whether this is the default account type
 *     responses:
 *       200:
 *         description: Account type updated successfully
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
 *                         accountType:
 *                           $ref: '#/components/schemas/AccountType'
 *       400:
 *         description: Invalid account type data
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
 *         description: Account type not found
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
// Update account type (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const accountType = await AccountType.findById(id)

    if (!accountType) {
      return res.status(404).json({
        success: false,
        message: 'Account type not found',
      })
    }

    // Validate numeric fields
    const numericFields = ['maxForms', 'maxSubmissionsPerForm', 'maxExportsPerForm', 'maxExportsPerSubmission', 'priceMonthly', 'priceYearly']
    for (const field of numericFields) {
      if (req.body[field] !== undefined && (typeof req.body[field] !== 'number' || req.body[field] < 0)) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a non-negative number`,
        })
      }
    }

    const success = await accountType.update(req.body)

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update account type',
      })
    }

    // Get updated account type
    const updatedAccountType = await AccountType.findById(id)

    res.json({
      success: true,
      message: 'Account type updated successfully',
      data: {
        accountType: updatedAccountType.toJSON(),
      },
    })
  } catch (error) {
    console.error('Update account type error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/admin/account-types/{id}/set-default:
 *   post:
 *     summary: Set account type as default (admin only)
 *     tags: [Account Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Account type ID
 *     responses:
 *       200:
 *         description: Account type set as default successfully
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
 *                         accountType:
 *                           $ref: '#/components/schemas/AccountType'
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
 *         description: Account type not found
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
// Set account type as default (admin only)
router.post('/:id/set-default', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const accountType = await AccountType.findById(id)

    if (!accountType) {
      return res.status(404).json({
        success: false,
        message: 'Account type not found',
      })
    }

    const success = await accountType.setAsDefault()

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to set account type as default',
      })
    }

    // Get updated account type
    const updatedAccountType = await AccountType.findById(id)

    res.json({
      success: true,
      message: 'Account type set as default successfully',
      data: {
        accountType: updatedAccountType.toJSON(),
      },
    })
  } catch (error) {
    console.error('Set default account type error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/admin/account-types/{id}:
 *   delete:
 *     summary: Delete account type (admin only)
 *     tags: [Account Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Account type ID
 *     responses:
 *       200:
 *         description: Account type deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
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
 *         description: Account type not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Cannot delete account type (in use or is default)
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
// Delete account type (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const accountType = await AccountType.findById(id)

    if (!accountType) {
      return res.status(404).json({
        success: false,
        message: 'Account type not found',
      })
    }

    const success = await accountType.delete()

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete account type',
      })
    }

    res.json({
      success: true,
      message: 'Account type deleted successfully',
    })
  } catch (error) {
    console.error('Delete account type error:', error)
    
    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }

    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

export default router
