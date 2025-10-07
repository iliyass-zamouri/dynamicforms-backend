## Frontend Stripe Integration Guide

This guide shows how to initiate a Stripe Checkout for subscriptions using the backend API in this project.

### Overview
- The backend exposes `POST /api/subscriptions/create` to create a subscription and return a checkout session when a paid plan is selected.
- For `paymentProvider: "stripe"`, the response contains a `checkoutSession` with a `url` to redirect the user to Stripe Checkout.
- Webhooks are handled on the backend at `POST /api/payment/webhook/stripe`.

### Prerequisites
- Ensure the backend has `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` configured.
- Your frontend should have routes/pages for the `successUrl` and `cancelUrl` you pass when creating the subscription.

### Fetch Available Plans (optional)
Use this to render the list of plans before checkout.

```ts
// GET /api/subscriptions/available-plans
async function fetchPlans(token?: string) {
  const res = await fetch(`${API_URL}/api/subscriptions/available-plans`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  const json = await res.json()
  return json.data // array of plans
}
```

### Create Subscription and Start Checkout
When the user selects a plan, call the create endpoint with `paymentProvider: "stripe"` and Stripe pricing context. The backend will create the subscription as `pending` and return a checkout session.

Required fields:
- `accountTypeId`: selected plan id
- `billingCycle`: `monthly` or `yearly`
- `paymentProvider`: `stripe`
- Stripe options forwarded by your UI to the backend service:
  - `priceId`: Stripe Price ID for the selected plan
  - `successUrl`: frontend URL to display success
  - `cancelUrl`: frontend URL if user cancels
  - `customerId` (optional): Stripe Customer ID if you manage customers client-side

```ts
type CreateSubscriptionBody = {
  accountTypeId: string
  billingCycle: 'monthly' | 'yearly'
  paymentProvider: 'stripe'
  // forwarded to backend payment service via request body fields below
  priceId: string
  successUrl: string
  cancelUrl: string
  customerId?: string
}

async function startStripeCheckout(body: CreateSubscriptionBody, token: string) {
  const res = await fetch(`${API_URL}/api/subscriptions/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  })

  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'Failed to create subscription')

  const checkoutUrl = json.data?.checkoutSession?.url
  if (!checkoutUrl) throw new Error('Missing checkout session URL')

  // Redirect user to Stripe Checkout
  window.location.href = checkoutUrl
}
```

Example call:
```ts
await startStripeCheckout(
  {
    accountTypeId: selectedPlan.id,
    billingCycle: 'monthly',
    paymentProvider: 'stripe',
    priceId: 'price_123',
    successUrl: `${window.location.origin}/billing/success`,
    cancelUrl: `${window.location.origin}/billing/cancel`
  },
  authToken
)
```

### Success and Cancel Pages
- `successUrl`: Inform the user payment completed. The backend will activate the subscription upon receiving the `invoice.payment_succeeded` webhook.
- `cancelUrl`: Inform the user the checkout was canceled and allow retry.

Optional: You can poll or fetch the current subscription to reflect the new status after success.
```ts
// GET /api/subscriptions/current (requires auth)
async function fetchCurrentSubscription(token: string) {
  const res = await fetch(`${API_URL}/api/subscriptions/current`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const json = await res.json()
  return json.data // { subscription, accountType }
}
```

### Webhooks (Backend)
No frontend action required. The backend webhook handler at `/api/payment/webhook/stripe` will:
- Activate subscription on `invoice.payment_succeeded`.
- Handle payment failures and cancellations.

### Testing Notes
- Use Stripe test keys and test cards.
- Ensure your `successUrl` and `cancelUrl` are reachable by the browser.

### Error Handling Tips
- Handle non-200 responses from `create` endpoint and show a user-friendly message.
- Validate that `checkoutSession.url` is present before redirecting.


