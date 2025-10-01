# Advanced Subscription System

This document describes the comprehensive subscription system implemented for the Dynamic Forms backend. The system provides advanced subscription management with history tracking, limit enforcement, and seamless integration with payment providers.

## 🚀 Features

### Core Features
- **Advanced Subscription Management**: Create, upgrade, downgrade, and cancel subscriptions
- **History Tracking**: Complete audit trail of all subscription changes
- **Usage Monitoring**: Track subscription usage against limits
- **Flexible Billing**: Support for monthly and yearly billing cycles
- **Trial Support**: Built-in trial period management
- **Payment Integration Ready**: Prepared for Stripe, PayPal, and other payment providers
- **Real-time Limit Enforcement**: Middleware-based limit checking
- **Automatic Expiration Handling**: Background job support for expired subscriptions

### Advanced Features
- **Dynamic Plan Changes**: Users can upgrade/downgrade at any time
- **Limit Exceeded Handling**: Graceful handling when users reach limits
- **Upgrade Suggestions**: Automatic suggestions for plan upgrades
- **Subscription Context**: Real-time subscription status in all requests
- **Comprehensive Logging**: Detailed logging for all subscription operations
- **Admin Management**: Full admin control over subscriptions

## 📊 Database Schema

### Core Tables

#### `subscriptions`
Stores active and inactive subscriptions with complete billing information.

```sql
- id (VARCHAR(36), PRIMARY KEY)
- user_id (VARCHAR(36), FOREIGN KEY)
- account_type_id (VARCHAR(36), FOREIGN KEY)
- status (ENUM: active, inactive, cancelled, expired, suspended, pending)
- billing_cycle (ENUM: monthly, yearly)
- amount (DECIMAL(10,2))
- currency (VARCHAR(3))
- start_date, end_date, next_billing_date (TIMESTAMP)
- cancelled_at (TIMESTAMP, NULLABLE)
- payment_provider (VARCHAR(50), NULLABLE)
- payment_provider_subscription_id (VARCHAR(255), NULLABLE)
- payment_method_id (VARCHAR(255), NULLABLE)
- trial_start_date, trial_end_date (TIMESTAMP, NULLABLE)
- is_trial (BOOLEAN)
- auto_renew (BOOLEAN)
- metadata (JSON)
- created_at, updated_at (TIMESTAMP)
```

#### `subscription_history`
Complete audit trail of all subscription changes.

```sql
- id (VARCHAR(36), PRIMARY KEY)
- subscription_id (VARCHAR(36), FOREIGN KEY)
- user_id (VARCHAR(36), FOREIGN KEY)
- action (ENUM: created, activated, upgraded, downgraded, cancelled, renewed, expired, suspended, reactivated, payment_failed, payment_succeeded)
- previous_account_type_id, new_account_type_id (VARCHAR(36), FOREIGN KEY, NULLABLE)
- previous_status, new_status (VARCHAR(50), NULLABLE)
- previous_amount, new_amount (DECIMAL(10,2), NULLABLE)
- previous_billing_cycle, new_billing_cycle (VARCHAR(20), NULLABLE)
- reason (VARCHAR(255), NULLABLE)
- metadata (JSON)
- changed_by (VARCHAR(36), FOREIGN KEY, NULLABLE)
- ip_address (VARCHAR(45), NULLABLE)
- user_agent (TEXT, NULLABLE)
- created_at (TIMESTAMP)
```

#### `subscription_usage`
Tracks usage against subscription limits.

```sql
- id (VARCHAR(36), PRIMARY KEY)
- subscription_id (VARCHAR(36), FOREIGN KEY)
- user_id (VARCHAR(36), FOREIGN KEY)
- period_start, period_end (TIMESTAMP)
- forms_created, submissions_received, exports_performed (INT)
- max_forms, max_submissions_per_form, max_exports_per_form (INT)
- is_over_limit (BOOLEAN)
- over_limit_details (JSON)
- created_at, updated_at (TIMESTAMP)
```

#### `subscription_notifications`
Manages subscription-related notifications.

```sql
- id (VARCHAR(36), PRIMARY KEY)
- subscription_id (VARCHAR(36), FOREIGN KEY)
- user_id (VARCHAR(36), FOREIGN KEY)
- type (ENUM: trial_ending, payment_due, payment_failed, subscription_expired, limit_reached, upgrade_available, downgrade_warning)
- title (VARCHAR(255))
- message (TEXT)
- status (ENUM: pending, sent, failed, read)
- delivery_method (ENUM: email, in_app, sms)
- scheduled_for (TIMESTAMP)
- sent_at, read_at (TIMESTAMP, NULLABLE)
- metadata (JSON)
- created_at (TIMESTAMP)
```

## 🔧 API Endpoints

### Subscription Management

