import { FormVisit, FormStepTracking, FormFieldInteraction, FormSubmissionSession } from '../models/FormAnalytics.js'
import { FormSubmission } from '../models/FormSubmission.js'
import { Form } from '../models/Form.js'
import logger from '../utils/logger.js'

export class FormAnalyticsService {
  /**
   * Track a form visit
   */
  static async trackFormVisit(visitData) {
    try {
      const visit = await FormVisit.create(visitData)
      
      if (visit) {
        logger.logTrace('form_visit_tracked', {
          formId: visitData.formId,
          sessionId: visitData.sessionId,
          userId: visitData.userId,
          deviceType: visitData.deviceType
        })
      }
      
      return visit
    } catch (error) {
      logger.logError(error, {
        operation: 'track_form_visit',
        formId: visitData.formId,
        sessionId: visitData.sessionId
      })
      return null
    }
  }

  /**
   * Track step start
   */
  static async trackStepStart(stepData) {
    try {
      const stepTracking = await FormStepTracking.create(stepData)
      
      if (stepTracking) {
        logger.logTrace('step_start_tracked', {
          formId: stepData.formId,
          stepId: stepData.stepId,
          sessionId: stepData.sessionId,
          stepOrder: stepData.stepOrder
        })
      }
      
      return stepTracking
    } catch (error) {
      logger.logError(error, {
        operation: 'track_step_start',
        formId: stepData.formId,
        stepId: stepData.stepId,
        sessionId: stepData.sessionId
      })
      return null
    }
  }

  /**
   * Track step completion
   */
  static async trackStepComplete(stepTrackingId, timeSpentMs, fieldInteractions, validationErrors) {
    try {
      const stepTracking = await FormStepTracking.findById(stepTrackingId)
      
      if (!stepTracking) {
        logger.logWarn('step_tracking_not_found', { stepTrackingId })
        return false
      }

      const success = await stepTracking.update({
        timeSpentMs,
        fieldInteractions,
        validationErrors,
        stepCompletedAt: new Date()
      })

      if (success) {
        logger.logTrace('step_completed_tracked', {
          stepTrackingId,
          timeSpentMs,
          fieldInteractions,
          validationErrors
        })
      }

      return success
    } catch (error) {
      logger.logError(error, {
        operation: 'track_step_complete',
        stepTrackingId
      })
      return false
    }
  }

  /**
   * Track field interaction
   */
  static async trackFieldInteraction(interactionData) {
    try {
      const interaction = await FormFieldInteraction.create(interactionData)
      
      if (interaction) {
        logger.logTrace('field_interaction_tracked', {
          formId: interactionData.formId,
          fieldId: interactionData.fieldId,
          interactionType: interactionData.interactionType,
          sessionId: interactionData.sessionId
        })
      }
      
      return interaction
    } catch (error) {
      logger.logError(error, {
        operation: 'track_field_interaction',
        formId: interactionData.formId,
        fieldId: interactionData.fieldId,
        interactionType: interactionData.interactionType
      })
      return null
    }
  }

  /**
   * Start a new submission session
   */
  static async startSubmissionSession(sessionData) {
    try {
      const session = await FormSubmissionSession.create(sessionData)
      
      if (session) {
        logger.logTrace('submission_session_started', {
          formId: sessionData.formId,
          sessionId: sessionData.sessionId,
          userId: sessionData.userId
        })
      }
      
      return session
    } catch (error) {
      logger.logError(error, {
        operation: 'start_submission_session',
        formId: sessionData.formId,
        sessionId: sessionData.sessionId
      })
      return null
    }
  }

  /**
   * Complete a submission session
   */
  static async completeSubmissionSession(sessionId, submissionId, sessionStats) {
    try {
      const session = await FormSubmissionSession.findBySessionId(sessionId)
      
      if (!session) {
        logger.logWarn('submission_session_not_found', { sessionId })
        return false
      }

      const success = await session.complete(submissionId)
      
      if (success && sessionStats) {
        await session.update({
          totalTimeSpentMs: sessionStats.totalTimeSpentMs,
          totalStepsCompleted: sessionStats.totalStepsCompleted,
          totalFieldInteractions: sessionStats.totalFieldInteractions,
          totalValidationErrors: sessionStats.totalValidationErrors
        })
      }

      if (success) {
        logger.logTrace('submission_session_completed', {
          sessionId,
          submissionId,
          sessionStats
        })
      }

      return success
    } catch (error) {
      logger.logError(error, {
        operation: 'complete_submission_session',
        sessionId,
        submissionId
      })
      return false
    }
  }

