import express from 'express'
import { SubscriptionService } from '../services/subscriptionService.js'
import { AccountType } from '../models/AccountType.js'
import { Subscription } from '../models/Subscription.js'
import { authenticateToken, optionalAuth } from '../middleware/auth.js'
import logger from '../utils/logger.js'
import PaymentService from '../services/paymentService.js'

const router = express.Router()

/**
 * @swagger
 * /api/subscriptions/current:
 *   get:
 *     summary: Get current user's subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription retrieved successfully
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
 *                         subscription:
 *                           $ref: '#/components/schemas/Subscription'
 *                         accountType:
 *                           $ref: '#/components/schemas/AccountType'
 *       401:
 *         description: Unauthorized
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
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const subscriptionData = await SubscriptionService.getUserSubscription(req.user.id)
    
    res.json({
      success: true,
      data: subscriptionData
    })
  } catch (error) {
    logger.logError(error, {
      operation: 'get_current_subscription',
      userId: req.user?.id
    })
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscription'
    })
  }
})

/**
 * @swagger
 * /api/subscriptions/usage:
 *   get:
 *     summary: Get current subscription usage statistics
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
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
 *                         subscription:
 *                           $ref: '#/components/schemas/Subscription'
 *                         accountType:
 *                           $ref: '#/components/schemas/AccountType'
 *                         usage:
 *                           type: object
 *                           properties:
 *                             forms:
 *                               type: object
 *                               properties:
 *                                 current:
 *                                   type: integer
 *                                 limit:
 *                                   type: integer
 *                                 remaining:
 *                                   type: integer
 *                                 percentage:
 *                                   type: integer
 *                             submissions:
 *                               type: object
 *                               properties:
 *                                 current:
 *                                   type: integer
 *                                 limit:
 *                                   type: integer
 *                                 perForm:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                             exports:
 *                               type: object
 *                               properties:
 *                                 formsAllowed:
 *                                   type: boolean
 *                                 submissionsAllowed:
 *                                   type: boolean
 *                                 maxExportsPerForm:
 *                                   type: integer
 *                                 maxExportsPerSubmission:
 *                                   type: integer
 *       401:
 *         description: Unauthorized
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
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const usageData = await SubscriptionService.getSubscriptionUsage(req.user.id)
    
    res.json({
      success: true,
      data: usageData
    })
  } catch (error) {
    logger.logError(error, {
      operation: 'get_subscription_usage',
      userId: req.user?.id
    })
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve usage statistics'
    })
  }
})

/**
 * @swagger
 * /api/subscriptions/history:
 *   get:
 *     summary: Get user's subscription history
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of history entries to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of history entries to skip
 *     responses:
 *       200:
 *         description: Subscription history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SubscriptionHistory'
 *       401:
 *         description: Unauthorized
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
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query
    const history = await SubscriptionService.getUserSubscriptionHistory(
      req.user.id, 
      parseInt(limit), 
      parseInt(offset)
    )
    
    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    logger.logError(error, {
      operation: 'get_subscription_history',
      userId: req.user?.id
    })
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscription history'
    })
  }
})

/**
 * @swagger
 * /api/subscriptions/available-plans:
 *   get:
 *     summary: Get all available subscription plans with upgrade/downgrade flags
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         description: Bearer token (optional - if provided, includes upgrade/downgrade flags)
 *     responses:
 *       200:
 *         description: Available plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/AccountType'
 *                           - type: object
 *                             properties:
 *                               canSelect:
 *                                 type: boolean
 *                                 description: Whether the user can select this plan
 *                               reason:
 *                                 type: string
 *                                 description: Reason for canSelect status
 *                               isUpgrade:
 *                                 type: boolean
 *                                 description: Whether this is an upgrade from current plan (only when authenticated)
 *                               isDowngrade:
 *                                 type: boolean
 *                                 description: Whether this is a downgrade from current plan (only when authenticated)
 *                               priceDifference:
 *                                 type: number
 *                                 description: Price difference from current plan (only when authenticated)
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/available-plans', optionalAuth, async (req, res) => {
  try {
    let availablePlans
    
    // Check if user is authenticated
    if (req.user && req.user.id) {
      // User is authenticated - get plans with upgrade/downgrade flags
      availablePlans = await SubscriptionService.getAvailableAccountTypes(req.user.id)
    } else {
      // User is not authenticated - get basic plans with canSelect flags
      const allAccountTypes = await AccountType.findAll()
      availablePlans = allAccountTypes.map(type => ({
        ...type.toJSON(),
        canSelect: true,
        reason: 'no_active_subscription'
      }))
    }

    // Expose Stripe price IDs from dedicated stripe config
    availablePlans = availablePlans.map(plan => {
      const stripeMeta = plan.stripe || {}
      return {
        ...plan,
        stripePriceMonthly: stripeMeta.priceMonthly || plan.stripePriceMonthly || null,
        stripePriceYearly: stripeMeta.priceYearly || plan.stripePriceYearly || null
      }
    })
    
    res.json({
      success: true,
      data: availablePlans
    })
  } catch (error) {
    logger.logError(error, {
      operation: 'get_available_plans',
      userId: req.user?.id
    })
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available plans'
    })
  }
})

/**
 * @swagger
 * /api/subscriptions/create:
 *   post:
 *     summary: Create a new subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountTypeId
 *               - billingCycle
 *             properties:
 *               accountTypeId:
 *                 type: string
 *                 description: ID of the account type to subscribe to
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 description: Billing cycle for the subscription
 *               paymentProvider:
 *                 type: string
 *                 default: stripe
 *                 description: Payment provider (currently only 'stripe' is supported)
 *               priceId:
 *                 type: string
 *                 description: Stripe Price ID (required for paid plans)
 *               successUrl:
 *                 type: string
 *                 description: URL to redirect after successful payment (required for paid plans)
 *               cancelUrl:
 *                 type: string
 *                 description: URL to redirect if payment is cancelled (required for paid plans)
 *               customerId:
 *                 type: string
 *                 description: Existing Stripe customer ID (optional)
 *               isTrial:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is a trial subscription
 *               trialDays:
 *                 type: integer
 *                 description: Number of trial days (if isTrial is true)
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the subscription
 *     responses:
 *       201:
 *         description: Subscription created successfully
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
 *                         subscription:
 *                           $ref: '#/components/schemas/Subscription'
 *                         checkoutSession:
 *                           type: object
 *                           description: Stripe checkout session (for paid plans only)
 *                           properties:
 *                             id:
 *                               type: string
 *                             url:
 *                               type: string
 *                             provider:
 *                               type: string
 *       400:
 *         description: Bad request - missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already has an active subscription
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
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const {
      accountTypeId,
      billingCycle,
      paymentProvider = 'stripe',
      priceId,
      successUrl,
      cancelUrl,
      customerId,
      isTrial = false,
      trialDays,
      metadata = {}
    } = req.body

    if (!accountTypeId || !billingCycle) {
      return res.status(400).json({
        success: false,
        message: 'Account type ID and billing cycle are required'
      })
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        message: 'Billing cycle must be either "monthly" or "yearly"'
      })
    }

    const accountType = await AccountType.findById(accountTypeId)
    if (!accountType) {
      return res.status(400).json({ success: false, message: 'Account type not found' })
    }

    // If free plan (price 0), create as active directly
    const isFree = (accountType.priceMonthly === 0 && accountType.priceYearly === 0) || accountType.name === 'free'
    const isLifetime = accountType.billingModel === 'lifetime'

    // For paid plans, validate payment parameters
    if (!isFree) {
      if (paymentProvider === 'stripe' && (!priceId || !successUrl || !cancelUrl)) {
        return res.status(400).json({
          success: false,
          message: 'For Stripe payments: priceId, successUrl, and cancelUrl are required'
        })
      }
    }

    // Calculate trial dates if trial is requested
    let trialStartDate = null
    let trialEndDate = null
    if (isTrial && trialDays) {
      trialStartDate = new Date()
      trialEndDate = new Date(trialStartDate.getTime() + trialDays * 24 * 60 * 60 * 1000)
    }

    const subscription = await SubscriptionService.createSubscription(
      req.user.id,
      accountTypeId,
      billingCycle,
      {
        status: isFree ? 'active' : 'pending',
        autoRenew: isFree ? false : true,
        paymentProvider: isFree ? null : paymentProvider,
        isTrial: isFree ? false : isTrial,
        trialStartDate: isFree ? null : trialStartDate,
        trialEndDate: isFree ? null : trialEndDate,
        metadata,
        changedBy: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    )

    if (isFree) {
      // Already active; preferences are updated inside service for active status
      return res.status(201).json({ success: true, data: subscription.toJSON() })
    }

    // For paid plans (recurring or lifetime), create checkout session
    const session = await PaymentService.createCheckoutSession(subscription, req.user, {
      provider: paymentProvider,
      priceId,
      successUrl,
      cancelUrl,
      customerId,
      planType: isLifetime ? 'lifetime' : 'recurring'
    })

    logger.info('Checkout session created', {
      subscriptionId: subscription.id,
      userId: req.user.id,
      checkoutSessionId: session.id,
      priceId
    })

    res.status(201).json({
      success: true,
      data: {
        subscription: subscription.toJSON(),
        checkoutSession: session
      }
    })
  } catch (error) {
    logger.logError(error, {
      operation: 'create_subscription',
      userId: req.user?.id,
      body: req.body
    })

    if (error.message === 'User already has a pending subscription') {
      return res.status(409).json({
        success: false,
        message: error.message
      })
    }

    if (error.message === 'User already has an active subscription') {
      return res.status(409).json({
        success: false,
        message: error.message
      })
    }

    if (error.message === 'Account type not found') {
      return res.status(400).json({
        success: false,
        message: error.message
      })
    }

    if (error.message.includes('required')) {
      return res.status(400).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    })
  }
})

/**
 * @swagger
 * /api/subscriptions/{subscriptionId}/change-plan:
 *   put:
 *     summary: Change subscription plan (upgrade or downgrade)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the subscription to modify
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newAccountTypeId
 *             properties:
 *               newAccountTypeId:
 *                 type: string
 *                 description: ID of the new account type
 *               reason:
 *                 type: string
 *                 default: plan_change_requested
 *                 description: Reason for the plan change
 *     responses:
 *       200:
 *         description: Subscription plan changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Subscription not found
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
router.put('/:subscriptionId/change-plan', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.params
    const { newAccountTypeId, reason = 'plan_change_requested' } = req.body

    if (!newAccountTypeId) {
      return res.status(400).json({
        success: false,
        message: 'New account type ID is required'
      })
    }

    // Verify the subscription belongs to the user
    const subscription = await Subscription.findById(subscriptionId)
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      })
    }

    if (subscription.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const updatedSubscription = await SubscriptionService.changeSubscriptionPlan(
      subscriptionId,
      newAccountTypeId,
      reason,
      {
        changedBy: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    )

    res.json({
      success: true,
      data: updatedSubscription.toJSON()
    })
  } catch (error) {
    logger.logError(error, {
      operation: 'change_subscription_plan',
      userId: req.user?.id,
      subscriptionId: req.params.subscriptionId,
      body: req.body
    })

    if (error.message === 'Subscription not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    if (error.message === 'Account type not found') {
      return res.status(400).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to change subscription plan'
    })
  }
})

/**
 * @swagger
 * /api/subscriptions/{subscriptionId}/cancel:
 *   put:
 *     summary: Cancel subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the subscription to cancel
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 default: user_requested
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Subscription'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Subscription not found
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
router.put('/:subscriptionId/cancel', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.params
    const { reason = 'user_requested' } = req.body

    // Verify the subscription belongs to the user
    const subscription = await Subscription.findById(subscriptionId)
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      })
    }

    if (subscription.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const cancelledSubscription = await SubscriptionService.cancelSubscription(
      subscriptionId,
      reason,
      {
        changedBy: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    )

    res.json({
      success: true,
      data: cancelledSubscription.toJSON()
    })
  } catch (error) {
    logger.logError(error, {
      operation: 'cancel_subscription',
      userId: req.user?.id,
      subscriptionId: req.params.subscriptionId,
      body: req.body
    })

    if (error.message === 'Subscription not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    })
  }
})

/**
 * Start checkout for a pending plan change or new paid subscription
 * Body expects: { paymentProvider: 'stripe', priceId, successUrl, cancelUrl, customerId? }
 */