#### `GET /api/subscriptions/current`
Get current user's subscription with account type details.

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": { /* Subscription object */ },
    "accountType": { /* AccountType object */ }
  }
}
```

#### `GET /api/subscriptions/usage`
Get detailed usage statistics for current subscription.

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": { /* Subscription object */ },
    "accountType": { /* AccountType object */ },
    "usage": {
      "forms": {
        "current": 5,
        "limit": 25,
        "remaining": 20,
        "percentage": 20
      },
      "submissions": {
        "current": 150,
        "limit": 1000,
        "perForm": [/* per-form statistics */]
      },
      "exports": {
        "formsAllowed": true,
        "submissionsAllowed": true,
        "maxExportsPerForm": 50,
        "maxExportsPerSubmission": 50
      }
    }
  }
}
```

#### `GET /api/subscriptions/history`
Get user's subscription history.

**Query Parameters:**
- `limit` (integer, default: 50): Number of entries to return
- `offset` (integer, default: 0): Number of entries to skip

#### `GET /api/subscriptions/available-plans`
Get available subscription plans with upgrade/downgrade information.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "pro",
      "displayName": "Pro Plan",
      "priceMonthly": 29.99,
      "priceYearly": 299.99,
      "canSelect": true,
      "reason": "upgrade_available",
      "isUpgrade": true,
      "isDowngrade": false,
      "priceDifference": 20.00
    }
  ]
}
```

#### `POST /api/subscriptions/create`
Create a new subscription.

**Request Body:**
```json
{
  "accountTypeId": "uuid",
  "billingCycle": "monthly",
  "paymentProvider": "stripe",
  "paymentProviderSubscriptionId": "sub_123",
  "isTrial": false,
  "trialDays": 14,
  "metadata": {}
}
```

#### `PUT /api/subscriptions/{subscriptionId}/change-plan`
Change subscription plan (upgrade or downgrade).

**Request Body:**
```json
{
  "newAccountTypeId": "uuid",
  "reason": "upgrade_requested"
}
```

#### `PUT /api/subscriptions/{subscriptionId}/cancel`
Cancel subscription.

**Request Body:**
```json
{
  "reason": "user_requested"
}
```

#### `POST /api/subscriptions/check-limits`
Check subscription limits for a specific action.

**Request Body:**
```json
{
  "action": "create_form",
  "resourceId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allowed": true,
    "limit": 25,
    "current": 5,
    "remaining": 20
  }
}
```

## 🛡️ Middleware

### `checkSubscriptionLimits(action, resourceIdParam)`
Checks if user can perform a specific action based on subscription limits.

**Usage:**
```javascript
router.post('/forms', 
  authenticateToken,
  checkSubscriptionLimits('create_form'),
  validateFormCreation,
  trackSubscriptionUsage('create_form'),
  async (req, res) => {
    // Route handler
  }
)
```

### `requireActiveSubscription(allowTrial)`
Requires an active subscription to access the route.

**Usage:**
```javascript
router.get('/premium-feature',
  authenticateToken,
  requireActiveSubscription(false), // false = no trial allowed
  async (req, res) => {
    // Route handler
  }
)
```

### `requirePremiumFeature(feature)`
Requires specific premium feature to access the route.

**Usage:**
```javascript
router.get('/analytics',
  authenticateToken,
  requirePremiumFeature('analytics'),
  async (req, res) => {
    // Route handler
  }
)
```

### `trackSubscriptionUsage(action, resourceIdParam)`
Tracks usage for subscription limits after successful operations.

### `addSubscriptionContext`
Adds subscription context to all requests.

**Usage:**
```javascript
app.use(addSubscriptionContext)
```

**Available in req object:**
```javascript
req.subscriptionContext = {
  hasActiveSubscription: true,
  isInTrial: false,
  isExpired: false,
  daysUntilExpiration: 15,
  accountTypeName: 'pro',
  accountTypeDisplayName: 'Pro Plan'
}
```

## 🔄 Service Layer

### `SubscriptionService`

#### Core Methods

**`createSubscription(userId, accountTypeId, billingCycle, options)`**
Creates a new subscription with complete validation and history tracking.

**`changeSubscriptionPlan(subscriptionId, newAccountTypeId, reason, options)`**
Handles plan changes with automatic upgrade/downgrade detection.

**`cancelSubscription(subscriptionId, reason, options)`**
Cancels subscription and updates user preferences to free plan.

**`getUserSubscription(userId)`**
Gets current subscription with account type details.

**`getUserSubscriptionHistory(userId, limit, offset)`**
Gets subscription history with account type enrichment.

**`getAvailableAccountTypes(userId)`**
Gets available plans with upgrade/downgrade information.

**`checkSubscriptionLimits(userId, action, resourceId)`**
Checks limits for specific actions.

**`getSubscriptionUsage(userId)`**
Gets comprehensive usage statistics.

**`handleExpiredSubscriptions()`**
Background job to handle expired subscriptions.

## 🚀 Getting Started

### 1. Run Migration

```bash
./run_subscription_migration.sh
```

### 2. Update Environment Variables

Add to your `.env` file:
```env
# Subscription System
SUBSCRIPTION_AUTO_RENEW_DEFAULT=true
SUBSCRIPTION_TRIAL_DAYS_DEFAULT=14
SUBSCRIPTION_CURRENCY_DEFAULT=USD
```

### 3. Integrate with Routes

Update your existing routes to use subscription middleware:

```javascript
import { 
  checkSubscriptionLimits, 
  trackSubscriptionUsage, 
  addSubscriptionContext 
} from '../middleware/subscriptionValidation.js'