  /**
   * Abandon a submission session
   */
  static async abandonSubmissionSession(sessionId, stepNumber, sessionStats) {
    try {
      const session = await FormSubmissionSession.findBySessionId(sessionId)
      
      if (!session) {
        logger.logWarn('submission_session_not_found', { sessionId })
        return false
      }

      const success = await session.abandon(stepNumber)
      
      if (success && sessionStats) {
        await session.update({
          totalTimeSpentMs: sessionStats.totalTimeSpentMs,
          totalStepsCompleted: sessionStats.totalStepsCompleted,
          totalFieldInteractions: sessionStats.totalFieldInteractions,
          totalValidationErrors: sessionStats.totalValidationErrors
        })
      }

      if (success) {
        logger.logTrace('submission_session_abandoned', {
          sessionId,
          stepNumber,
          sessionStats
        })
      }

      return success
    } catch (error) {
      logger.logError(error, {
        operation: 'abandon_submission_session',
        sessionId,
        stepNumber
      })
      return false
    }
  }

  /**
   * Get comprehensive analytics for a form
   */
  static async getFormAnalytics(formId, startDate = null, endDate = null) {
    try {
      const [visitStats, stepStats, fieldStats, sessionStats] = await Promise.all([
        FormVisit.getStats(formId, startDate, endDate),
        FormStepTracking.getStepStats(formId, null, startDate, endDate),
        FormFieldInteraction.getFieldStats(formId, null, startDate, endDate),
        FormSubmissionSession.getSessionStats(formId, startDate, endDate)
      ])

      return {
        formId,
        period: {
          startDate,
          endDate
        },
        visits: visitStats,
        steps: stepStats,
        fields: fieldStats,
        sessions: sessionStats,
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      logger.logError(error, {
        operation: 'get_form_analytics',
        formId,
        startDate,
        endDate
      })
      return null
    }
  }

  /**
   * Get real-time analytics for a form
   */
  static async getRealTimeAnalytics(formId) {
    try {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const [recentVisits, recentSessions, activeSessions] = await Promise.all([
        FormVisit.getStats(formId, oneHourAgo, now),
        FormSubmissionSession.getSessionStats(formId, oneHourAgo, now),
        FormSubmissionSession.findByFormId(formId, 50, 0)
      ])

      // Filter active sessions (started within last hour, not completed)
      const activeSessionsCount = activeSessions.filter(session => 
        new Date(session.sessionStartedAt) > oneHourAgo && 
        !session.submissionCompleted
      ).length

      return {
        formId,
        realTime: {
          activeVisitors: recentVisits.total_visits,
          activeSessions: activeSessionsCount,
          recentSubmissions: recentSessions.completedSessions,
          recentAbandonments: recentSessions.abandonedSessions
        },
        lastHour: {
          visits: recentVisits,
          sessions: recentSessions
        },
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      logger.logError(error, {
        operation: 'get_real_time_analytics',
        formId
      })
      return null
    }
  }

  /**
   * Get general KPIs across all forms
   */
  static async getGeneralKpis(startDate = null, endDate = null, userId = null) {
    try {
      // Aggregate from existing model stats
      const [submissionStats, visitStats, sessionStats] = await Promise.all([
        FormSubmission.getStats(null, userId),
        FormVisit.getStatsForAll(startDate, endDate, userId),
        FormSubmissionSession.getGlobalSessionStats(startDate, endDate, userId)
      ])

      const totalForms = submissionStats.total_forms || 0
      const totalSubmissions = submissionStats.total_submissions || 0
      const uniqueUsers = submissionStats.unique_users || 0

      return {
        totalForms,
        totalSubmissions,
        uniqueUsers,
        totalVisits: visitStats.total_visits,
        uniqueSessions: visitStats.unique_sessions,
        completedSessions: sessionStats.completedSessions,
        abandonedSessions: sessionStats.abandonedSessions,
        conversionRate: sessionStats.conversionRate,
        avgSessionDurationMs: sessionStats.avgSessionDurationMs,
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      logger.logError(error, {
        operation: 'get_general_kpis',
        startDate,
        endDate,
        userId
      })
      return {
        totalForms: 0,
        totalSubmissions: 0,
        uniqueUsers: 0,
        totalVisits: 0,
        uniqueSessions: 0,
        completedSessions: 0,
        abandonedSessions: 0,
        conversionRate: 0,
        avgSessionDurationMs: 0,
        generatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Get analytics for a specific step
   */
  static async getStepAnalytics(formId, stepId) {
    try {
      const stepStats = await FormStepTracking.getStepStats(formId, stepId)
      
      if (stepStats.length === 0) {
        return null
      }

      return {
        formId,
        stepId,
        analytics: stepStats[0],
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      logger.logError(error, {
        operation: 'get_step_analytics',
        formId,
        stepId
      })
      return null
    }
  }

  /**
   * Get analytics for a specific field
   */
  static async getFieldAnalytics(formId, fieldId) {
    try {
      const fieldStats = await FormFieldInteraction.getFieldStats(formId, fieldId)
      
      if (fieldStats.length === 0) {
        return null
      }

      return {
        formId,
        fieldId,
        analytics: fieldStats[0],
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      logger.logError(error, {
        operation: 'get_field_analytics',
        formId,
        fieldId
      })
      return null
    }
  }

  /**
   * Get user journey for a specific session
   */
  static async getUserJourney(sessionId) {
    try {
      const [visits, stepTrackings, fieldInteractions, session] = await Promise.all([
        FormVisit.findBySessionId(sessionId),
        FormStepTracking.findBySessionId(sessionId),
        FormFieldInteraction.findBySessionId(sessionId),
        FormSubmissionSession.findBySessionId(sessionId)
      ])

      return {
        sessionId,
        session: session?.toJSON(),
        visits: visits.map(v => v.toJSON()),
        steps: stepTrackings.map(s => s.toJSON()),
        fieldInteractions: fieldInteractions.map(f => f.toJSON()),
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      logger.logError(error, {
        operation: 'get_user_journey',
        sessionId
      })
      return null
    }
  }

  /**
   * Parse user agent to extract device information
   */
  static parseUserAgent(userAgent) {
    if (!userAgent) {
      return {
        deviceType: 'desktop',
        browser: 'Unknown',
        os: 'Unknown'
      }
    }

    const ua = userAgent.toLowerCase()
    
    // Device type detection
    let deviceType = 'desktop'
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      deviceType = 'mobile'
    } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
      deviceType = 'tablet'
    }

    // Browser detection
    let browser = 'Unknown'
    if (ua.includes('chrome') && !ua.includes('edg')) {
      browser = 'Chrome'
    } else if (ua.includes('firefox')) {
      browser = 'Firefox'
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browser = 'Safari'
    } else if (ua.includes('edg')) {
      browser = 'Edge'
    } else if (ua.includes('opera')) {
      browser = 'Opera'
    }

    // OS detection
    let os = 'Unknown'
    if (ua.includes('windows')) {
      os = 'Windows'
    } else if (ua.includes('mac')) {
      os = 'macOS'
    } else if (ua.includes('linux')) {
      os = 'Linux'
    } else if (ua.includes('android')) {
      os = 'Android'
    } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
      os = 'iOS'
    }

    return {
      deviceType,
      browser,
      os
    }
  }

  /**
   * Generate a unique session ID
   */
  static generateSessionId() {
    return crypto.randomUUID()
  }

  /**
   * Get IP geolocation (placeholder - integrate with geolocation service)
   */
  static async getIPGeolocation(ipAddress) {
    // This is a placeholder implementation
    // In production, integrate with a service like MaxMind, IPinfo, or similar
    return {
      country: null,
      city: null
    }
  }
}