router.post('/:subscriptionId/checkout', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId } = req.params
    const { paymentProvider = 'stripe', priceId, successUrl, cancelUrl, customerId } = req.body

    const subscription = await Subscription.findById(subscriptionId)
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' })
    }

    if (subscription.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    if (paymentProvider !== 'stripe') {
      return res.status(400).json({ success: false, message: 'Only Stripe is supported for checkout' })
    }

    if (!priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({ success: false, message: 'priceId, successUrl and cancelUrl are required' })
    }

    const session = await PaymentService.createCheckoutSession(subscription, req.user, {
      provider: 'stripe',
      priceId,
      successUrl,
      cancelUrl,
      customerId,
      planType: subscription.planType || 'recurring'
    })

    res.json({ success: true, data: { checkoutSession: session } })
  } catch (error) {
    logger.logError(error, { operation: 'start_subscription_checkout', userId: req.user?.id, params: req.params, body: req.body })
    res.status(500).json({ success: false, message: 'Failed to start checkout' })
  }
})

/**
 * @swagger
 * /api/subscriptions/check-limits:
 *   post:
 *     summary: Check subscription limits for a specific action
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [create_form, create_submission, export_form, export_submission]
 *                 description: Action to check limits for
 *               resourceId:
 *                 type: string
 *                 description: ID of the resource (form or submission) for submission/export actions
 *     responses:
 *       200:
 *         description: Limit check completed successfully
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
 *                         allowed:
 *                           type: boolean
 *                         limit:
 *                           type: integer
 *                         current:
 *                           type: integer
 *                         remaining:
 *                           type: integer
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
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
router.post('/check-limits', authenticateToken, async (req, res) => {
  try {
    const { action, resourceId } = req.body

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required'
      })
    }

    const validActions = ['create_form', 'create_submission', 'export_form', 'export_submission']
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be one of: ' + validActions.join(', ')
      })
    }

    const limitCheck = await SubscriptionService.checkSubscriptionLimits(
      req.user.id,
      action,
      resourceId
    )

    res.json({
      success: true,
      data: limitCheck
    })
  } catch (error) {
    logger.logError(error, {
      operation: 'check_subscription_limits',
      userId: req.user?.id,
      body: req.body
    })

    if (error.message.includes('required')) {
      return res.status(400).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to check subscription limits'
    })
  }
})

export default router
