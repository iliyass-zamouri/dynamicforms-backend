### Frontend Guide: Plans, Payments (Recurring & Lifetime), and Activation

This guide explains how the frontend should fetch plans, let users choose a plan (free, paid recurring, or paid lifetime), and handle the payment flow and activation with the newly added endpoints.

## Overview

- Use `GET /api/payment/pricing` to show public pricing (no auth).
- Use `GET /api/subscriptions/available-plans` to show personalized upgrade/downgrade options (requires auth).
- Create a subscription with `POST /api/subscriptions/create`.
  - Free plans are auto-activated (no checkout).
  - Paid recurring and lifetime return a checkout session you should redirect to.
- Backend processes provider webhooks at `POST /api/payment/webhook/:provider` and activates the subscription on payment success.

## Data Model Notes (what the frontend will see)

Each account type includes:

```json
{
  "id": "...",
  "name": "pro",
  "displayName": "Pro",
  "description": "...",
  "priceMonthly": 19.00,
  "priceYearly": 190.00,
  "priceLifetime": 399.00,            // New for lifetime pricing
  "billingModel": "recurring|lifetime", // New to indicate lifetime plans
  "currency": "USD",
  "currencySymbol": "$",
  "maxForms": 10,
  "maxSubmissionsPerForm": 1000,
  "canExportForms": true,
  "canExportSubmissions": true
}
```

When creating a subscription:

- Free plan ⇒ returns an active subscription immediately.
- Paid plan (recurring or lifetime) ⇒ returns `subscription` + `checkoutSession` you must redirect to.

## Endpoints

### 1) Public pricing

GET `/api/payment/pricing`

Response:

```json
{
  "success": true,
  "data": {
    "accountTypes": [ { /* AccountType JSON incl. billingModel, priceLifetime */ } ]
  }
}
```

Use when user is not authenticated or for marketing pages.

### 2) Available plans (personalized)

GET `/api/subscriptions/available-plans` (auth required)

Response contains flags per plan (`canSelect`, `isUpgrade`, `isDowngrade`, `priceDifference`) to help you render CTA buttons correctly.

### 3) Create subscription

POST `/api/subscriptions/create` (auth required)

Body:

```json
{
  "accountTypeId": "<string>",
  "billingCycle": "monthly|yearly",
  "paymentProvider": "stripe"   // optional, provider name
}
```

Responses:

- Free plan:

```json
{
  "success": true,
  "data": { /* active Subscription JSON */ }
}
```

- Paid (recurring or lifetime):

```json
{
  "success": true,
  "data": {
    "subscription": { /* pending Subscription JSON */ },
    "checkoutSession": {
      "id": "chk_xxx",
      "provider": "stripe",
      "url": "https://checkout.example/..",
      "amount": 19000,
      "currency": "usd",
      "metadata": { "subscriptionId": "...", "userId": "...", "planType": "recurring|lifetime" }
    }
  }
}
``;

Redirect the browser to `checkoutSession.url`.

### 4) Payment webhook (backend)

POST `/api/payment/webhook/:provider`

- Handled by the backend; no frontend call required.
- On `invoice.payment_succeeded` the backend activates the subscription.

## Frontend Flow

### A. Display plans

1) If user is logged out: call `GET /api/payment/pricing`.
2) If logged in: call `GET /api/subscriptions/available-plans` to know which plans are selectable and whether it is an upgrade/downgrade.
3) Render each plan with:
   - If `billingModel === 'lifetime'`, show lifetime price and “One‑time payment, lifetime access”.
   - Else show monthly/yearly prices.

### B. Choose a plan

On CTA click, call `POST /api/subscriptions/create` with the selected `accountTypeId` and chosen `billingCycle` (for recurring plans). For lifetime, still pass a billingCycle (e.g. "yearly"), the backend will internally treat it as lifetime based on `accountType.billingModel`.

### C. Handle response

- If `data.subscription` only (no `checkoutSession`): This is a free plan. Show success, update UI with new limits.
- If `data.checkoutSession` exists: Redirect immediately to `checkoutSession.url`.

### D. Post-payment UX

- After payment, users usually land on your success URL (configured at the payment provider). Fetch `GET /api/subscriptions/current` to confirm activation and reflect limits/features.
- If the payment fails or is canceled, you may show a retry or “Choose plan” screen again.

## Example Frontend Code (fetch)

```ts
// Fetch plans (authenticated)
async function fetchAvailablePlans(token: string) {
  const res = await fetch('/api/subscriptions/available-plans', {
    headers: { Authorization: `Bearer ${token}` }
  })
  const json = await res.json()
  return json.data
}

// Create subscription
async function createSubscription(token: string, accountTypeId: string, billingCycle: 'monthly'|'yearly', paymentProvider?: string) {
  const res = await fetch('/api/subscriptions/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ accountTypeId, billingCycle, paymentProvider })
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'Subscription creation failed')
  return json.data
}

// Choose plan handler
async function onChoosePlan({ token, plan }: { token: string, plan: any }) {
  const billingCycle = plan.billingModel === 'lifetime' ? 'yearly' : 'monthly' // pick UI selection; lifetime is handled by backend
  const data = await createSubscription(token, plan.id, billingCycle, 'stripe')

  if (data.checkoutSession?.url) {
    window.location.href = data.checkoutSession.url
    return
  }

  // Free plan or instantly activated
  // Refresh UI state
  const current = await fetch('/api/subscriptions/current', { headers: { Authorization: `Bearer ${token}` } })
  // ...update UI with current subscription
}
```

## Error Handling Tips

- `409` on creation ⇒ user already has an active subscription; show manage/upgrade.
- `400` on creation ⇒ invalid input (unknown account type, wrong billingCycle).
- If payment fails at provider, you’ll get no redirect back or a failure URL; simply keep the user on the plan selection page and show a retry CTA.

## FAQ

- Lifetime plan vs recurring?
  - Lifetime plans have `billingModel === 'lifetime'` and a `priceLifetime`. They are paid once and never expire. Backend auto-sets `autoRenew=false` and no due dates.

- Do I need to poll for activation?
  - Usually no; rely on provider redirect to your success page, then call `GET /api/subscriptions/current`. If you need immediate UI updates elsewhere, poll until `status==='active'` after redirect.


