import express from 'express'
import { AccountType } from '../models/AccountType.js'
import { Subscription } from '../models/Subscription.js'
import { SubscriptionService } from '../services/subscriptionService.js'
import PaymentService from '../services/paymentService.js'
import logger from '../utils/logger.js'

const router = express.Router()


// Payment webhook endpoint
router.post('/webhook/:provider', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    const { provider } = req.params
    const rawBody = req.body

    // Verify webhook
    const valid = PaymentService.verifyWebhookSignature(provider, req.headers, rawBody)
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Invalid signature' })
    }

    const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody

    // Handle common subscription events conventionally
    if (provider === 'stripe') {
      switch (event.type) {
        case 'invoice.payment_succeeded': {
          const subId = event.data.object.subscription
          await SubscriptionService.activateSubscription(subId, {
            provider: 'stripe',
            paymentProvider: 'stripe',
            paymentProviderSubscriptionId: subId,
            paymentMethodId: event.data.object.payment_method,
            amount: event.data.object.amount_paid,
            currency: event.data.object.currency,
            reason: 'payment_succeeded'
          })
          break
        }
        case 'invoice.payment_failed': {
          const subId = event.data.object.subscription
          await SubscriptionService.handlePaymentFailure(subId, {
            provider: 'stripe',
            retryCount: event.data.object.attempt_count,
            reason: event.data.object.last_payment_error?.message || 'payment_failed'
          })
          break
        }
        case 'customer.subscription.deleted': {
          const subId = event.data.object.id
          const subscription = await Subscription.findById(subId)
          if (subscription) {
            await subscription.cancel('payment_provider_cancelled', null)
          }
          break
        }
      }
    } else {
      await PaymentService.handleWebhookEvent(provider, event)
    }

    res.json({ success: true })
  } catch (error) {
    logger.logError(error, { operation: 'payment_webhook' })
    res.status(500).json({ success: false, message: 'Webhook processing failed' })
  }
})

export default router


