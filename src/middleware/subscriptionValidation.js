import { SubscriptionService } from '../services/subscriptionService.js'
import logger from '../utils/logger.js'

/**
 * Middleware to check subscription limits before allowing actions
 * @param {string} action - The action to check limits for
 * @param {string} resourceIdParam - Parameter name containing the resource ID (optional)
 * @returns {Function} Express middleware function
 */
export const checkSubscriptionLimits = (action, resourceIdParam = null) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        })
      }

      // Get resource ID from request parameters or body
      let resourceId = null
      if (resourceIdParam) {
        resourceId = req.params[resourceIdParam] || req.body[resourceIdParam]
      }

      // Check subscription limits
      const limitCheck = await SubscriptionService.checkSubscriptionLimits(
        userId,
        action,
        resourceId
      )

      // Add limit information to request object for use in route handlers
      req.subscriptionLimits = limitCheck

      // If action is not allowed, return error with upgrade suggestion
      if (!limitCheck.allowed) {
        const subscriptionData = await SubscriptionService.getUserSubscription(userId)
        const availablePlans = await SubscriptionService.getAvailableAccountTypes(userId)
        
        const upgradePlans = availablePlans.filter(plan => plan.canSelect && plan.isUpgrade)
        
        return res.status(403).json({
          success: false,
          message: getLimitExceededMessage(action, limitCheck),
          data: {
            limitCheck,
            subscription: subscriptionData,
            upgradeOptions: upgradePlans.map(plan => ({
              id: plan.id,
              name: plan.name,
              displayName: plan.displayName,
              priceMonthly: plan.priceMonthly,
              priceYearly: plan.priceYearly,
              currency: plan.currency,
              currencySymbol: plan.currencySymbol,
              priceDifference: plan.priceDifference
            }))
          }
        })
      }

      next()
    } catch (error) {
      logger.logError(error, {
        operation: 'check_subscription_limits_middleware',
        action,
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        message: 'Failed to check subscription limits'
      })
    }
  }
}

/**
 * Middleware to require an active subscription
 * @param {boolean} allowTrial - Whether to allow trial subscriptions
 * @returns {Function} Express middleware function
 */
export const requireActiveSubscription = (allowTrial = true) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        })
      }

      const subscriptionData = await SubscriptionService.getUserSubscription(userId)
      
      if (!subscriptionData) {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required',
          data: {
            subscription: null,
            upgradeOptions: await getUpgradeOptions(userId)
          }
        })
      }

      const { subscription } = subscriptionData
      
      // Check if subscription is active
      if (!subscription.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required',
          data: {
            subscription: subscription,
            upgradeOptions: await getUpgradeOptions(userId)
          }
        })
      }

      // Check if trial is allowed
      if (!allowTrial && subscription.isInTrial) {
        return res.status(403).json({
          success: false,
          message: 'Trial subscriptions not allowed for this action',
          data: {
            subscription: subscription,
            upgradeOptions: await getUpgradeOptions(userId)
          }
        })
      }

      // Add subscription data to request object
      req.subscription = subscription
      req.accountType = subscriptionData.accountType

      next()
    } catch (error) {
      logger.logError(error, {
        operation: 'require_active_subscription_middleware',
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        message: 'Failed to verify subscription'
      })
    }
  }
}

/**
 * Middleware to check if user can perform premium actions
 * @param {string} feature - The premium feature to check
 * @returns {Function} Express middleware function
 */
export const requirePremiumFeature = (feature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        })
      }

      const subscriptionData = await SubscriptionService.getUserSubscription(userId)
      
      if (!subscriptionData) {
        return res.status(403).json({
          success: false,
          message: `Premium feature "${feature}" requires an active subscription`,
          data: {
            feature,
            subscription: null,
            upgradeOptions: await getUpgradeOptions(userId)
          }
        })
      }

      const { subscription, accountType } = subscriptionData
      
      // Check if subscription is active
      if (!subscription.isActive) {
        return res.status(403).json({
          success: false,
          message: `Premium feature "${feature}" requires an active subscription`,
          data: {
            feature,
            subscription: subscription,
            upgradeOptions: await getUpgradeOptions(userId)
          }
        })
      }

      // Check if account type supports the feature
      const featureSupported = checkFeatureSupport(accountType, feature)
      
      if (!featureSupported) {
        return res.status(403).json({
          success: false,
          message: `Premium feature "${feature}" not available in your current plan`,
          data: {
            feature,
            subscription: subscription,
            accountType: accountType,
            upgradeOptions: await getUpgradeOptions(userId)
          }
        })
      }

      // Add subscription data to request object
      req.subscription = subscription
      req.accountType = accountType

      next()
    } catch (error) {
      logger.logError(error, {
        operation: 'require_premium_feature_middleware',
        feature,
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        message: 'Failed to verify premium feature access'
      })
    }
  }
}

/**
 * Middleware to track usage for subscription limits
 * @param {string} action - The action being performed
 * @param {string} resourceIdParam - Parameter name containing the resource ID (optional)
 * @returns {Function} Express middleware function
 */
