import dotenv from 'dotenv'
import { Subscription, SubscriptionHistory } from '../models/Subscription.js'
import { AccountType } from '../models/AccountType.js'
import { UserPreferences } from '../models/UserPreferences.js'
import { executeQuery } from '../database/connection.js'
import logger from '../utils/logger.js'

// Ensure environment variables are loaded
dotenv.config()

export class SubscriptionService {
  // Check PLANS_DISABLED at runtime to ensure env variables are loaded
  static getPlansDisabled() {
    const value = process.env.PLANS_DISABLED
    const result = value === 'true' || value === 'TRUE' || value === 'True' || value === '1'
    console.log('[DEBUG] SubscriptionService.getPlansDisabled() called:', { value, result, type: typeof value })
    return result
  }
  
  // Create a new subscription for a user
  static async createSubscription(userId, accountTypeId, billingCycle = 'monthly', options = {}) {
    const startTime = Date.now()
    
    logger.logTrace('subscription_service_create_start', { 
      userId, 
      accountTypeId, 
      billingCycle 
    })

    try {
      // Check if user already has an active subscription
      const existingActive = await Subscription.findActiveByUserId(userId)
      if (existingActive) {
        throw new Error('User already has an active subscription')
      }

      // Check if user already has a pending subscription
      const existingPending = await Subscription.findByUserId(userId, false)
      const hasPending = existingPending.find((s) => s.status === 'pending')
      if (hasPending) {
        throw new Error('User already has a pending subscription')
      }

      // Verify account type exists
      const accountType = await AccountType.findById(accountTypeId)
      if (!accountType) {
        throw new Error('Account type not found')
      }

      // Determine plan type from account type
      const planType = accountType.billingModel === 'lifetime' ? 'lifetime' : 'recurring'

      // Create subscription
      const subscriptionData = {
        userId,
        accountTypeId,
        billingCycle,
        status: options.status || 'pending',
        currency: options.currency || 'USD',
        paymentProvider: options.paymentProvider || null,
        paymentProviderSubscriptionId: options.paymentProviderSubscriptionId || null,
        paymentMethodId: options.paymentMethodId || null,
        trialStartDate: options.trialStartDate || null,
        trialEndDate: options.trialEndDate || null,
        isTrial: options.isTrial || false,
        autoRenew: planType === 'recurring' ? (options.autoRenew !== false) : false,
        metadata: options.metadata || {},
        planType
      }

      const subscription = await Subscription.create(subscriptionData)
      
      if (subscription) {
        // Record in history
        await SubscriptionHistory.recordChange({
          subscriptionId: subscription.id,
          userId: subscription.userId,
          action: 'created',
          newAccountTypeId: subscription.accountTypeId,
          newStatus: subscription.status,
          newAmount: subscription.amount,
          newBillingCycle: subscription.billingCycle,
          reason: 'subscription_created',
          changedBy: options.changedBy || null,
          ipAddress: options.ipAddress || null,
          userAgent: options.userAgent || null
        })

        // Update user preferences only when subscription is active
        if (subscription.status === 'active') {
          await subscription.updateUserPreferencesToAccountType(accountTypeId)
        }

        const duration = Date.now() - startTime
        
        logger.logTrace('subscription_service_create_success', { 
          subscriptionId: subscription.id,
          userId, 
          accountTypeId, 
          billingCycle,
          duration: `${duration}ms` 
        })

        return subscription
      }

      throw new Error('Failed to create subscription')
    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.logError(error, {
        operation: 'subscription_service_create',
        userId,
        accountTypeId,
        billingCycle,
        duration: `${duration}ms`
      })
      
      throw error
    }
  }

