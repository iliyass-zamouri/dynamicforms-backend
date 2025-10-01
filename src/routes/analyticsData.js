import express from 'express'
import { FormAnalyticsService } from '../services/formAnalyticsService.js'
import { authenticateToken } from '../middleware/auth.js'
import { sendErrorResponse } from '../utils/errorResponse.js'
import { Form } from '../models/Form.js'
import { FormSubmissionSession } from '../models/FormAnalytics.js'
import logger from '../utils/logger.js'

const router = express.Router()

/**
 * @swagger
 * /api/analytics/form/{formId}:
 *   get:
 *     summary: Get comprehensive analytics for a form
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the form
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *         description: Time period for analytics (alternative to startDate/endDate)
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
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
 *                         formId:
 *                           type: string
 *                           format: uuid
 *                         period:
 *                           type: object
 *                           properties:
 *                             startDate:
 *                               type: string
 *                               format: date
 *                             endDate:
 *                               type: string
 *                               format: date
 *                         visits:
 *                           type: object
 *                           description: Visit statistics
 *                         steps:
 *                           type: array
 *                           description: Step analytics
 *                         fields:
 *                           type: array
 *                           description: Field analytics
 *                         sessions:
 *                           type: object
 *                           description: Session statistics
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Form not found
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
router.get('/form/:formId', authenticateToken, async (req, res) => {
  try {
    const { formId } = req.params
    const { startDate, endDate, period } = req.query

    // Validate form ownership
    const form = await Form.findById(formId)
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      })
    }

    // Check if user owns the form or is admin
    if (req.user.role !== 'admin' && form.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    // Convert period to date range if provided
    let startDateFilter = startDate || null
    let endDateFilter = endDate || null

    if (period && !startDate && !endDate) {
      const now = new Date()
      switch (period.toLowerCase()) {
        case 'day':
          startDateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          endDateFilter = now
          break
        case 'week':
          startDateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          endDateFilter = now
          break
        case 'month':
          startDateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          endDateFilter = now
          break
        case 'year':
          startDateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          endDateFilter = now
          break
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid period. Supported values: day, week, month, year'
          })
      }
    }

    const analytics = await FormAnalyticsService.getFormAnalytics(
      formId, 
      startDateFilter, 
      endDateFilter
    )

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Analytics not found'
      })
    }

    res.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('Get form analytics error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/analytics/form/{formId}/realtime:
 *   get:
 *     summary: Get real-time analytics for a form
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the form
 *     responses:
 *       200:
 *         description: Real-time analytics retrieved successfully
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
 *                         formId:
 *                           type: string
 *                           format: uuid
 *                         realTime:
 *                           type: object
 *                           properties:
 *                             activeVisitors:
 *                               type: integer
 *                             activeSessions:
 *                               type: integer
 *                             recentSubmissions:
 *                               type: integer
 *                             recentAbandonments:
 *                               type: integer
 *                         lastHour:
 *                           type: object
 *                           description: Last hour statistics
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
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
router.get('/form/:formId/realtime', authenticateToken, async (req, res) => {
  try {
    const { formId } = req.params

    // Validate form ownership
    const form = await Form.findById(formId)
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      })
    }

    // Check if user owns the form or is admin
    if (req.user.role !== 'admin' && form.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const analytics = await FormAnalyticsService.getRealTimeAnalytics(formId)

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Real-time analytics not found'
      })
    }

    res.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('Get real-time analytics error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/analytics/form/{formId}/step/{stepId}:
 *   get:
 *     summary: Get analytics for a specific step
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the form
 *       - in: path
 *         name: stepId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the step
 *     responses:
 *       200:
 *         description: Step analytics retrieved successfully
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
 *                         formId:
 *                           type: string
 *                           format: uuid
 *                         stepId:
 *                           type: string
 *                           format: uuid
 *                         analytics:
 *                           type: object
 *                           description: Step analytics data
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Step analytics not found
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
router.get('/form/:formId/step/:stepId', authenticateToken, async (req, res) => {
  try {
    const { formId, stepId } = req.params

    // Validate form ownership
    const form = await Form.findById(formId)
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      })
    }

    // Check if user owns the form or is admin
    if (req.user.role !== 'admin' && form.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const analytics = await FormAnalyticsService.getStepAnalytics(formId, stepId)

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Step analytics not found'
      })
    }

    res.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('Get step analytics error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/analytics/form/{formId}/field/{fieldId}:
 *   get:
 *     summary: Get analytics for a specific field
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the form
 *       - in: path
 *         name: fieldId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the field
 *     responses:
 *       200:
 *         description: Field analytics retrieved successfully
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
 *                         formId:
 *                           type: string
 *                           format: uuid
 *                         fieldId:
 *                           type: string
 *                           format: uuid
 *                         analytics:
 *                           type: object
 *                           description: Field analytics data
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Field analytics not found
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
router.get('/form/:formId/field/:fieldId', authenticateToken, async (req, res) => {
  try {
    const { formId, fieldId } = req.params

    // Validate form ownership
    const form = await Form.findById(formId)
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      })
    }

    // Check if user owns the form or is admin
    if (req.user.role !== 'admin' && form.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const analytics = await FormAnalyticsService.getFieldAnalytics(formId, fieldId)

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Field analytics not found'
      })
    }

    res.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('Get field analytics error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/analytics/session/{sessionId}/journey:
 *   get:
 *     summary: Get user journey for a specific session
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Session identifier
 *     responses:
 *       200:
 *         description: User journey retrieved successfully
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
 *                         sessionId:
 *                           type: string
 *                           format: uuid
 *                         session:
 *                           type: object
 *                           description: Session data
 *                         visits:
 *                           type: array
 *                           description: Visit records
 *                         steps:
 *                           type: array
 *                           description: Step tracking records
 *                         fieldInteractions:
 *                           type: array
 *                           description: Field interaction records
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User journey not found
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
router.get('/session/:sessionId/journey', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params

    // Get session to validate form ownership
    const session = await FormSubmissionSession.findBySessionId(sessionId)
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      })
    }

    // Validate form ownership
    const form = await Form.findById(session.formId)
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      })
    }

    // Check if user owns the form or is admin
    if (req.user.role !== 'admin' && form.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const journey = await FormAnalyticsService.getUserJourney(sessionId)

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'User journey not found'
      })
    }

    res.json({
      success: true,
      data: journey
    })
  } catch (error) {
    console.error('Get user journey error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/analytics/export/{formId}:
 *   get:
 *     summary: Export analytics data for a form
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the form
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for export (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for export (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Analytics data exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       description: Exported analytics data
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
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
router.get('/export/:formId', authenticateToken, async (req, res) => {
  try {
    const { formId } = req.params
    const { format = 'json', startDate, endDate } = req.query

    // Validate form ownership
    const form = await Form.findById(formId)
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      })
    }

    // Check if user owns the form or is admin
    if (req.user.role !== 'admin' && form.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const analytics = await FormAnalyticsService.getFormAnalytics(
      formId, 
      startDate || null, 
      endDate || null
    )

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Analytics not found'
      })
    }

    if (format === 'csv') {
      // TODO: Implement CSV export
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${formId}.csv"`)
      res.send('CSV export not yet implemented')
    } else {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${formId}.json"`)
      res.json({
        success: true,
        data: analytics
      })
    }
  } catch (error) {
    console.error('Export analytics error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

export default router
