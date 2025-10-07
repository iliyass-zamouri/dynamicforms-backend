import { executeQuery, executeTransaction } from '../database/connection.js'
import logger from '../utils/logger.js'
import { AccountType } from './AccountType.js'
import { UserPreferences } from './UserPreferences.js'

export class Subscription {
  constructor(data) {
    this.id = data.id
    this.userId = data.user_id
    this.accountTypeId = data.account_type_id
    this.planType = data.plan_type
    this.status = data.status
    this.billingCycle = data.billing_cycle
    this.amount = data.amount
    this.currency = data.currency
    this.startDate = data.start_date
    this.endDate = data.end_date
    this.nextBillingDate = data.next_billing_date
    this.cancelledAt = data.cancelled_at
    this.paymentProvider = data.payment_provider
    this.paymentProviderSubscriptionId = data.payment_provider_subscription_id
    this.paymentMethodId = data.payment_method_id
    this.trialStartDate = data.trial_start_date
    this.trialEndDate = data.trial_end_date
    this.isTrial = data.is_trial
    this.autoRenew = data.auto_renew
    this.metadata = data.metadata
    this.createdAt = data.created_at
    this.updatedAt = data.updated_at
  }

  // Create a new subscription
  static async create(subscriptionData) {
    const startTime = Date.now()
    
    logger.logTrace('subscription_create_start', { 
      userId: subscriptionData.userId, 
      accountTypeId: subscriptionData.accountTypeId 
    })

    try {
      const subscriptionId = crypto.randomUUID()
      
      // Get account type details
      const accountType = await AccountType.findById(subscriptionData.accountTypeId)
      if (!accountType) {
        throw new Error('Account type not found')
      }

      // Determine plan type and calculate pricing
      const planType = subscriptionData.planType || (accountType.billingModel === 'lifetime' ? 'lifetime' : 'recurring')
      const amount = planType === 'lifetime' 
        ? accountType.priceLifetime 
        : (subscriptionData.billingCycle === 'yearly' ? accountType.priceYearly : accountType.priceMonthly)

      // Calculate dates
      const startDate = new Date()
      let endDate = null
      let nextBillingDate = null
      
      if (planType === 'recurring') {
        endDate = subscriptionData.billingCycle === 'yearly' 
          ? new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000)
          : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        nextBillingDate = endDate
      }

      const sql = `
        INSERT INTO subscriptions (
          id, user_id, account_type_id, plan_type, status, billing_cycle, amount, currency,
          start_date, end_date, next_billing_date, payment_provider,
          payment_provider_subscription_id, payment_method_id, trial_start_date,
          trial_end_date, is_trial, auto_renew, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      const result = await executeQuery(sql, [
        subscriptionId,
        subscriptionData.userId,
        subscriptionData.accountTypeId,
        planType,
        subscriptionData.status || 'pending',
        subscriptionData.billingCycle,
        amount,
        subscriptionData.currency || 'USD',
        startDate,
        endDate,
        nextBillingDate,
        subscriptionData.paymentProvider || null,
        subscriptionData.paymentProviderSubscriptionId || null,
        subscriptionData.paymentMethodId || null,
        subscriptionData.trialStartDate || null,
        subscriptionData.trialEndDate || null,
        subscriptionData.isTrial || false,
        planType === 'recurring' ? (subscriptionData.autoRenew !== false) : false,
        JSON.stringify(subscriptionData.metadata || {})
      ])

      if (result.success) {
        const subscription = await Subscription.findById(subscriptionId)
        const duration = Date.now() - startTime
        
        logger.logTrace('subscription_create_success', { 
          subscriptionId: subscription?.id, 
          userId: subscriptionData.userId,
          accountTypeId: subscriptionData.accountTypeId,
          duration: `${duration}ms` 
        })
        
        return subscription
      }

      logger.logTrace('subscription_create_failed', { 
        userId: subscriptionData.userId,
        accountTypeId: subscriptionData.accountTypeId,
        reason: 'Database insert failed',
        duration: `${Date.now() - startTime}ms`
      })

      return null
    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.logError(error, {
        operation: 'subscription_create',
        userId: subscriptionData.userId,
        accountTypeId: subscriptionData.accountTypeId,
        duration: `${duration}ms`
      })
      
      throw error
    }
  }

  // Find subscription by ID
  static async findById(id) {
    const sql = 'SELECT * FROM subscriptions WHERE id = ?'
    const result = await executeQuery(sql, [id])

    if (result.success && result.data.length > 0) {
      const subscription = new Subscription(result.data[0])
      
      // Parse metadata JSON
      if (subscription.metadata && typeof subscription.metadata === 'string') {
        try {
          subscription.metadata = JSON.parse(subscription.metadata)
        } catch (error) {
          subscription.metadata = {}
        }
      }
      
      return subscription
    }

    return null
  }

  // Find active subscription by user ID
  static async findActiveByUserId(userId) {
    const sql = `
      SELECT s.* FROM subscriptions s 
      WHERE s.user_id = ? AND s.status = 'active'
      ORDER BY s.created_at DESC 
      LIMIT 1
    `
    const result = await executeQuery(sql, [userId])

    if (result.success && result.data.length > 0) {
      const subscription = new Subscription(result.data[0])
      
      // Parse metadata JSON
      if (subscription.metadata && typeof subscription.metadata === 'string') {
        try {
          subscription.metadata = JSON.parse(subscription.metadata)
        } catch (error) {
          subscription.metadata = {}
        }
      }
      
      return subscription
    }

    return null
  }

  // Find pending subscription by user ID
  static async findPendingByUserId(userId) {
    const sql = 'SELECT * FROM subscriptions WHERE user_id = ? AND status = "pending" ORDER BY created_at DESC LIMIT 1'
    const result = await executeQuery(sql, [userId])

    if (result.success && result.data.length > 0) {
      const subscription = new Subscription(result.data[0])
      
      // Parse metadata JSON
      if (subscription.metadata && typeof subscription.metadata === 'string') {
        try {
          subscription.metadata = JSON.parse(subscription.metadata)
        } catch (error) {
          subscription.metadata = {}
        }
      }
      
      return subscription
    }

    return null
  }

  // Find subscription by Stripe subscription ID
  static async findByStripeSubscriptionId(stripeSubscriptionId) {
    const sql = 'SELECT * FROM subscriptions WHERE payment_provider_subscription_id = ?'
    const result = await executeQuery(sql, [stripeSubscriptionId])

    if (result.success && result.data.length > 0) {
      const subscription = new Subscription(result.data[0])
      
      // Parse metadata JSON
      if (subscription.metadata && typeof subscription.metadata === 'string') {
        try {
          subscription.metadata = JSON.parse(subscription.metadata)
        } catch (error) {
          subscription.metadata = {}
        }
      }
      
      return subscription
    }

    return null
  }

  // Find all subscriptions (use with caution - can be expensive)
  static async findAll(limit = 100) {
    const sql = 'SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT ?'
    const result = await executeQuery(sql, [limit])

    if (result.success && result.data.length > 0) {
      return result.data.map(row => {
        const subscription = new Subscription(row)
        
        // Parse metadata JSON
        if (subscription.metadata && typeof subscription.metadata === 'string') {
          try {
            subscription.metadata = JSON.parse(subscription.metadata)
          } catch (error) {
            subscription.metadata = {}
          }
        }
        
        return subscription
      })
    }

    return []
  }

  // Update Stripe subscription information
  async updateStripeInfo(stripeSubscriptionId, stripeCustomerId) {
    const sql = `
      UPDATE subscriptions 
      SET payment_provider = 'stripe',
          payment_provider_subscription_id = ?,
          payment_provider_customer_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    
    const result = await executeQuery(sql, [stripeSubscriptionId, stripeCustomerId, this.id])
    
    if (result.success) {
      this.paymentProvider = 'stripe'
      this.paymentProviderSubscriptionId = stripeSubscriptionId
      this.paymentProviderCustomerId = stripeCustomerId
      logger.info('Subscription Stripe info updated', {
        subscriptionId: this.id,
        stripeSubscriptionId,
        stripeCustomerId
      })
    }
    
    return result
  }

