import logger from '../utils/logger.js'
import Stripe from 'stripe'

export class PaymentService {
  static stripe = null

  static getStripe() {
    if (!this.stripe) {
      const secretKey = process.env.STRIPE_SECRET_KEY
      if (!secretKey) {
        logger.warn('Stripe secret key not configured (STRIPE_SECRET_KEY)')
        return null
      }
      this.stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' })
    }
    return this.stripe
  }
  static async createCheckoutSession(subscription, user, options = {}) {
    try {
      const provider = options.provider || 'manual'

      if (provider === 'stripe') {
        const stripe = this.getStripe()
        if (!stripe) {
          throw new Error('Stripe not configured')
        }

        const { priceId, successUrl, cancelUrl, customerId } = options
        if (!priceId) {
          throw new Error('Stripe priceId is required')
        }
        if (!successUrl || !cancelUrl) {
          throw new Error('Stripe successUrl and cancelUrl are required')
        }

        const params = {
          mode: 'subscription',
          line_items: [
            { price: priceId, quantity: 1 }
          ],
          success_url: successUrl,
          cancel_url: cancelUrl,
          client_reference_id: subscription.id,
          metadata: {
            subscriptionId: subscription.id,
            userId: user.id,
            planType: options.planType || 'recurring'
          }
        }

        if (customerId) {
          params.customer = customerId
        }

        const session = await stripe.checkout.sessions.create(params)
        return {
          id: session.id,
          provider: 'stripe',
          url: session.url,
          amount: subscription.amount,
          currency: subscription.currency,
          customerId: session.customer, // Stripe customer ID
          subscriptionId: session.subscription, // Will be null until checkout completes
          metadata: params.metadata
        }
      }

      // Fallback manual session (no external provider)
      return {
        id: `chk_${subscription.id}`,
        provider,
        url: options.checkoutUrl || null,
        amount: subscription.amount,
        currency: subscription.currency,
        metadata: {
          subscriptionId: subscription.id,
          userId: user.id,
          planType: options.planType || 'recurring'
        }
      }
    } catch (error) {
      logger.logError(error, { operation: 'payment_create_checkout_session', subscriptionId: subscription?.id })
      throw error
    }
  }

}

export default PaymentService


