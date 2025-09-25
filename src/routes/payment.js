import express from 'express'
import { AccountType } from '../models/AccountType.js'

const router = express.Router()

/**
 * @swagger
 * /api/payment/pricing:
 *   get:
 *     summary: Get active account types (public pricing)
 *     tags: [Payment]
 *     security: []
 *     responses:
 *       200:
 *         description: Active account types retrieved successfully
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/pricing', async (req, res) => {
  try {
    const accountTypes = await AccountType.findAll(false)
    res.json({
      success: true,
      data: {
        accountTypes: accountTypes.map((type) => type.toJSON()),
      },
    })
  } catch (error) {
    console.error('Pricing endpoint error:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

export default router