  // Change subscription plan (upgrade or downgrade)
  static async changeSubscriptionPlan(subscriptionId, newAccountTypeId, reason = 'plan_change_requested', options = {}) {
    const startTime = Date.now()
    
    logger.logTrace('subscription_service_change_plan_start', { 
      subscriptionId, 
      newAccountTypeId 
    })

    try {
      const subscription = await Subscription.findById(subscriptionId)
      if (!subscription) {
        throw new Error('Subscription not found')
      }

      const currentAccountType = await AccountType.findById(subscription.accountTypeId)
      const newAccountType = await AccountType.findById(newAccountTypeId)
      
      if (!currentAccountType || !newAccountType) {
        throw new Error('Account type not found')
      }

      // Determine if this is an upgrade or downgrade
      const isUpgrade = newAccountType.priceMonthly > currentAccountType.priceMonthly
      const action = isUpgrade ? 'upgraded' : 'downgraded'

      // Update subscription
      const success = isUpgrade 
        ? await subscription.upgrade(newAccountTypeId, reason, options.changedBy)
        : await subscription.downgrade(newAccountTypeId, reason, options.changedBy)

      if (success) {
        const duration = Date.now() - startTime
        
        logger.logTrace('subscription_service_change_plan_success', { 
          subscriptionId, 
          currentAccountTypeId: subscription.accountTypeId,
          newAccountTypeId,
          action,
          duration: `${duration}ms` 
        })

        return await Subscription.findById(subscriptionId)
      }

      throw new Error('Failed to change subscription plan')
    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.logError(error, {
        operation: 'subscription_service_change_plan',
        subscriptionId,
        newAccountTypeId,
        duration: `${duration}ms`
      })
      
      throw error
    }
  }

  // Cancel subscription
  static async cancelSubscription(subscriptionId, reason = 'user_requested', options = {}) {
    const startTime = Date.now()
    
    logger.logTrace('subscription_service_cancel_start', { 
      subscriptionId 
    })

    try {
      const subscription = await Subscription.findById(subscriptionId)
      if (!subscription) {
        throw new Error('Subscription not found')
      }

      const success = await subscription.cancel(reason, options.changedBy)
      
      if (success) {
        const duration = Date.now() - startTime
        
        logger.logTrace('subscription_service_cancel_success', { 
          subscriptionId,
          reason,
          duration: `${duration}ms` 
        })

        return await Subscription.findById(subscriptionId)
      }

      throw new Error('Failed to cancel subscription')
    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.logError(error, {
        operation: 'subscription_service_cancel',
        subscriptionId,
        duration: `${duration}ms`
      })
      
      throw error
    }
  }

  // Get user's current subscription with account type details
  static async getUserSubscription(userId) {
    if (this.getPlansDisabled()) {
      return {
        subscription: { isActive: true, isInTrial: false, isExpired: false },
        accountType: { name: 'free', displayName: 'Free Plan', features: {} }
      }
    }
    // Prefer active subscription
    let subscription = await Subscription.findActiveByUserId(userId)

    // Fall back to latest pending subscription (e.g., upgrade requested but unpaid)
    if (!subscription) {
      subscription = await Subscription.findPendingByUserId(userId)
    }

    if (!subscription) {
      return null
    }

    const accountType = await subscription.getAccountType()
    return {
      subscription: subscription.toJSON(),
      accountType: accountType ? accountType.toJSON() : null
    }
  }

  // Get user's subscription history
  static async getUserSubscriptionHistory(userId, limit = 50, offset = 0) {
    const history = await SubscriptionHistory.findByUserId(userId, limit, offset)
    
    // Enrich with account type names
    const enrichedHistory = await Promise.all(
      history.map(async (entry) => {
        const historyData = entry.toJSON()
        
        if (entry.previousAccountTypeId) {
          const prevAccountType = await AccountType.findById(entry.previousAccountTypeId)
          historyData.previousAccountType = prevAccountType ? prevAccountType.toJSON() : null
        }
        
        if (entry.newAccountTypeId) {
          const newAccountType = await AccountType.findById(entry.newAccountTypeId)
          historyData.newAccountType = newAccountType ? newAccountType.toJSON() : null
        }
        
        return historyData
      })
    )

    return enrichedHistory
  }

