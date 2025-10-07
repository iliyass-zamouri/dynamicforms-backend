import crypto from 'crypto'
import { executeQuery } from '../database/connection.js'
import logger from '../utils/logger.js'

export class PaymentTransaction {
  constructor(data) {
    this.id = data.id
    this.subscriptionId = data.subscription_id
    this.userId = data.user_id
    
    this.paymentProvider = data.payment_provider
    this.providerTransactionId = data.provider_transaction_id
    this.providerInvoiceId = data.provider_invoice_id
    this.providerSubscriptionId = data.provider_subscription_id
    this.providerCustomerId = data.provider_customer_id
    
    this.transactionType = data.transaction_type
    this.status = data.status
    
    this.amount = parseFloat(data.amount)
    this.currency = data.currency
    this.feeAmount = parseFloat(data.fee_amount || 0)
    this.netAmount = data.net_amount ? parseFloat(data.net_amount) : null
    
    this.paymentMethodType = data.payment_method_type
    this.paymentMethodId = data.payment_method_id
    this.lastFour = data.last_four
    this.cardBrand = data.card_brand
    
    this.billingReason = data.billing_reason
    this.billingPeriodStart = data.billing_period_start
    this.billingPeriodEnd = data.billing_period_end
    
    this.transactionDate = data.transaction_date
    this.settledDate = data.settled_date
    
    this.webhookEventId = data.webhook_event_id
    this.webhookReceivedAt = data.webhook_received_at
    this.webhookProcessedAt = data.webhook_processed_at
    
    this.failureCode = data.failure_code
    this.failureMessage = data.failure_message
    this.retryCount = data.retry_count || 0
    
    this.description = data.description
    this.receiptUrl = data.receipt_url
    this.invoiceUrl = data.invoice_url
    this.metadata = typeof data.metadata === 'string' ? JSON.parse(data.metadata || '{}') : data.metadata || {}
    
    this.createdAt = data.created_at
    this.updatedAt = data.updated_at
  }