  // Find all subscriptions by user ID
  static async findByUserId(userId, includeInactive = false) {
    const sql = includeInactive 
      ? 'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM subscriptions WHERE user_id = ? AND status IN ("active", "pending") ORDER BY created_at DESC'
    
    const result = await executeQuery(sql, [userId])

    if (result.success) {
      return result.data.map((subscription) => {
        const sub = new Subscription(subscription)
        
        // Parse metadata JSON
        if (sub.metadata && typeof sub.metadata === 'string') {
          try {
            sub.metadata = JSON.parse(sub.metadata)
          } catch (error) {
            sub.metadata = {}
          }
        }
        
        return sub
      })
    }

    return []
  }

  // Update subscription
  async update(updateData) {
    const allowedFields = [
      'accountTypeId', 'status', 'billingCycle', 'amount', 'currency', 'endDate', 'nextBillingDate',
      'cancelledAt', 'paymentProvider', 'paymentProviderSubscriptionId', 
      'paymentMethodId', 'trialStartDate', 'trialEndDate', 'isTrial', 
      'autoRenew', 'metadata'
    ]

    const updates = []
    const values = []

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        const dbField = key === 'billingCycle' ? 'billing_cycle' :
                       key === 'accountTypeId' ? 'account_type_id' :
                       key === 'endDate' ? 'end_date' :
                       key === 'nextBillingDate' ? 'next_billing_date' :
                       key === 'cancelledAt' ? 'cancelled_at' :
                       key === 'paymentProvider' ? 'payment_provider' :
                       key === 'paymentProviderSubscriptionId' ? 'payment_provider_subscription_id' :
                       key === 'paymentMethodId' ? 'payment_method_id' :
                       key === 'trialStartDate' ? 'trial_start_date' :
                       key === 'trialEndDate' ? 'trial_end_date' :
                       key === 'isTrial' ? 'is_trial' :
                       key === 'autoRenew' ? 'auto_renew' : key

        updates.push(`${dbField} = ?`)
        
        // Handle JSON fields
        if (key === 'metadata') {
          values.push(JSON.stringify(value))
        } else {
          values.push(value)
        }
      }
    }

    if (updates.length === 0) {
      return false
    }

    values.push(this.id)
    const sql = `UPDATE subscriptions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`

    const result = await executeQuery(sql, values)
    return result.success
  }

  // Cancel subscription
  async cancel(reason = 'user_requested', cancelledBy = null) {
    const cancelledAt = new Date()
    
    const updateData = {
      status: 'cancelled',
      cancelledAt: cancelledAt,
      autoRenew: false
    }

    const success = await this.update(updateData)
    
    if (success) {
      // Record in history
      await SubscriptionHistory.recordChange({
        subscriptionId: this.id,
        userId: this.userId,
        action: 'cancelled',
        previousStatus: this.status,
        newStatus: 'cancelled',
        reason: reason,
        changedBy: cancelledBy,
        metadata: { cancelledAt: cancelledAt.toISOString() }
      })

      // Update user preferences to free plan
      await this.updateUserPreferencesToFree()
    }

    return success
  }

  // Upgrade request: defer actual plan switch until payment confirmation
  async upgrade(newAccountTypeId, reason = 'upgrade_requested', changedBy = null) {
    const startTime = Date.now()
    
    logger.logTrace('subscription_upgrade_start', { 
      subscriptionId: this.id, 
      newAccountTypeId 
    })

    try {
      const newAccountType = await AccountType.findById(newAccountTypeId)
      if (!newAccountType) {
        throw new Error('New account type not found')
      }

      const previousAccountTypeId = this.accountTypeId
      const previousAmount = this.amount

      // Defer actual switch until payment succeeded via webhook
      const pendingChange = {
        type: 'upgrade',
        targetAccountTypeId: newAccountTypeId,
        requestedAt: new Date().toISOString()
      }

      const success = await this.update({
        status: 'pending',
        metadata: { ...(this.metadata || {}), pendingPlanChange: pendingChange }
      })
      
      if (success) {
        // Record request in history (no plan switch yet)
        await SubscriptionHistory.recordChange({
          subscriptionId: this.id,
          userId: this.userId,
          action: 'upgrade_requested',
          previousAccountTypeId: previousAccountTypeId,
          newAccountTypeId: newAccountTypeId,
          previousAmount: previousAmount,
          newAmount: null,
          reason: reason,
          changedBy: changedBy
        })

        const duration = Date.now() - startTime
        
        logger.logTrace('subscription_upgrade_success', { 
          subscriptionId: this.id, 
          previousAccountTypeId,
          newAccountTypeId,
          duration: `${duration}ms` 
        })

        return true
      }

      return false
    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.logError(error, {
        operation: 'subscription_upgrade',
        subscriptionId: this.id,
        newAccountTypeId,
        duration: `${duration}ms`
      })
      
      throw error
    }
  }

  // Downgrade request: defer actual plan switch until confirmation
  async downgrade(newAccountTypeId, reason = 'downgrade_requested', changedBy = null) {
    const startTime = Date.now()
    
    logger.logTrace('subscription_downgrade_start', { 
      subscriptionId: this.id, 
      newAccountTypeId 
    })

    try {
      const newAccountType = await AccountType.findById(newAccountTypeId)
      if (!newAccountType) {
        throw new Error('New account type not found')
      }

      const previousAccountTypeId = this.accountTypeId
      const previousAmount = this.amount

      const pendingChange = {
        type: 'downgrade',
        targetAccountTypeId: newAccountTypeId,
        requestedAt: new Date().toISOString()
      }

      const success = await this.update({
        status: 'pending',
        metadata: { ...(this.metadata || {}), pendingPlanChange: pendingChange }
      })
      
      if (success) {
        // Record request in history (no plan switch yet)
        await SubscriptionHistory.recordChange({
          subscriptionId: this.id,
          userId: this.userId,
          action: 'downgrade_requested',
          previousAccountTypeId: previousAccountTypeId,
          newAccountTypeId: newAccountTypeId,
          previousAmount: previousAmount,
          newAmount: null,
          reason: reason,
          changedBy: changedBy
        })

        const duration = Date.now() - startTime
        
        logger.logTrace('subscription_downgrade_success', { 
          subscriptionId: this.id, 
          previousAccountTypeId,
          newAccountTypeId,
          duration: `${duration}ms` 
        })

        return true
      }

      return false
    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.logError(error, {
        operation: 'subscription_downgrade',
        subscriptionId: this.id,
        newAccountTypeId,
        duration: `${duration}ms`
      })
      
      throw error
    }
  }

  // Update user preferences to match account type
  async updateUserPreferencesToAccountType(accountTypeId) {
    const accountType = await AccountType.findById(accountTypeId)
    if (!accountType) {
      throw new Error('Account type not found')
    }

    let preferences = await UserPreferences.findByUserId(this.userId)
    
    // Create preferences if they don't exist when user subscribes
    if (!preferences) {
      preferences = await UserPreferences.createDefault(this.userId, accountType.name)
    } else {
      await preferences.updateToAccountTypeDefaults(accountType.name)
    }
    
    // Update subscription reference if preferences exist
    if (preferences) {
      await preferences.update({ subscriptionId: this.id })
    }
  }

  // Update user preferences to free plan
  async updateUserPreferencesToFree() {
    const preferences = await UserPreferences.findByUserId(this.userId)
    if (preferences) {
      await preferences.updateToAccountTypeDefaults('free')
      
      // Remove subscription reference
      await preferences.update({ subscriptionId: null })
    }
  }

  // Get account type details
  async getAccountType() {
    return await AccountType.findById(this.accountTypeId)
  }

  // Check if subscription is active
  isActive() {
    return this.status === 'active'
  }

  // Check if subscription is in trial
  isInTrial() {
    if (!this.isTrial || !this.trialEndDate) {
      return false
    }
    
    const now = new Date()
    const trialEnd = new Date(this.trialEndDate)
    return now < trialEnd
  }

  // Check if subscription is expired
  isExpired() {
    // Lifetime plans never expire
    if (this.planType === 'lifetime') {
      return false
    }
    
    if (!this.endDate) {
      return false
    }
    
    const now = new Date()
    const endDate = new Date(this.endDate)
    return now > endDate
  }

  // Get days until expiration
  getDaysUntilExpiration() {
    if (!this.endDate) {
      return null
    }
    
    const now = new Date()
    const endDate = new Date(this.endDate)
    const diffTime = endDate - now
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      accountTypeId: this.accountTypeId,
      planType: this.planType,
      status: this.status,
      billingCycle: this.billingCycle,
      amount: this.amount,
      currency: this.currency,
      startDate: this.startDate,
      endDate: this.endDate,
      nextBillingDate: this.nextBillingDate,
      cancelledAt: this.cancelledAt,
      paymentProvider: this.paymentProvider,
      paymentProviderSubscriptionId: this.paymentProviderSubscriptionId,
      paymentMethodId: this.paymentMethodId,
      trialStartDate: this.trialStartDate,
      trialEndDate: this.trialEndDate,
      isTrial: this.isTrial,
      autoRenew: this.autoRenew,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive(),
      isInTrial: this.isInTrial(),
      isExpired: this.isExpired(),
      daysUntilExpiration: this.getDaysUntilExpiration()
    }
  }
}