export const trackSubscriptionUsage = (action, resourceIdParam = null) => {
  return async (req, res, next) => {
    try {
      // Store original response methods
      const originalJson = res.json
      const originalSend = res.send

      // Override response methods to track usage after successful response
      res.json = function(data) {
        if (data.success && res.statusCode < 400) {
          // Track usage asynchronously without blocking response
          setImmediate(async () => {
            try {
              const userId = req.user?.id
              if (userId) {
                let resourceId = null
                if (resourceIdParam) {
                  resourceId = req.params[resourceIdParam] || req.body[resourceIdParam]
                }

                await trackUsage(userId, action, resourceId)
              }
            } catch (error) {
              logger.logError(error, {
                operation: 'track_subscription_usage',
                action,
                userId: req.user?.id
              })
            }
          })
        }
        return originalJson.call(this, data)
      }

      res.send = function(data) {
        if (res.statusCode < 400) {
          // Track usage asynchronously without blocking response
          setImmediate(async () => {
            try {
              const userId = req.user?.id
              if (userId) {
                let resourceId = null
                if (resourceIdParam) {
                  resourceId = req.params[resourceIdParam] || req.body[resourceIdParam]
                }

                await trackUsage(userId, action, resourceId)
              }
            } catch (error) {
              logger.logError(error, {
                operation: 'track_subscription_usage',
                action,
                userId: req.user?.id
              })
            }
          })
        }
        return originalSend.call(this, data)
      }

      next()
    } catch (error) {
      logger.logError(error, {
        operation: 'track_subscription_usage_middleware',
        action,
        userId: req.user?.id
      })

      next() // Continue even if tracking fails
    }
  }
}

/**
 * Helper function to get upgrade options for a user
 */
async function getUpgradeOptions(userId) {
  try {
    const availablePlans = await SubscriptionService.getAvailableAccountTypes(userId)
    return availablePlans
      .filter(plan => plan.canSelect)
      .map(plan => ({
        id: plan.id,
        name: plan.name,
        displayName: plan.displayName,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        currency: plan.currency,
        currencySymbol: plan.currencySymbol,
        features: plan.features,
        isUpgrade: plan.isUpgrade,
        isDowngrade: plan.isDowngrade,
        priceDifference: plan.priceDifference
      }))
  } catch (error) {
    logger.logError(error, {
      operation: 'get_upgrade_options',
      userId
    })
    return []
  }
}

/**
 * Helper function to generate limit exceeded messages
 */
function getLimitExceededMessage(action, limitCheck) {
  const messages = {
    create_form: `You have reached your limit of ${limitCheck.limit} forms. You currently have ${limitCheck.current} forms.`,
    create_submission: `This form has reached its submission limit of ${limitCheck.limit}. Currently has ${limitCheck.current} submissions.`,
    export_form: `You have reached your export limit of ${limitCheck.limit} exports for this form. You have already exported ${limitCheck.current} times.`,
    export_submission: `You have reached your export limit of ${limitCheck.limit} exports for this submission. You have already exported ${limitCheck.current} times.`
  }

  return messages[action] || 'You have reached your subscription limit for this action.'
}

/**
 * Helper function to check if account type supports a feature
 */
function checkFeatureSupport(accountType, feature) {
  if (!accountType || !accountType.features) {
    return false
  }

  const featureMap = {
    'export_forms': accountType.canExportForms,
    'export_submissions': accountType.canExportSubmissions,
    'analytics': accountType.features.analytics || false,
    'api_access': accountType.features.api_access || false,
    'custom_domains': (accountType.features.custom_domains || 0) > 0,
    'sso': accountType.features.sso || false,
    'white_label': accountType.features.white_label || false,
    'priority_support': accountType.features.support === 'priority' || accountType.features.support === 'dedicated'
  }

  return featureMap[feature] || false
}

/**
 * Helper function to track usage (placeholder for future implementation)
 */
async function trackUsage(userId, action, resourceId) {
  // This would integrate with the subscription usage tracking system
  // For now, we'll just log the usage
  logger.logTrace('subscription_usage_tracked', {
    userId,
    action,
    resourceId,
    timestamp: new Date().toISOString()
  })
}

/**
 * Middleware to add subscription context to all requests
 */
export const addSubscriptionContext = async (req, res, next) => {
  try {
    const userId = req.user?.id
    if (userId) {
      const subscriptionData = await SubscriptionService.getUserSubscription(userId)
      
      if (subscriptionData) {
        req.subscription = subscriptionData.subscription
        req.accountType = subscriptionData.accountType
        req.subscriptionContext = {
          hasActiveSubscription: subscriptionData.subscription.isActive,
          isInTrial: subscriptionData.subscription.isInTrial,
          isExpired: subscriptionData.subscription.isExpired,
          daysUntilExpiration: subscriptionData.subscription.daysUntilExpiration,
          accountTypeName: subscriptionData.accountType.name,
          accountTypeDisplayName: subscriptionData.accountType.displayName
        }
      } else {
        req.subscriptionContext = {
          hasActiveSubscription: false,
          isInTrial: false,
          isExpired: false,
          daysUntilExpiration: null,
          accountTypeName: 'free',
          accountTypeDisplayName: 'Free Plan'
        }
      }
    }

    next()
  } catch (error) {
    logger.logError(error, {
      operation: 'add_subscription_context',
      userId: req.user?.id
    })

    // Don't fail the request if subscription context fails
    req.subscriptionContext = {
      hasActiveSubscription: false,
      isInTrial: false,
      isExpired: false,
      daysUntilExpiration: null,
      accountTypeName: 'free',
      accountTypeDisplayName: 'Free Plan'
    }

    next()
  }
}