  /**
   * Create a new payment transaction
   */
  static async create(transactionData) {
    const {
      subscriptionId,
      userId,
      paymentProvider,
      providerTransactionId = null,
      providerInvoiceId = null,
      providerSubscriptionId = null,
      providerCustomerId = null,
      transactionType = 'payment',
      status,
      amount,
      currency = 'EUR',
      feeAmount = 0,
      netAmount = null,
      paymentMethodType = null,
      paymentMethodId = null,
      lastFour = null,
      cardBrand = null,
      billingReason = null,
      billingPeriodStart = null,
      billingPeriodEnd = null,
      transactionDate = new Date(),
      settledDate = null,
      webhookEventId = null,
      webhookReceivedAt = null,
      failureCode = null,
      failureMessage = null,
      description = null,
      receiptUrl = null,
      invoiceUrl = null,
      metadata = {}
    } = transactionData

    const transactionId = crypto.randomUUID()

    const sql = `
      INSERT INTO payment_transactions (
        id, subscription_id, user_id, payment_provider,
        provider_transaction_id, provider_invoice_id, provider_subscription_id, provider_customer_id,
        transaction_type, status, amount, currency, fee_amount, net_amount,
        payment_method_type, payment_method_id, last_four, card_brand,
        billing_reason, billing_period_start, billing_period_end,
        transaction_date, settled_date, webhook_event_id, webhook_received_at,
        failure_code, failure_message, description, receipt_url, invoice_url, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const params = [
      transactionId, subscriptionId, userId, paymentProvider,
      providerTransactionId, providerInvoiceId, providerSubscriptionId, providerCustomerId,
      transactionType, status, amount, currency, feeAmount, netAmount,
      paymentMethodType, paymentMethodId, lastFour, cardBrand,
      billingReason, billingPeriodStart, billingPeriodEnd,
      transactionDate, settledDate, webhookEventId, webhookReceivedAt,
      failureCode, failureMessage, description, receiptUrl, invoiceUrl,
      JSON.stringify(metadata)
    ]

    const result = await executeQuery(sql, params)

    if (result.success) {
      logger.info('Payment transaction created', {
        transactionId,
        subscriptionId,
        userId,
        amount,
        status,
        provider: paymentProvider
      })
      return await PaymentTransaction.findById(transactionId)
    }

    throw new Error('Failed to create payment transaction')
  }

  /**
   * Find transaction by ID
   */
  static async findById(id) {
    const sql = 'SELECT * FROM payment_transactions WHERE id = ?'
    const result = await executeQuery(sql, [id])

    if (result.success && result.data.length > 0) {
      return new PaymentTransaction(result.data[0])
    }

    return null
  }

  /**
   * Find transaction by webhook event ID (for idempotency)
   */
  static async findByWebhookEventId(webhookEventId) {
    const sql = 'SELECT * FROM payment_transactions WHERE webhook_event_id = ?'
    const result = await executeQuery(sql, [webhookEventId])

    if (result.success && result.data.length > 0) {
      return new PaymentTransaction(result.data[0])
    }

    return null
  }

  /**
   * Find transaction by provider transaction ID
   */
  static async findByProviderTransactionId(provider, transactionId) {
    const sql = 'SELECT * FROM payment_transactions WHERE payment_provider = ? AND provider_transaction_id = ?'
    const result = await executeQuery(sql, [provider, transactionId])

    if (result.success && result.data.length > 0) {
      return new PaymentTransaction(result.data[0])
    }

    return null
  }

  /**
   * Find transactions by subscription ID
   */
  static async findBySubscriptionId(subscriptionId, limit = 50) {
    const sql = 'SELECT * FROM payment_transactions WHERE subscription_id = ? ORDER BY transaction_date DESC LIMIT ?'
    const result = await executeQuery(sql, [subscriptionId, limit])

    if (result.success) {
      return result.data.map(row => new PaymentTransaction(row))
    }

    return []
  }

  /**
   * Find transactions by user ID
   */
  static async findByUserId(userId, limit = 50) {
    const sql = 'SELECT * FROM payment_transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT ?'
    const result = await executeQuery(sql, [userId, limit])

    if (result.success) {
      return result.data.map(row => new PaymentTransaction(row))
    }

    return []
  }

  /**
   * Update transaction status
   */
  async updateStatus(status, options = {}) {
    const {
      failureCode = null,
      failureMessage = null,
      settledDate = null,
      webhookProcessedAt = new Date()
    } = options

    const sql = `
      UPDATE payment_transactions 
      SET status = ?,
          failure_code = ?,
          failure_message = ?,
          settled_date = ?,
          webhook_processed_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `

    const result = await executeQuery(sql, [
      status,
      failureCode,
      failureMessage,
      settledDate,
      webhookProcessedAt,
      this.id
    ])

    if (result.success) {
      this.status = status
      this.failureCode = failureCode
      this.failureMessage = failureMessage
      this.settledDate = settledDate
      this.webhookProcessedAt = webhookProcessedAt

      logger.info('Payment transaction status updated', {
        transactionId: this.id,
        status,
        failureCode
      })
    }

    return result
  }

  /**
   * Increment retry count
   */
  async incrementRetryCount() {
    const sql = 'UPDATE payment_transactions SET retry_count = retry_count + 1 WHERE id = ?'
    const result = await executeQuery(sql, [this.id])

    if (result.success) {
      this.retryCount += 1
    }

    return result
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      subscriptionId: this.subscriptionId,
      userId: this.userId,
      paymentProvider: this.paymentProvider,
      providerTransactionId: this.providerTransactionId,
      providerInvoiceId: this.providerInvoiceId,
      providerSubscriptionId: this.providerSubscriptionId,
      providerCustomerId: this.providerCustomerId,
      transactionType: this.transactionType,
      status: this.status,
      amount: this.amount,
      currency: this.currency,
      feeAmount: this.feeAmount,
      netAmount: this.netAmount,
      paymentMethodType: this.paymentMethodType,
      paymentMethodId: this.paymentMethodId,
      lastFour: this.lastFour,
      cardBrand: this.cardBrand,
      billingReason: this.billingReason,
      billingPeriodStart: this.billingPeriodStart,
      billingPeriodEnd: this.billingPeriodEnd,
      transactionDate: this.transactionDate,
      settledDate: this.settledDate,
      webhookEventId: this.webhookEventId,
      webhookReceivedAt: this.webhookReceivedAt,
      webhookProcessedAt: this.webhookProcessedAt,
      failureCode: this.failureCode,
      failureMessage: this.failureMessage,
      retryCount: this.retryCount,
      description: this.description,
      receiptUrl: this.receiptUrl,
      invoiceUrl: this.invoiceUrl,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}

export default PaymentTransaction