// Add context to all requests
app.use(addSubscriptionContext)

// Protect form creation
router.post('/forms', 
  authenticateToken,
  checkSubscriptionLimits('create_form'),
  validateFormCreation,
  trackSubscriptionUsage('create_form'),
  async (req, res) => {
    // Your form creation logic
  }
)
```

### 4. Payment Integration

The system is ready for payment provider integration. Add your payment provider logic in the subscription creation and management endpoints.

## 🔧 Configuration

### Account Types
Configure account types in the database with appropriate limits and features:

```sql
INSERT INTO account_types (
  name, display_name, description, max_forms, max_submissions_per_form,
  can_export_forms, can_export_submissions, max_exports_per_form, max_exports_per_submission,
  features, price_monthly, price_yearly, currency, currency_symbol, is_active, is_default
) VALUES (
  'enterprise', 'Enterprise Plan', 'Full-featured plan for large organizations',
  999999, 999999, TRUE, TRUE, 999999, 999999,
  JSON_OBJECT('support', 'dedicated', 'analytics', true, 'custom_domains', 999999, 'api_access', true, 'sso', true, 'white_label', true),
  99.99, 999.99, 'USD', '$', TRUE, FALSE
);
```

### Features Configuration
Features are stored as JSON in the account_types table:

```json
{
  "support": "priority",
  "analytics": true,
  "custom_domains": 3,
  "api_access": true,
  "sso": false,
  "white_label": false
}
```

## 📈 Monitoring and Analytics

### Logging
All subscription operations are logged with detailed context:

```javascript
logger.logTrace('subscription_create_success', { 
  subscriptionId: subscription.id, 
  userId: subscriptionData.userId,
  accountTypeId: subscriptionData.accountTypeId,
  duration: `${duration}ms` 
})
```

### Metrics
Track key subscription metrics:
- Subscription creation rate
- Plan change frequency
- Cancellation rate
- Usage patterns
- Limit exceedance frequency

## 🔒 Security Considerations

### Data Protection
- All subscription data is encrypted in transit
- Sensitive payment information is not stored locally
- User permissions are validated on every operation

### Rate Limiting
- Subscription operations are rate-limited
- Failed attempts are logged and monitored
- Suspicious activity triggers alerts

### Access Control
- Users can only access their own subscriptions
- Admin operations require proper authorization
- All changes are logged with user attribution

## 🚀 Future Enhancements

### Planned Features
- **Webhook Support**: Real-time notifications for subscription events
- **Proration**: Automatic proration for mid-cycle plan changes
- **Dunning Management**: Automated handling of failed payments
- **Usage Analytics**: Advanced usage analytics and reporting
- **Multi-currency**: Support for multiple currencies
- **Tax Calculation**: Automatic tax calculation based on location
- **Coupon System**: Discount and coupon management
- **Referral Program**: User referral tracking and rewards

### Integration Points
- **Stripe**: Complete Stripe integration for payments
- **PayPal**: PayPal subscription management
- **Email Service**: Automated email notifications
- **Analytics**: Integration with analytics platforms
- **CRM**: Customer relationship management integration

## 📚 Examples

### Creating a Subscription
```javascript
const subscription = await SubscriptionService.createSubscription(
  userId,
  accountTypeId,
  'monthly',
  {
    paymentProvider: 'stripe',
    paymentProviderSubscriptionId: 'sub_1234567890',
    isTrial: true,
    trialDays: 14,
    metadata: { source: 'website_signup' }
  }
)
```

### Checking Limits
```javascript
const limitCheck = await SubscriptionService.checkSubscriptionLimits(
  userId,
  'create_form'
)

if (!limitCheck.allowed) {
  // Show upgrade options
  const upgradeOptions = await SubscriptionService.getAvailableAccountTypes(userId)
  return res.status(403).json({
    success: false,
    message: 'Form limit reached',
    data: { limitCheck, upgradeOptions }
  })
}
```

### Changing Plans
```javascript
const updatedSubscription = await SubscriptionService.changeSubscriptionPlan(
  subscriptionId,
  newAccountTypeId,
  'upgrade_requested',
  {
    changedBy: userId,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  }
)
```

This subscription system provides a robust foundation for managing user subscriptions with advanced features, comprehensive tracking, and seamless integration capabilities. The system is designed to scale and can be easily extended with additional features as needed.
