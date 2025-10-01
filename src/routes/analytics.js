import express from 'express'
import { FormAnalyticsService } from '../services/formAnalyticsService.js'
import { Form } from '../models/Form.js'
import { authenticateToken, optionalAuth } from '../middleware/auth.js'
import { sendErrorResponse } from '../utils/errorResponse.js'
import logger from '../utils/logger.js'

const router = express.Router()

/**
 * @swagger
 * /api/analytics/track/visit:
 *   post:
 *     summary: Track a form visit
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - formId
 *               - sessionId
 *             properties:
 *               formId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the form being visited
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Unique session identifier
 *               referrer:
 *                 type: string
 *                 description: Referrer URL
 *               country:
 *                 type: string
 *                 description: Country code (ISO 3166-1 alpha-2)
 *               city:
 *                 type: string
 *                 description: City name
 *     security: []
 *     responses:
 *       201:
 *         description: Visit tracked successfully
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
 *                         visitId:
 *                           type: string
 *                           format: uuid
 *       400:
 *         description: Invalid request data
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
router.post('/track/visit', optionalAuth, async (req, res) => {
  try {
    const { formId, sessionId, referrer, country, city } = req.body

    if (!formId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'formId and sessionId are required'
      })
    }

    const deviceInfo = FormAnalyticsService.parseUserAgent(req.get('User-Agent'))

    const visitData = {
      formId,
      userId: req.user?.id || null,
      sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      referrer,
      country,
      city,
      ...deviceInfo
    }

    const visit = await FormAnalyticsService.trackFormVisit(visitData)

    if (!visit) {
      return res.status(500).json({
        success: false,
        message: 'Failed to track visit'
      })
    }

    res.status(201).json({
      success: true,
      message: 'Visit tracked successfully',
      data: {
        visitId: visit.id
      }
    })
  } catch (error) {
    console.error('Track visit error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/analytics/track/step-start:
 *   post:
 *     summary: Track step start
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - formId
 *               - stepId
 *               - sessionId
 *               - stepOrder
 *             properties:
 *               formId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the form
 *               stepId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the step
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Session identifier
 *               stepOrder:
 *                 type: integer
 *                 description: Order of the step in the form
 *     security: []
 *     responses:
 *       201:
 *         description: Step start tracked successfully
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
 *                         stepTrackingId:
 *                           type: string
 *                           format: uuid
 *       400:
 *         description: Invalid request data
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
router.post('/track/step-start', optionalAuth, async (req, res) => {
  try {
    const { formId, stepId, sessionId, stepOrder } = req.body

    if (!formId || !stepId || !sessionId || stepOrder === undefined) {
      return res.status(400).json({
        success: false,
        message: 'formId, stepId, sessionId, and stepOrder are required'
      })
    }

    const stepData = {
      formId,
      stepId,
      sessionId,
      userId: req.user?.id || null,
      stepOrder: parseInt(stepOrder)
    }

    const stepTracking = await FormAnalyticsService.trackStepStart(stepData)

    if (!stepTracking) {
      return res.status(500).json({
        success: false,
        message: 'Failed to track step start'
      })
    }

    res.status(201).json({
      success: true,
      message: 'Step start tracked successfully',
      data: {
        stepTrackingId: stepTracking.id
      }
    })
  } catch (error) {
    console.error('Track step start error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/analytics/track/step-complete:
 *   post:
 *     summary: Track step completion
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stepTrackingId
 *               - timeSpentMs
 *             properties:
 *               stepTrackingId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the step tracking record
 *               timeSpentMs:
 *                 type: integer
 *                 description: Time spent on the step in milliseconds
 *               fieldInteractions:
 *                 type: integer
 *                 description: Number of field interactions
 *                 default: 0
 *               validationErrors:
 *                 type: integer
 *                 description: Number of validation errors
 *                 default: 0
 *     security: []
 *     responses:
 *       200:
 *         description: Step completion tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid request data
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
router.post('/track/step-complete', optionalAuth, async (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    logger.logTrace('step_complete_request_start', {
      requestId,
      userId: req.user?.id || null,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      body: req.body
    })

    // Extract and validate request parameters
    const { stepTrackingId, timeSpentMs, fieldInteractions = 0, validationErrors = 0 } = req.body

    // Validate required parameters
    if (!stepTrackingId || timeSpentMs === undefined) {
      logger.logWarn('step_complete_validation_failed', {
        requestId,
        stepTrackingId,
        timeSpentMs,
        fieldInteractions,
        validationErrors,
        missingFields: {
          stepTrackingId: !stepTrackingId,
          timeSpentMs: timeSpentMs === undefined
        }
      })

      return res.status(400).json({
        success: false,
        message: 'stepTrackingId and timeSpentMs are required'
      })
    }

    // Validate parameter types and ranges
    const parsedTimeSpentMs = parseInt(timeSpentMs)
    const parsedFieldInteractions = parseInt(fieldInteractions)
    const parsedValidationErrors = parseInt(validationErrors)

    if (isNaN(parsedTimeSpentMs) || parsedTimeSpentMs < 0) {
      logger.logWarn('step_complete_invalid_time_spent', {
        requestId,
        stepTrackingId,
        timeSpentMs,
        parsedTimeSpentMs
      })

      return res.status(400).json({
        success: false,
        message: 'timeSpentMs must be a valid non-negative number'
      })
    }

    if (isNaN(parsedFieldInteractions) || parsedFieldInteractions < 0) {
      logger.logWarn('step_complete_invalid_field_interactions', {
        requestId,
        stepTrackingId,
        fieldInteractions,
        parsedFieldInteractions
      })

      return res.status(400).json({
        success: false,
        message: 'fieldInteractions must be a valid non-negative number'
      })
    }

    if (isNaN(parsedValidationErrors) || parsedValidationErrors < 0) {
      logger.logWarn('step_complete_invalid_validation_errors', {
        requestId,
        stepTrackingId,
        validationErrors,
        parsedValidationErrors
      })

      return res.status(400).json({
        success: false,
        message: 'validationErrors must be a valid non-negative number'
      })
    }

    logger.logTrace('step_complete_validation_success', {
      requestId,
      stepTrackingId,
      parsedTimeSpentMs,
      parsedFieldInteractions,
      parsedValidationErrors
    })

    // Attempt to track step completion
    try {
      const success = await FormAnalyticsService.trackStepComplete(
        stepTrackingId,
        parsedTimeSpentMs,
        parsedFieldInteractions,
        parsedValidationErrors
      )

      if (!success) {
        logger.logError('step_complete_service_failed', {
          requestId,
          stepTrackingId,
          parsedTimeSpentMs,
          parsedFieldInteractions,
          parsedValidationErrors,
          userId: req.user?.id || null
        })

        return res.status(500).json({
          success: false,
          message: 'Failed to track step completion'
        })
      }

      logger.logTrace('step_complete_success', {
        requestId,
        stepTrackingId,
        parsedTimeSpentMs,
        parsedFieldInteractions,
        parsedValidationErrors,
        userId: req.user?.id || null
      })

      res.json({
        success: true,
        message: 'Step completion tracked successfully'
      })

    } catch (serviceError) {
      logger.logError('step_complete_service_exception', {
        requestId,
        stepTrackingId,
        parsedTimeSpentMs,
        parsedFieldInteractions,
        parsedValidationErrors,
        userId: req.user?.id || null,
        error: serviceError.message,
        stack: serviceError.stack
      })

      return res.status(500).json({
        success: false,
        message: 'Failed to track step completion due to service error'
      })
    }

  } catch (error) {
    logger.logError('step_complete_endpoint_exception', {
      requestId,
      userId: req.user?.id || null,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      body: req.body,
      error: error.message,
      stack: error.stack
    })

    console.error('Track step complete error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/analytics/track/field-interaction:
 *   post:
 *     summary: Track field interaction
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - formId
 *               - stepId
 *               - fieldId
 *               - sessionId
 *               - interactionType
 *             properties:
 *               formId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the form
 *               stepId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the step
 *               fieldId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the field
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Session identifier
 *               interactionType:
 *                 type: string
 *                 enum: [focus, blur, input, validation_error, validation_success]
 *                 description: Type of interaction
 *               fieldValueLength:
 *                 type: integer
 *                 description: Length of field value
 *                 default: 0
 *               timeSpentMs:
 *                 type: integer
 *                 description: Time spent on field in milliseconds
 *                 default: 0
 *               interactionData:
 *                 type: object
 *                 description: Additional interaction data
 *     security: []
 *     responses:
 *       201:
 *         description: Field interaction tracked successfully
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
 *                         interactionId:
 *                           type: string
 *                           format: uuid
 *       400:
 *         description: Invalid request data
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
router.post('/track/field-interaction', optionalAuth, async (req, res) => {
  try {
    const { 
      formId, 
      stepId, 
      fieldId, 
      sessionId, 
      interactionType, 
      fieldValueLength = 0, 
      timeSpentMs = 0, 
      interactionData = null 
    } = req.body

    if (!formId || !stepId || !fieldId || !sessionId || !interactionType) {
      return res.status(400).json({
        success: false,
        message: 'formId, stepId, fieldId, sessionId, and interactionType are required'
      })
    }

    const validInteractionTypes = ['focus', 'blur', 'input', 'validation_error', 'validation_success']
    if (!validInteractionTypes.includes(interactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interaction type'
      })
    }

    const interactionDataObj = {
      formId,
      stepId,
      fieldId,
      sessionId,
      userId: req.user?.id || null,
      interactionType,
      fieldValueLength: parseInt(fieldValueLength),
      timeSpentMs: parseInt(timeSpentMs),
      interactionData
    }

    const interaction = await FormAnalyticsService.trackFieldInteraction(interactionDataObj)

    if (!interaction) {
      return res.status(500).json({
        success: false,
        message: 'Failed to track field interaction'
      })
    }

    res.status(201).json({
      success: true,
      message: 'Field interaction tracked successfully',
      data: {
        interactionId: interaction.id
      }
    })
  } catch (error) {
    console.error('Track field interaction error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/analytics/track/session-start:
 *   post:
 *     summary: Start a submission session
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - formId
 *               - sessionId
 *             properties:
 *               formId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the form
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Session identifier
 *               referrer:
 *                 type: string
 *                 description: Referrer URL
 *               country:
 *                 type: string
 *                 description: Country code
 *               city:
 *                 type: string
 *                 description: City name
 *     security: []
 *     responses:
 *       201:
 *         description: Session started successfully
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
 *                         sessionRecordId:
 *                           type: string
 *                           format: uuid
 *       400:
 *         description: Invalid request data
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
router.post('/track/session-start', optionalAuth, async (req, res) => {
  try {
    const { formId, sessionId, referrer, country, city } = req.body

    if (!formId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'formId and sessionId are required'
      })
    }

    const deviceInfo = FormAnalyticsService.parseUserAgent(req.get('User-Agent'))

    const sessionData = {
      formId,
      userId: req.user?.id || null,
      sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      referrer,
      country,
      city,
      ...deviceInfo
    }

    const session = await FormAnalyticsService.startSubmissionSession(sessionData)

    if (!session) {
      return res.status(500).json({
        success: false,
        message: 'Failed to start submission session'
      })
    }

    res.status(201).json({
      success: true,
      message: 'Submission session started successfully',
      data: {
        sessionRecordId: session.id
      }
    })
  } catch (error) {
    console.error('Start session error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/analytics/track/session-complete:
 *   post:
 *     summary: Complete a submission session
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - submissionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Session identifier
 *               submissionId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the completed submission
 *               sessionStats:
 *                 type: object
 *                 description: Session statistics
 *                 properties:
 *                   totalTimeSpentMs:
 *                     type: integer
 *                   totalStepsCompleted:
 *                     type: integer
 *                   totalFieldInteractions:
 *                     type: integer
 *                   totalValidationErrors:
 *                     type: integer
 *     security: []
 *     responses:
 *       200:
 *         description: Session completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid request data
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
router.post('/track/session-complete', optionalAuth, async (req, res) => {
  try {
    const { sessionId, submissionId, sessionStats } = req.body

    if (!sessionId || !submissionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId and submissionId are required'
      })
    }

    const success = await FormAnalyticsService.completeSubmissionSession(
      sessionId, 
      submissionId, 
      sessionStats
    )

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to complete submission session'
      })
    }

    res.json({
      success: true,
      message: 'Submission session completed successfully'
    })
  } catch (error) {
    console.error('Complete session error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/analytics/track/session-abandon:
 *   post:
 *     summary: Abandon a submission session
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - stepNumber
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Session identifier
 *               stepNumber:
 *                 type: integer
 *                 description: Step number where session was abandoned
 *               sessionStats:
 *                 type: object
 *                 description: Session statistics
 *                 properties:
 *                   totalTimeSpentMs:
 *                     type: integer
 *                   totalStepsCompleted:
 *                     type: integer
 *                   totalFieldInteractions:
 *                     type: integer
 *                   totalValidationErrors:
 *                     type: integer
 *     security: []
 *     responses:
 *       200:
 *         description: Session abandoned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid request data
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
router.post('/track/session-abandon', optionalAuth, async (req, res) => {
  try {
    const { sessionId, stepNumber, sessionStats } = req.body

    if (!sessionId || stepNumber === undefined) {
      return res.status(400).json({
        success: false,
        message: 'sessionId and stepNumber are required'
      })
    }

    const success = await FormAnalyticsService.abandonSubmissionSession(
      sessionId, 
      parseInt(stepNumber), 
      sessionStats
    )

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to abandon submission session'
      })
    }

    res.json({
      success: true,
      message: 'Submission session abandoned successfully'
    })
  } catch (error) {
    console.error('Abandon session error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/analytics/kpis:
 *   get:
 *     summary: Get general analytics KPIs across all forms
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for KPIs (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for KPIs (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: KPIs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/KPIs'
 *       401:
 *         description: Authentication required
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
router.get('/kpis', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const userId = req.user.role === 'admin' ? null : req.user.id
    const kpis = await FormAnalyticsService.getGeneralKpis(startDate || null, endDate || null, userId)
    return res.json({ success: true, data: kpis })
  } catch (error) {
    console.error('Get general KPIs error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

/**
 * @swagger
 * /api/analytics/forms/kpis:
 *   get:
 *     summary: Get general KPIs and forms list with analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for KPIs (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for KPIs (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Forms KPIs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FormsKpisResponse'
 *       401:
 *         description: Authentication required
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
router.get('/forms/kpis', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const userId = req.user.role === 'admin' ? null : req.user.id
    
    // Get general KPIs and forms with analytics
    const kpis = await Form.getFormsWithKpis(startDate || null, endDate || null, userId)
    
    return res.json({
      success: true,
      data: kpis
    })
  } catch (error) {
    console.error('Get forms KPIs error:', error)
    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})

export default router