  // Check if user can upgrade/downgrade to specific account type
  static async canChangeToAccountType(userId, targetAccountTypeId) {
    const subscription = await Subscription.findActiveByUserId(userId)
    
    if (!subscription) {
      // User has no subscription, can create one
      return { canChange: true, reason: 'no_active_subscription' }
    }

    const currentAccountType = await AccountType.findById(subscription.accountTypeId)
    const targetAccountType = await AccountType.findById(targetAccountTypeId)
    
    if (!currentAccountType || !targetAccountType) {
      return { canChange: false, reason: 'account_type_not_found' }
    }

    // Check if it's the same account type
    if (subscription.accountTypeId === targetAccountTypeId) {
      return { canChange: false, reason: 'same_account_type' }
    }

    // Check subscription status
    if (subscription.status !== 'active') {
      return { canChange: false, reason: 'subscription_not_active' }
    }

    return { canChange: true, reason: 'can_change' }
  }

  // Get available account types for upgrade/downgrade
  static async getAvailableAccountTypes(userId) {
    if (this.getPlansDisabled()) {
      return []
    }
    const subscription = await Subscription.findActiveByUserId(userId)
    const allAccountTypes = await AccountType.findAll()
    
    if (!subscription) {
      // User has no subscription, return all active account types
      return allAccountTypes.map(type => ({
        ...type.toJSON(),
        canSelect: true,
        reason: 'no_active_subscription'
      }))
    }

    const currentAccountType = await AccountType.findById(subscription.accountTypeId)
    
    return allAccountTypes.map(type => {
      const canChange = subscription.accountTypeId !== type.id && subscription.status === 'active'
      const isUpgrade = type.priceMonthly > currentAccountType.priceMonthly
      const isDowngrade = type.priceMonthly < currentAccountType.priceMonthly
      
      return {
        ...type.toJSON(),
        canSelect: canChange,
        reason: canChange ? (isUpgrade ? 'upgrade_available' : 'downgrade_available') : 'same_or_inactive',
        isUpgrade,
        isDowngrade,
        priceDifference: type.priceMonthly - currentAccountType.priceMonthly
      }
    })
  }

  // Process subscription limits and usage
  static async checkSubscriptionLimits(userId, action, resourceId = null) {
    const plansDisabled = this.getPlansDisabled()
    console.log('[DEBUG] SubscriptionService.checkSubscriptionLimits:', {
      userId,
      action,
      plansDisabled
    })
    
    if (plansDisabled) {
      return { allowed: true, limit: Number.MAX_SAFE_INTEGER, current: 0, remaining: Number.MAX_SAFE_INTEGER }
    }
    const subscription = await Subscription.findActiveByUserId(userId)
    
    if (!subscription) {
      // User has no subscription, use free plan limits
      const freeAccountType = await AccountType.findByName('free')
      if (!freeAccountType) {
        throw new Error('Free account type not found')
      }
      
      return await this.checkLimitsAgainstAccountType(userId, freeAccountType, action, resourceId)
    }

    const accountType = await subscription.getAccountType()
    return await this.checkLimitsAgainstAccountType(userId, accountType, action, resourceId)
  }

  // Check limits against specific account type
  static async checkLimitsAgainstAccountType(userId, accountType, action, resourceId = null) {
    if (this.getPlansDisabled()) {
      return { allowed: true, limit: Number.MAX_SAFE_INTEGER, current: 0, remaining: Number.MAX_SAFE_INTEGER }
    }
    const preferences = await UserPreferences.findByUserId(userId)
    
    // If no preferences exist, user has no permissions
    if (!preferences) {
      return {
        allowed: false,
        limit: 0,
        current: 0,
        remaining: 0,
        reason: 'no_preferences'
      }
    }

    switch (action) {
      case 'create_form':
        const canCreateForm = await preferences.canCreateForm()
        return {
          allowed: canCreateForm,
          limit: accountType.maxForms,
          current: await preferences.getCurrentFormCount(),
          remaining: Math.max(0, accountType.maxForms - await preferences.getCurrentFormCount())
        }

      case 'create_submission':
        if (!resourceId) {
          throw new Error('Form ID required for submission limit check')
        }
        const canCreateSubmission = await preferences.canCreateSubmission(resourceId)
        return {
          allowed: canCreateSubmission,
          limit: accountType.maxSubmissionsPerForm,
          current: await preferences.getCurrentSubmissionCount(resourceId),
          remaining: Math.max(0, accountType.maxSubmissionsPerForm - await preferences.getCurrentSubmissionCount(resourceId))
        }

      case 'export_form':
        if (!resourceId) {
          throw new Error('Form ID required for export limit check')
        }
        const canExportForm = await preferences.canExportFormWithinLimits(resourceId)
        return {
          allowed: canExportForm,
          limit: accountType.maxExportsPerForm,
          current: await preferences.getCurrentFormExportCount(resourceId),
          remaining: Math.max(0, accountType.maxExportsPerForm - await preferences.getCurrentFormExportCount(resourceId))
        }

      case 'export_submission':
        if (!resourceId) {
          throw new Error('Submission ID required for export limit check')
        }
        const canExportSubmission = await preferences.canExportSubmissionWithinLimits(resourceId)
        return {
          allowed: canExportSubmission,
          limit: accountType.maxExportsPerSubmission,
          current: await preferences.getCurrentSubmissionExportCount(resourceId),
          remaining: Math.max(0, accountType.maxExportsPerSubmission - await preferences.getCurrentSubmissionExportCount(resourceId))
        }

      default:
        throw new Error('Unknown action for limit check')
    }
  }

