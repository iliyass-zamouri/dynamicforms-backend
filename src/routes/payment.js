import express from 'express'
import Stripe from 'stripe'
import { Subscription, SubscriptionHistory } from '../models/Subscription.js'
import { SubscriptionService } from '../services/subscriptionService.js'
import { PaymentTransaction } from '../models/PaymentTransaction.js'
import logger from '../utils/logger.js'

const router = express.Router()

/**
 * Extract Stripe subscription ID from invoice object (handles multiple locations)
 */
function extractSubscriptionId(invoice) {
  return invoice.subscription || 
         invoice.parent?.subscription_details?.subscription ||
         invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription ||
         null
}

/**
 * Find subscription by Stripe ID with fallback to pending subscription
 */
async function findAndLinkSubscription(stripeSubId, customerId) {
  let subscription = await Subscription.findByStripeSubscriptionId(stripeSubId)
  
  if (!subscription) {
    logger.warn('⚠️ Subscription not found by Stripe ID, attempting fallback linking', {
      stripeSubscriptionId: stripeSubId,
      customerId
    })
    
    const allSubscriptions = await Subscription.findAll()
    
    // Filter pending subscriptions without Stripe IDs (created recently, within last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const pendingSubscriptions = allSubscriptions
      .filter(s => {
        const isPending = s.status === 'pending'
        const noProvider = !s.paymentProviderSubscriptionId
        const isRecent = new Date(s.createdAt) > tenMinutesAgo
        return isPending && noProvider && isRecent
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    logger.info('Fallback subscription search results', {
      totalSubscriptions: allSubscriptions.length,
      pendingCount: allSubscriptions.filter(s => s.status === 'pending').length,
      withoutProviderCount: allSubscriptions.filter(s => !s.paymentProviderSubscriptionId).length,
      recentPendingCount: pendingSubscriptions.length,
      candidateIds: pendingSubscriptions.map(s => s.id)
    })
    
    if (pendingSubscriptions.length > 0) {
      subscription = pendingSubscriptions[0]
      
      logger.info('🔗 Found pending subscription to link', {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        accountTypeId: subscription.accountTypeId,
        createdAt: subscription.createdAt,
        age: `${Math.round((Date.now() - new Date(subscription.createdAt).getTime()) / 1000)}s ago`
      })
      
      await subscription.updateStripeInfo(stripeSubId, customerId)
      
      logger.info('✅ Successfully linked pending subscription to Stripe', {
        subscriptionId: subscription.id,
        stripeSubscriptionId: stripeSubId,
        stripeCustomerId: customerId
      })
    } else {
      logger.error('❌ No suitable pending subscriptions found to link', {
        stripeSubscriptionId: stripeSubId,
        customerId,
        totalSubscriptions: allSubscriptions.length,
        issue: pendingSubscriptions.length === 0 ? 'No recent pending subscriptions' : 'Unknown'
      })
    }
  }
  
  return subscription
}

/**
 * Stripe webhook endpoint
 * This route MUST use express.raw() to capture the raw request body
 * for signature verification. It's applied in server.js before express.json()
 */
router.post('/webhook/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature']
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    
    logger.info('Stripe webhook verified', { 
      eventType: event.type, 
      eventId: event.id 
    })
  } catch (err) {
    logger.logError(err, { operation: 'stripe_webhook_verification' })
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle webhook events
  try {
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        const stripeSubId = extractSubscriptionId(invoice)
        const isPlanChange = invoice.billing_reason === 'subscription_update' || 
                             invoice.billing_reason === 'subscription_cycle'
        
        logger.info('Processing invoice.payment_succeeded', { 
          invoiceId: invoice.id,
          stripeSubscriptionId: stripeSubId,
          customerId: invoice.customer,
          amount: invoice.amount_paid / 100,
          billingReason: invoice.billing_reason,
          isPlanChange
        })
        
        if (!stripeSubId) {
          logger.info('Invoice is not subscription-related (one-time payment)', { 
            invoiceId: invoice.id,
            billingReason: invoice.billing_reason
          })
          break
        }
        
        const subscription = await findAndLinkSubscription(stripeSubId, invoice.customer)
        
        if (subscription) {
          // Check if transaction already exists (idempotency)
          const existingTransaction = await PaymentTransaction.findByWebhookEventId(event.id)
          
          if (!existingTransaction) {
            // Create payment transaction record
            await PaymentTransaction.create({
              subscriptionId: subscription.id,
              userId: subscription.userId,
              paymentProvider: 'stripe',
              providerTransactionId: invoice.charge,
              providerInvoiceId: invoice.id,
              providerSubscriptionId: stripeSubId,
              providerCustomerId: invoice.customer,
              transactionType: 'payment',
              status: 'succeeded',
              amount: invoice.amount_paid / 100, // Convert from cents
              currency: invoice.currency.toUpperCase(),
              paymentMethodId: invoice.payment_method,
              billingReason: invoice.billing_reason,
              billingPeriodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
              billingPeriodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
              transactionDate: new Date(invoice.created * 1000),
              settledDate: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
              webhookEventId: event.id,
              webhookReceivedAt: new Date(event.created * 1000),
              receiptUrl: invoice.hosted_invoice_url,
              invoiceUrl: invoice.invoice_pdf,
              description: isPlanChange && subscription.metadata?.pendingPlanChange 
                ? `Plan ${subscription.metadata.pendingPlanChange.type} payment`
                : `Payment for ${invoice.billing_reason}`,
              metadata: {
                invoiceNumber: invoice.number,
                attemptCount: invoice.attempt_count,
                isPlanChange,
                pendingPlanChange: subscription.metadata?.pendingPlanChange || null
              }
            })
            
            logger.info('Payment transaction recorded', {
              subscriptionId: subscription.id,
              invoiceId: invoice.id,
              amount: invoice.amount_paid / 100
            })
          } else {
            logger.info('Transaction already exists (idempotent)', {
              transactionId: existingTransaction.id,
              webhookEventId: event.id
            })
          }
          
          await SubscriptionService.activateSubscription(subscription.id, {
            provider: 'stripe',
            paymentProvider: 'stripe',
            paymentProviderSubscriptionId: stripeSubId,
            paymentMethodId: invoice.payment_method,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            reason: 'payment_succeeded'
          })
          logger.info('Subscription activated', { subscriptionId: subscription.id })
        } else {
          logger.warn('Subscription not found in database', { 
            stripeSubscriptionId: stripeSubId,
            customerId: invoice.customer
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const stripeSubId = extractSubscriptionId(invoice)
        
        logger.info('Processing invoice.payment_failed', { 
          invoiceId: invoice.id,
          stripeSubscriptionId: stripeSubId,
          attemptCount: invoice.attempt_count,
          failureCode: invoice.last_payment_error?.code
        })
        
        if (!stripeSubId) {
          logger.info('Invoice has no subscription ID - skipping', { invoiceId: invoice.id })
          break
        }
        
        const subscription = await Subscription.findByStripeSubscriptionId(stripeSubId)
        
        if (subscription) {
          // Check if transaction already exists
          const existingTransaction = await PaymentTransaction.findByWebhookEventId(event.id)
          
          if (!existingTransaction) {
            // Create failed payment transaction record
            await PaymentTransaction.create({
              subscriptionId: subscription.id,
              userId: subscription.userId,
              paymentProvider: 'stripe',
              providerTransactionId: invoice.charge,
              providerInvoiceId: invoice.id,
              providerSubscriptionId: stripeSubId,
              providerCustomerId: invoice.customer,
              transactionType: 'payment',
              status: 'failed',
              amount: invoice.amount_due / 100, // Convert from cents
              currency: invoice.currency.toUpperCase(),
              paymentMethodId: invoice.payment_method,
              billingReason: invoice.billing_reason,
              billingPeriodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
              billingPeriodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
              transactionDate: new Date(invoice.created * 1000),
              webhookEventId: event.id,
              webhookReceivedAt: new Date(event.created * 1000),
              failureCode: invoice.last_payment_error?.code,
              failureMessage: invoice.last_payment_error?.message || 'Payment failed',
              description: `Failed payment for ${invoice.billing_reason}`,
              metadata: {
                invoiceNumber: invoice.number,
                attemptCount: invoice.attempt_count,
                nextPaymentAttempt: invoice.next_payment_attempt
              }
            })
            
            logger.info('Failed payment transaction recorded', {
              subscriptionId: subscription.id,
              invoiceId: invoice.id,
              failureCode: invoice.last_payment_error?.code
            })
          }
          
          await SubscriptionService.handlePaymentFailure(subscription.id, {
            provider: 'stripe',
            retryCount: invoice.attempt_count,
            reason: invoice.last_payment_error?.message || 'payment_failed'
          })
          logger.info('Payment failure handled', { subscriptionId: subscription.id })
        } else {
          logger.warn('Subscription not found in database', { stripeSubscriptionId: stripeSubId })
        }
        break
      }

      case 'customer.subscription.updated': {
        const stripeSubscription = event.data.object
        const status = stripeSubscription.status
        const previousAttributes = event.data.previous_attributes || {}
        
        // Check if price changed (indicates plan change)
        const priceChanged = previousAttributes.items?.data?.[0]?.price?.id !== stripeSubscription.items?.data?.[0]?.price?.id
        const priceId = stripeSubscription.items?.data?.[0]?.price?.id
        const previousPriceId = previousAttributes.items?.data?.[0]?.price?.id
        
        logger.info('Processing customer.subscription.updated', {
          stripeSubscriptionId: stripeSubscription.id,
          status,
          previousStatus: previousAttributes.status,
          customerId: stripeSubscription.customer,
          priceChanged,
          currentPriceId: priceId,
          previousPriceId,
          metadata: stripeSubscription.metadata
        })
        
        const subscription = await findAndLinkSubscription(stripeSubscription.id, stripeSubscription.customer)
        
        if (subscription) {
          // Handle plan changes (upgrade/downgrade) - subscription might be 'pending' during upgrade or 'active' during downgrade
          if (priceChanged && subscription.metadata?.pendingPlanChange) {
            const pendingChange = subscription.metadata.pendingPlanChange
            const targetAccountTypeId = pendingChange.targetAccountTypeId
            
            logger.info('Applying plan change for active subscription', {
              subscriptionId: subscription.id,
              currentAccountTypeId: subscription.accountTypeId,
              targetAccountTypeId,
              changeType: pendingChange.type
            })
            
            // Apply the plan change directly (don't call activateSubscription for existing subscriptions)
            const newAmount = stripeSubscription.items?.data?.[0]?.price?.unit_amount || 0
            const metadata = { ...subscription.metadata }
            const previousAccountTypeId = subscription.accountTypeId
            delete metadata.pendingPlanChange // Clear the pending flag
            
            await subscription.update({
              accountTypeId: targetAccountTypeId,
              amount: newAmount / 100,
              currency: stripeSubscription.currency,
              status: 'active', // Ensure subscription is active after plan change
              metadata
            })
            
            // Update user preferences to match new plan
            await subscription.updateUserPreferencesToAccountType(targetAccountTypeId)
            
            // Record the change in history
            await SubscriptionHistory.recordChange({
              subscriptionId: subscription.id,
              userId: subscription.userId,
              action: pendingChange.type === 'upgrade' ? 'upgraded' : 'downgraded',
              previousAccountTypeId: previousAccountTypeId,
              newAccountTypeId: targetAccountTypeId,
              reason: 'plan_change_confirmed',
              metadata: { stripeSubscriptionId: stripeSubscription.id }
            })
            
            logger.info('Plan change applied successfully', {
              subscriptionId: subscription.id,
              newAccountTypeId: targetAccountTypeId
            })
            
            break // Don't process other status changes for plan changes
          }
          
          // Handle status changes for NEW subscriptions or status updates
          switch (status) {
            case 'active':
              // Only activate if subscription is pending (new subscription)
              if (subscription.status === 'pending') {
                await SubscriptionService.activateSubscription(subscription.id, {
                  provider: 'stripe',
                  paymentProvider: 'stripe',
                  paymentProviderSubscriptionId: stripeSubscription.id,
                  paymentMethodId: stripeSubscription.default_payment_method,
                  amount: stripeSubscription.items?.data?.[0]?.price?.unit_amount || 0,
                  currency: stripeSubscription.currency,
                  reason: 'subscription_updated_to_active'
                })
                logger.info('New subscription activated', { 
                  subscriptionId: subscription.id
                })
              } else {
                logger.info('Subscription already active, skipping activation', {
                  subscriptionId: subscription.id,
                  currentStatus: subscription.status
                })
              }
              break
            case 'past_due':
            case 'unpaid':
              await SubscriptionService.handlePaymentFailure(subscription.id, {
                provider: 'stripe',
                retryCount: 0,
                reason: `subscription_status_${status}`
              })
              logger.info('Subscription marked as past due', { subscriptionId: subscription.id })
              break
            case 'canceled':
              await subscription.cancel('payment_provider_cancelled', null)
              logger.info('Subscription canceled', { subscriptionId: subscription.id })
              break
          }
        } else {
          logger.warn('Subscription not found in database', { stripeSubscriptionId: stripeSubscription.id })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object
        
        logger.info('Processing customer.subscription.deleted', { 
          stripeSubscriptionId: stripeSubscription.id,
          customerId: stripeSubscription.customer
        })
        
        const subscription = await Subscription.findByStripeSubscriptionId(stripeSubscription.id)
        
        if (subscription) {
          await subscription.cancel('payment_provider_cancelled', null)
          logger.info('Subscription deleted', { subscriptionId: subscription.id })
        } else {
          logger.warn('Subscription not found in database', { stripeSubscriptionId: stripeSubscription.id })
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object
        
        logger.info('✅ Processing checkout.session.completed', {
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          clientReferenceId: session.client_reference_id,
          mode: session.mode,
          paymentStatus: session.payment_status
        })
        
        // For subscription mode, link the subscription IMMEDIATELY
        if (session.mode === 'subscription' && session.subscription && session.client_reference_id) {
          const subscription = await Subscription.findById(session.client_reference_id)
          
          if (subscription) {
            // Update subscription with Stripe subscription ID and customer ID
            await subscription.updateStripeInfo(session.subscription, session.customer)
            
            logger.info('✅ Subscription successfully linked to Stripe', { 
              subscriptionId: subscription.id,
              stripeSubscriptionId: session.subscription,
              stripeCustomerId: session.customer,
              userId: subscription.userId
            })
          } else {
            logger.error('❌ Subscription not found for checkout session', { 
              clientReferenceId: session.client_reference_id,
              sessionId: session.id
            })
          }
        } else {
          logger.warn('Checkout session incomplete or not subscription mode', {
            mode: session.mode,
            hasSubscription: !!session.subscription,
            hasClientRef: !!session.client_reference_id
          })
        }
        break
      }

      default:
        logger.info('Unhandled webhook event', { eventType: event.type })
    }

    return res.json({ received: true, eventType: event.type })
  } catch (error) {
    logger.logError(error, { 
      operation: 'stripe_webhook_processing', 
      eventType: event?.type 
    })
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
})

export default router