// Subscription History class
export class SubscriptionHistory {
  constructor(data) {
    this.id = data.id
    this.subscriptionId = data.subscription_id
    this.userId = data.user_id
    this.action = data.action
    this.previousAccountTypeId = data.previous_account_type_id
    this.newAccountTypeId = data.new_account_type_id
    this.previousStatus = data.previous_status
    this.newStatus = data.new_status
    this.previousAmount = data.previous_amount
    this.newAmount = data.new_amount
    this.previousBillingCycle = data.previous_billing_cycle
    this.newBillingCycle = data.new_billing_cycle
    this.reason = data.reason
    this.metadata = data.metadata
    this.changedBy = data.changed_by
    this.ipAddress = data.ip_address
    this.userAgent = data.user_agent
    this.createdAt = data.created_at
  }

  // Record a subscription change
  static async recordChange(changeData) {
    const historyId = crypto.randomUUID()
    
    const sql = `
      INSERT INTO subscription_history (
        id, subscription_id, user_id, action, previous_account_type_id, new_account_type_id,
        previous_status, new_status, previous_amount, new_amount, previous_billing_cycle,
        new_billing_cycle, reason, metadata, changed_by, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const result = await executeQuery(sql, [
      historyId,
      changeData.subscriptionId,
      changeData.userId,
      changeData.action,
      changeData.previousAccountTypeId || null,
      changeData.newAccountTypeId || null,
      changeData.previousStatus || null,
      changeData.newStatus || null,
      changeData.previousAmount || null,
      changeData.newAmount || null,
      changeData.previousBillingCycle || null,
      changeData.newBillingCycle || null,
      changeData.reason || null,
      JSON.stringify(changeData.metadata || {}),
      changeData.changedBy || null,
      changeData.ipAddress || null,
      changeData.userAgent || null
    ])

    return result.success
  }

  // Get subscription history
  static async findBySubscriptionId(subscriptionId, limit = 50, offset = 0) {
    const sql = `
      SELECT * FROM subscription_history 
      WHERE subscription_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `
    const result = await executeQuery(sql, [subscriptionId, limit, offset])

    if (result.success) {
      return result.data.map((history) => {
        const h = new SubscriptionHistory(history)
        
        // Parse metadata JSON
        if (h.metadata && typeof h.metadata === 'string') {
          try {
            h.metadata = JSON.parse(h.metadata)
          } catch (error) {
            h.metadata = {}
          }
        }
        
        return h
      })
    }

    return []
  }

  // Get user subscription history
  static async findByUserId(userId, limit = 50, offset = 0) {
    const sql = `
      SELECT * FROM subscription_history 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `
    const result = await executeQuery(sql, [userId, limit, offset])

    if (result.success) {
      return result.data.map((history) => {
        const h = new SubscriptionHistory(history)
        
        // Parse metadata JSON
        if (h.metadata && typeof h.metadata === 'string') {
          try {
            h.metadata = JSON.parse(h.metadata)
          } catch (error) {
            h.metadata = {}
          }
        }
        
        return h
      })
    }

    return []
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      subscriptionId: this.subscriptionId,
      userId: this.userId,
      action: this.action,
      previousAccountTypeId: this.previousAccountTypeId,
      newAccountTypeId: this.newAccountTypeId,
      previousStatus: this.previousStatus,
      newStatus: this.newStatus,
      previousAmount: this.previousAmount,
      newAmount: this.newAmount,
      previousBillingCycle: this.previousBillingCycle,
      newBillingCycle: this.newBillingCycle,
      reason: this.reason,
      metadata: this.metadata,
      changedBy: this.changedBy,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      createdAt: this.createdAt
    }
  }
}