  // Get subscription usage statistics
  static async getSubscriptionUsage(userId) {
    const subscription = await Subscription.findActiveByUserId(userId)
    
    if (!subscription) {
      return null
    }

    const accountType = await subscription.getAccountType()
    const preferences = await UserPreferences.findByUserId(userId)
    
    if (!preferences) {
      return null
    }

    const formCount = await preferences.getCurrentFormCount()
    
    // Get submission counts for all user's forms
    const sql = `
      SELECT f.id, f.title, COUNT(fs.id) as submission_count
      FROM forms f
      LEFT JOIN form_submissions fs ON f.id = fs.form_id
      WHERE f.user_id = ?
      GROUP BY f.id, f.title
    `
    const result = await executeQuery(sql, [userId])
    
    const formStats = result.success ? result.data : []
    const totalSubmissions = formStats.reduce((sum, form) => sum + form.submission_count, 0)

    return {
      subscription: subscription.toJSON(),
      accountType: accountType.toJSON(),
      usage: {
        forms: {
          current: formCount,
          limit: accountType.maxForms,
          remaining: Math.max(0, accountType.maxForms - formCount),
          percentage: Math.round((formCount / accountType.maxForms) * 100)
        },
        submissions: {
          current: totalSubmissions,
          limit: accountType.maxSubmissionsPerForm,
          perForm: formStats.map(form => ({
            formId: form.id,
            formTitle: form.title,
            current: form.submission_count,
            limit: accountType.maxSubmissionsPerForm,
            remaining: Math.max(0, accountType.maxSubmissionsPerForm - form.submission_count)
          }))
        },
        exports: {
          formsAllowed: accountType.canExportForms,
          submissionsAllowed: accountType.canExportSubmissions,
          maxExportsPerForm: accountType.maxExportsPerForm,
          maxExportsPerSubmission: accountType.maxExportsPerSubmission
        }
      }
    }
  }

  // Handle subscription expiration
  static async handleExpiredSubscriptions() {
    const startTime = Date.now()
    
    logger.logTrace('subscription_service_handle_expired_start')

    try {
      // Find expired subscriptions
      const sql = `
        SELECT * FROM subscriptions 
        WHERE status = 'active' 
        AND end_date < NOW() 
        AND auto_renew = FALSE
      `
      const result = await executeQuery(sql)

      if (!result.success || result.data.length === 0) {
        logger.logTrace('subscription_service_handle_expired_no_expired')
        return { processed: 0 }
      }

      let processed = 0
      
      for (const subscriptionData of result.data) {
        const subscription = new Subscription(subscriptionData)
        
        // Update subscription status to expired
        await subscription.update({ status: 'expired' })
        
        // Record in history
        await SubscriptionHistory.recordChange({
          subscriptionId: subscription.id,
          userId: subscription.userId,
          action: 'expired',
          previousStatus: 'active',
          newStatus: 'expired',
          reason: 'subscription_expired',
          metadata: { expiredAt: new Date().toISOString() }
        })

        // Update user preferences to free plan
        await subscription.updateUserPreferencesToFree()
        
        processed++
      }

      const duration = Date.now() - startTime
      
      logger.logTrace('subscription_service_handle_expired_success', { 
        processed,
        duration: `${duration}ms` 
      })

      return { processed }
    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.logError(error, {
        operation: 'subscription_service_handle_expired',
        duration: `${duration}ms`
      })
      
      throw error
    }
  }

  // Activate a subscription after successful payment
  static async activateSubscription(subscriptionId, activationData = {}) {
    const startTime = Date.now()
    logger.logTrace('subscription_service_activate_start', { subscriptionId })

    try {
      const subscription = await Subscription.findById(subscriptionId)
      if (!subscription) {
        throw new Error('Subscription not found')
      }

      const accountType = await AccountType.findById(subscription.accountTypeId)
      if (!accountType) {
        throw new Error('Account type not found')
      }

      // Compute next dates for recurring plans
      const now = new Date()
      let endDate = subscription.endDate
      let nextBillingDate = subscription.nextBillingDate

      if (!endDate || !nextBillingDate) {
        if (subscription.billingCycle === 'yearly') {
          endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
        } else {
          endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        }
        nextBillingDate = endDate
      }

      // Apply any pending plan change on activation
      const metadata = subscription.metadata || {}
      if (metadata.pendingPlanChange?.targetAccountTypeId) {
        subscription.accountTypeId = metadata.pendingPlanChange.targetAccountTypeId
        // Clear pending flag
        metadata.pendingPlanChange = null
      }

      // Update subscription to active
      await subscription.update({
        status: 'active',
        endDate,
        nextBillingDate,
        paymentProvider: activationData.paymentProvider || activationData.provider || subscription.paymentProvider || null,
        paymentProviderSubscriptionId: activationData.paymentProviderSubscriptionId || activationData.providerSubscriptionId || subscription.paymentProviderSubscriptionId || null,
        paymentMethodId: activationData.paymentMethodId || subscription.paymentMethodId || null,
        accountTypeId: subscription.accountTypeId,
        metadata
      })

      // Record in history
      await SubscriptionHistory.recordChange({
        subscriptionId: subscription.id,
        userId: subscription.userId,
        action: 'activated',
        previousStatus: subscription.status,
        newStatus: 'active',
        reason: activationData.reason || 'payment_succeeded',
        metadata: activationData,
        changedBy: activationData.changedBy || null,
        ipAddress: activationData.ipAddress || null,
        userAgent: activationData.userAgent || null
      })

      // Ensure user preferences reflect the plan
      await subscription.updateUserPreferencesToAccountType(subscription.accountTypeId)

      const duration = Date.now() - startTime
      logger.logTrace('subscription_service_activate_success', { subscriptionId, duration: `${duration}ms` })
      return await Subscription.findById(subscriptionId)
    } catch (error) {
      const duration = Date.now() - startTime
      logger.logError(error, { operation: 'subscription_service_activate', subscriptionId, duration: `${duration}ms` })
      throw error
    }
  }

  // Handle payment failure for a subscription
  static async handlePaymentFailure(subscriptionId, failureData = {}) {
    const startTime = Date.now()
    logger.logTrace('subscription_service_payment_failed_start', { subscriptionId })

    try {
      const subscription = await Subscription.findById(subscriptionId)
      if (!subscription) {
        throw new Error('Subscription not found')
      }

      // Move to pending or suspended based on retry count if provided
      const retryCount = failureData.retryCount ?? 0
      const newStatus = retryCount >= 3 ? 'suspended' : 'pending'

      await subscription.update({ status: newStatus })

      await SubscriptionHistory.recordChange({
        subscriptionId: subscription.id,
        userId: subscription.userId,
        action: 'payment_failed',
        previousStatus: subscription.status,
        newStatus,
        reason: failureData.reason || 'payment_failed',
        metadata: failureData
      })

      const duration = Date.now() - startTime
      logger.logTrace('subscription_service_payment_failed_success', { subscriptionId, newStatus, duration: `${duration}ms` })
      return await Subscription.findById(subscriptionId)
    } catch (error) {
      const duration = Date.now() - startTime
      logger.logError(error, { operation: 'subscription_service_payment_failed', subscriptionId, duration: `${duration}ms` })
      throw error
    }
  }
}
