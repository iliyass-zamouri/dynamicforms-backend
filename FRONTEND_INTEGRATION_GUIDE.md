# Frontend Integration Guide - Advanced Subscription System

This guide provides comprehensive instructions for integrating the Dynamic Forms subscription system into your frontend application.

## 🚀 Quick Start

### 1. Base API Configuration

```javascript
// config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'

const apiClient = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  
  // Add authentication token to requests
  setAuthToken(token) {
    this.headers['Authorization'] = `Bearer ${token}`
  },
  
  // Remove authentication token
  clearAuthToken() {
    delete this.headers['Authorization']
  }
}

export default apiClient
```

### 2. Authentication Setup

```javascript
// services/authService.js
import apiClient from '../config/api.js'

export const authService = {
  // Login and store token
  async login(email, password) {
    const response = await fetch(`${apiClient.baseURL}/auth/login`, {
      method: 'POST',
      headers: apiClient.headers,
      body: JSON.stringify({ email, password })
    })
    
    const data = await response.json()
    
    if (data.success) {
      const token = data.data.token
      localStorage.setItem('authToken', token)
      apiClient.setAuthToken(token)
      return data.data.user
    }
    
    throw new Error(data.message)
  },
  
  // Logout and clear token
  logout() {
    localStorage.removeItem('authToken')
    apiClient.clearAuthToken()
  },
  
  // Initialize auth token on app start
  initializeAuth() {
    const token = localStorage.getItem('authToken')
    if (token) {
      apiClient.setAuthToken(token)
      return true
    }
    return false
  }
}
```

## 📊 Subscription Service Integration

### Core Subscription Service

```javascript
// services/subscriptionService.js
import apiClient from '../config/api.js'

export const subscriptionService = {
  // Get current user's subscription
  async getCurrentSubscription() {
    const response = await fetch(`${apiClient.baseURL}/subscriptions/current`, {
      headers: apiClient.headers
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch subscription')
    }
    
    return data.data
  },
  
  // Get subscription usage statistics
  async getSubscriptionUsage() {
    const response = await fetch(`${apiClient.baseURL}/subscriptions/usage`, {
      headers: apiClient.headers
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch usage data')
    }
    
    return data.data
  },
  
  // Get subscription history
  async getSubscriptionHistory(limit = 50, offset = 0) {
    const response = await fetch(
      `${apiClient.baseURL}/subscriptions/history?limit=${limit}&offset=${offset}`,
      {
        headers: apiClient.headers
      }
    )
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch subscription history')
    }
    
    return data.data
  },
  
  // Get available subscription plans
  async getAvailablePlans() {
    const response = await fetch(`${apiClient.baseURL}/subscriptions/available-plans`, {
      headers: apiClient.headers
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch available plans')
    }
    
    return data.data
  },
  
  // Create new subscription
  async createSubscription(subscriptionData) {
    const response = await fetch(`${apiClient.baseURL}/subscriptions/create`, {
      method: 'POST',
      headers: apiClient.headers,
      body: JSON.stringify(subscriptionData)
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create subscription')
    }
    
    return data.data
  },
  
  // Change subscription plan
  async changeSubscriptionPlan(subscriptionId, newAccountTypeId, reason = 'plan_change_requested') {
    const response = await fetch(`${apiClient.baseURL}/subscriptions/${subscriptionId}/change-plan`, {
      method: 'PUT',
      headers: apiClient.headers,
      body: JSON.stringify({ newAccountTypeId, reason })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to change subscription plan')
    }
    
    return data.data
  },
  
  // Cancel subscription
  async cancelSubscription(subscriptionId, reason = 'user_requested') {
    const response = await fetch(`${apiClient.baseURL}/subscriptions/${subscriptionId}/cancel`, {
      method: 'PUT',
      headers: apiClient.headers,
      body: JSON.stringify({ reason })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to cancel subscription')
    }
    
    return data.data
  },
  
  // Check subscription limits
  async checkLimits(action, resourceId = null) {
    const response = await fetch(`${apiClient.baseURL}/subscriptions/check-limits`, {
      method: 'POST',
      headers: apiClient.headers,
      body: JSON.stringify({ action, resourceId })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to check limits')
    }
    
    return data.data
  }
}
```

## 🎨 React Components

### 1. Subscription Context Provider

```javascript
// contexts/SubscriptionContext.js
import React, { createContext, useContext, useState, useEffect } from 'react'
import { subscriptionService } from '../services/subscriptionService.js'

const SubscriptionContext = createContext()

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null)
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshSubscription = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [subscriptionData, usageData] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getSubscriptionUsage()
      ])
      
      setSubscription(subscriptionData)
      setUsage(usageData)
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch subscription data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshSubscription()
  }, [])

  const value = {
    subscription,
    usage,
    loading,
    error,
    refreshSubscription,
    hasActiveSubscription: subscription?.subscription?.isActive || false,
    isInTrial: subscription?.subscription?.isInTrial || false,
    accountType: subscription?.accountType,
    daysUntilExpiration: subscription?.subscription?.daysUntilExpiration
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}
```

### 2. Subscription Status Component

```javascript
// components/SubscriptionStatus.jsx
import React from 'react'
import { useSubscription } from '../contexts/SubscriptionContext.js'

const SubscriptionStatus = () => {
  const { subscription, usage, loading, error } = useSubscription()

  if (loading) {
    return <div className="subscription-status loading">Loading subscription...</div>
  }

  if (error) {
    return <div className="subscription-status error">Error: {error}</div>
  }

  if (!subscription) {
    return <div className="subscription-status no-subscription">No active subscription</div>
  }

  const { subscription: sub, accountType } = subscription

  return (
    <div className="subscription-status">
      <div className="subscription-header">
        <h3>{accountType?.displayName || 'Free Plan'}</h3>
        <span className={`status-badge ${sub.status}`}>
          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
        </span>
        {sub.isInTrial && <span className="trial-badge">Trial</span>}
      </div>
      
      <div className="subscription-details">
        <p>Billing: {sub.billingCycle}</p>
        <p>Amount: {sub.currencySymbol}{sub.amount}</p>
        {sub.daysUntilExpiration && (
          <p>Expires in: {sub.daysUntilExpiration} days</p>
        )}
      </div>
      
      {usage && (
        <div className="usage-stats">
          <h4>Usage Statistics</h4>
          <div className="usage-item">
            <span>Forms: {usage.usage.forms.current}/{usage.usage.forms.limit}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${usage.usage.forms.percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionStatus
```

### 3. Plan Selection Component

```javascript
// components/PlanSelection.jsx
import React, { useState, useEffect } from 'react'
import { subscriptionService } from '../services/subscriptionService.js'

const PlanSelection = ({ currentSubscription, onPlanChange }) => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [billingCycle, setBillingCycle] = useState('monthly')

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const availablePlans = await subscriptionService.getAvailablePlans()
      setPlans(availablePlans)
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan)
  }

  const handleSubscribe = async () => {
    if (!selectedPlan) return

    try {
      const subscriptionData = {
        accountTypeId: selectedPlan.id,
        billingCycle,
        isTrial: selectedPlan.name !== 'free',
        trialDays: selectedPlan.name !== 'free' ? 14 : 0,
        metadata: { source: 'frontend_signup' }
      }

      const newSubscription = await subscriptionService.createSubscription(subscriptionData)
      onPlanChange(newSubscription)
    } catch (error) {
      console.error('Failed to create subscription:', error)
      alert('Failed to create subscription: ' + error.message)
    }
  }

  const handleUpgrade = async () => {
    if (!selectedPlan || !currentSubscription) return

    try {
      const updatedSubscription = await subscriptionService.changeSubscriptionPlan(
        currentSubscription.subscription.id,
        selectedPlan.id,
        'upgrade_requested'
      )
      onPlanChange(updatedSubscription)
    } catch (error) {
      console.error('Failed to upgrade subscription:', error)
      alert('Failed to upgrade subscription: ' + error.message)
    }
  }

  if (loading) {
    return <div className="plan-selection loading">Loading plans...</div>
  }

  return (
    <div className="plan-selection">
      <div className="billing-cycle-selector">
        <button 
          className={billingCycle === 'monthly' ? 'active' : ''}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </button>
        <button 
          className={billingCycle === 'yearly' ? 'active' : ''}
          onClick={() => setBillingCycle('yearly')}
        >
          Yearly (Save 20%)
        </button>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''} ${!plan.canSelect ? 'disabled' : ''}`}
            onClick={() => plan.canSelect && handlePlanSelect(plan)}
          >
            <div className="plan-header">
              <h3>{plan.displayName}</h3>
              <div className="plan-price">
                <span className="price">
                  {plan.currencySymbol}{billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly}
                </span>
                <span className="period">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
              </div>
            </div>

            <div className="plan-features">
              <ul>
                <li>{plan.maxForms} forms</li>
                <li>{plan.maxSubmissionsPerForm} submissions per form</li>
                <li>{plan.canExportForms ? 'Export forms' : 'No form exports'}</li>
                <li>{plan.canExportSubmissions ? 'Export submissions' : 'No submission exports'}</li>
                {plan.features?.analytics && <li>Advanced analytics</li>}
                {plan.features?.api_access && <li>API access</li>}
                {plan.features?.custom_domains > 0 && <li>{plan.features.custom_domains} custom domains</li>}
              </ul>
            </div>

            <div className="plan-actions">
              {!plan.canSelect ? (
                <span className="reason">{plan.reason}</span>
              ) : plan.isUpgrade ? (
                <button 
                  className="upgrade-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUpgrade()
                  }}
                >
                  Upgrade (+{plan.currencySymbol}{plan.priceDifference})
                </button>
              ) : plan.isDowngrade ? (
                <button 
                  className="downgrade-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUpgrade()
                  }}
                >
                  Downgrade ({plan.currencySymbol}{plan.priceDifference})
                </button>
              ) : (
                <button 
                  className="select-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSubscribe()
                  }}
                >
                  Select Plan
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PlanSelection
```

### 4. Usage Dashboard Component

```javascript
// components/UsageDashboard.jsx
import React from 'react'
import { useSubscription } from '../contexts/SubscriptionContext.js'

const UsageDashboard = () => {
  const { usage, loading, error } = useSubscription()

  if (loading) {
    return <div className="usage-dashboard loading">Loading usage data...</div>
  }

  if (error) {
    return <div className="usage-dashboard error">Error: {error}</div>
  }

  if (!usage) {
    return <div className="usage-dashboard no-data">No usage data available</div>
  }

  const { usage: usageData } = usage

  const UsageBar = ({ label, current, limit, percentage }) => (
    <div className="usage-bar">
      <div className="usage-label">
        <span>{label}</span>
        <span>{current}/{limit}</span>
      </div>
      <div className="progress-bar">
        <div 
          className={`progress-fill ${percentage > 80 ? 'warning' : ''}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="usage-percentage">{percentage}%</div>
    </div>
  )

  return (
    <div className="usage-dashboard">
      <h2>Usage Dashboard</h2>
      
      <div className="usage-section">
        <h3>Forms</h3>
        <UsageBar
          label="Forms Created"
          current={usageData.forms.current}
          limit={usageData.forms.limit}
          percentage={usageData.forms.percentage}
        />
        <p className="remaining">
          {usageData.forms.remaining} forms remaining
        </p>
      </div>

      <div className="usage-section">
        <h3>Submissions</h3>
        <div className="submissions-summary">
          <p>Total submissions: {usageData.submissions.current}</p>
          <p>Limit per form: {usageData.submissions.limit}</p>
        </div>
        
        <div className="per-form-usage">
          <h4>Per Form Usage</h4>
          {usageData.submissions.perForm.map((form) => (
            <div key={form.formId} className="form-usage">
              <span className="form-title">{form.formTitle}</span>
              <UsageBar
                label=""
                current={form.current}
                limit={form.limit}
                percentage={Math.round((form.current / form.limit) * 100)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="usage-section">
        <h3>Export Permissions</h3>
        <div className="export-permissions">
          <div className="permission-item">
            <span className="permission-label">Form Exports:</span>
            <span className={`permission-status ${usageData.exports.formsAllowed ? 'allowed' : 'denied'}`}>
              {usageData.exports.formsAllowed ? 'Allowed' : 'Not Allowed'}
            </span>
            {usageData.exports.formsAllowed && (
              <span className="permission-limit">
                ({usageData.exports.maxExportsPerForm} per form)
              </span>
            )}
          </div>
          
          <div className="permission-item">
            <span className="permission-label">Submission Exports:</span>
            <span className={`permission-status ${usageData.exports.submissionsAllowed ? 'allowed' : 'denied'}`}>
              {usageData.exports.submissionsAllowed ? 'Allowed' : 'Not Allowed'}
            </span>
            {usageData.exports.submissionsAllowed && (
              <span className="permission-limit">
                ({usageData.exports.maxExportsPerSubmission} per submission)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UsageDashboard
```

### 5. Limit Exceeded Modal

```javascript
// components/LimitExceededModal.jsx
import React from 'react'
import PlanSelection from './PlanSelection.jsx'

const LimitExceededModal = ({ 
  isOpen, 
  onClose, 
  limitData, 
  upgradeOptions, 
  onUpgrade 
}) => {
  if (!isOpen) return null

  const { limitCheck } = limitData

  const getLimitMessage = () => {
    const messages = {
      create_form: `You've reached your limit of ${limitCheck.limit} forms. You currently have ${limitCheck.current} forms.`,
      create_submission: `This form has reached its submission limit of ${limitCheck.limit}. Currently has ${limitCheck.current} submissions.`,
      export_form: `You've reached your export limit of ${limitCheck.limit} exports for this form. You have already exported ${limitCheck.current} times.`,
      export_submission: `You've reached your export limit of ${limitCheck.limit} exports for this submission. You have already exported ${limitCheck.current} times.`
    }
    return messages[limitCheck.action] || 'You have reached your subscription limit.'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Limit Reached</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="limit-message">
            <p>{getLimitMessage()}</p>
          </div>
          
          <div className="upgrade-section">
            <h3>Upgrade Your Plan</h3>
            <p>Choose a higher plan to increase your limits:</p>
            
            <div className="upgrade-options">
              {upgradeOptions.map((plan) => (
                <div key={plan.id} className="upgrade-option">
                  <div className="plan-info">
                    <h4>{plan.displayName}</h4>
                    <p className="plan-price">
                      {plan.currencySymbol}{plan.priceMonthly}/month
                    </p>
                    <ul className="plan-benefits">
                      <li>{plan.maxForms} forms</li>
                      <li>{plan.maxSubmissionsPerForm} submissions per form</li>
                      {plan.features?.analytics && <li>Advanced analytics</li>}
                      {plan.features?.api_access && <li>API access</li>}
                    </ul>
                  </div>
                  <button 
                    className="upgrade-btn"
                    onClick={() => onUpgrade(plan)}
                  >
                    Upgrade to {plan.displayName}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LimitExceededModal
```

## 🎯 React Hooks

### Custom Hooks for Subscription Management

```javascript
// hooks/useSubscriptionLimits.js
import { useState, useCallback } from 'react'
import { subscriptionService } from '../services/subscriptionService.js'

export const useSubscriptionLimits = () => {
  const [checkingLimits, setCheckingLimits] = useState(false)

  const checkLimits = useCallback(async (action, resourceId = null) => {
    setCheckingLimits(true)
    try {
      const limitData = await subscriptionService.checkLimits(action, resourceId)
      return limitData
    } catch (error) {
      console.error('Failed to check limits:', error)
      throw error
    } finally {
      setCheckingLimits(false)
    }
  }, [])

  return {
    checkLimits,
    checkingLimits
  }
}
```

```javascript
// hooks/usePlanManagement.js
import { useState, useCallback } from 'react'
import { subscriptionService } from '../services/subscriptionService.js'

export const usePlanManagement = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const changePlan = useCallback(async (subscriptionId, newAccountTypeId, reason) => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedSubscription = await subscriptionService.changeSubscriptionPlan(
        subscriptionId,
        newAccountTypeId,
        reason
      )
      return updatedSubscription
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelSubscription = useCallback(async (subscriptionId, reason) => {
    setLoading(true)
    setError(null)
    
    try {
      const cancelledSubscription = await subscriptionService.cancelSubscription(
        subscriptionId,
        reason
      )
      return cancelledSubscription
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    changePlan,
    cancelSubscription,
    loading,
    error
  }
}
```

## 🎨 CSS Styles

### Basic Styling for Subscription Components

```css
/* styles/subscription.css */

.subscription-status {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.subscription-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.trial-badge {
  background: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  margin-left: 8px;
}

.usage-bar {
  margin: 10px 0;
}

.usage-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 14px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #28a745;
  transition: width 0.3s ease;
}

.progress-fill.warning {
  background: #ffc107;
}

.progress-fill.danger {
  background: #dc3545;
}

.plan-selection {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.billing-cycle-selector {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.billing-cycle-selector button {
  padding: 10px 20px;
  border: 2px solid #e9ecef;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.billing-cycle-selector button:first-child {
  border-radius: 8px 0 0 8px;
}

.billing-cycle-selector button:last-child {
  border-radius: 0 8px 8px 0;
}

.billing-cycle-selector button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.plan-card {
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.plan-card:hover {
  border-color: #007bff;
  transform: translateY(-2px);
}

.plan-card.selected {
  border-color: #007bff;
  background: #f8f9ff;
}

.plan-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.plan-header {
  text-align: center;
  margin-bottom: 20px;
}

.plan-price {
  margin: 10px 0;
}

.price {
  font-size: 32px;
  font-weight: bold;
  color: #007bff;
}

.period {
  color: #6c757d;
  font-size: 16px;
}

.plan-features ul {
  list-style: none;
  padding: 0;
}

.plan-features li {
  padding: 8px 0;
  border-bottom: 1px solid #f8f9fa;
}

.plan-features li:before {
  content: "✓";
  color: #28a745;
  font-weight: bold;
  margin-right: 8px;
}

.plan-actions {
  margin-top: 20px;
}

.select-btn, .upgrade-btn, .downgrade-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-btn {
  background: #007bff;
  color: white;
}

.upgrade-btn {
  background: #28a745;
  color: white;
}

.downgrade-btn {
  background: #ffc107;
  color: #212529;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 20px;
}

.upgrade-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.upgrade-option {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.plan-benefits {
  list-style: none;
  padding: 0;
  margin: 10px 0;
}

.plan-benefits li {
  padding: 4px 0;
  font-size: 14px;
}

.plan-benefits li:before {
  content: "✓";
  color: #28a745;
  margin-right: 5px;
}
```

## 🔧 Integration Examples

### 1. Form Creation with Limit Checking

```javascript
// components/CreateFormButton.jsx
import React, { useState } from 'react'
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits.js'
import LimitExceededModal from './LimitExceededModal.jsx'

const CreateFormButton = ({ onCreateForm }) => {
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [limitData, setLimitData] = useState(null)
  const { checkLimits, checkingLimits } = useSubscriptionLimits()

  const handleCreateForm = async () => {
    try {
      const limitCheck = await checkLimits('create_form')
      
      if (!limitCheck.allowed) {
        setLimitData({ limitCheck })
        setShowLimitModal(true)
        return
      }
      
      onCreateForm()
    } catch (error) {
      console.error('Failed to check limits:', error)
      alert('Failed to check subscription limits')
    }
  }

  return (
    <>
      <button 
        onClick={handleCreateForm}
        disabled={checkingLimits}
        className="create-form-btn"
      >
        {checkingLimits ? 'Checking...' : 'Create New Form'}
      </button>
      
      <LimitExceededModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitData={limitData}
        upgradeOptions={limitData?.upgradeOptions || []}
        onUpgrade={(plan) => {
          // Handle upgrade logic
          setShowLimitModal(false)
        }}
      />
    </>
  )
}

export default CreateFormButton
```

### 2. App Initialization

```javascript
// App.jsx
import React, { useEffect } from 'react'
import { SubscriptionProvider } from './contexts/SubscriptionContext.js'
import { authService } from './services/authService.js'
import SubscriptionStatus from './components/SubscriptionStatus.jsx'
import UsageDashboard from './components/UsageDashboard.jsx'

function App() {
  useEffect(() => {
    // Initialize authentication
    authService.initializeAuth()
  }, [])

  return (
    <SubscriptionProvider>
      <div className="app">
        <header>
          <h1>Dynamic Forms</h1>
          <SubscriptionStatus />
        </header>
        
        <main>
          <UsageDashboard />
          {/* Your other app components */}
        </main>
      </div>
    </SubscriptionProvider>
  )
}

export default App
```

### 3. Subscription Management Page

```javascript
// pages/SubscriptionPage.jsx
import React, { useState, useEffect } from 'react'
import { useSubscription } from '../contexts/SubscriptionContext.js'
import PlanSelection from '../components/PlanSelection.jsx'
import { usePlanManagement } from '../hooks/usePlanManagement.js'

const SubscriptionPage = () => {
  const { subscription, refreshSubscription } = useSubscription()
  const { changePlan, cancelSubscription, loading } = usePlanManagement()
  const [showPlanSelection, setShowPlanSelection] = useState(false)

  const handlePlanChange = async (plan) => {
    try {
      if (subscription?.subscription) {
        await changePlan(subscription.subscription.id, plan.id, 'user_requested')
      } else {
        // Create new subscription
        // This would be handled by PlanSelection component
      }
      refreshSubscription()
      setShowPlanSelection(false)
    } catch (error) {
      alert('Failed to change plan: ' + error.message)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscription?.subscription) return
    
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      try {
        await cancelSubscription(subscription.subscription.id, 'user_requested')
        refreshSubscription()
      } catch (error) {
        alert('Failed to cancel subscription: ' + error.message)
      }
    }
  }

  return (
    <div className="subscription-page">
      <h1>Subscription Management</h1>
      
      {subscription && (
        <div className="current-subscription">
          <h2>Current Plan</h2>
          <div className="subscription-info">
            <p><strong>Plan:</strong> {subscription.accountType?.displayName}</p>
            <p><strong>Status:</strong> {subscription.subscription.status}</p>
            <p><strong>Billing:</strong> {subscription.subscription.billingCycle}</p>
            <p><strong>Amount:</strong> {subscription.subscription.currencySymbol}{subscription.subscription.amount}</p>
            {subscription.subscription.daysUntilExpiration && (
              <p><strong>Expires in:</strong> {subscription.subscription.daysUntilExpiration} days</p>
            )}
          </div>
          
          <div className="subscription-actions">
            <button 
              onClick={() => setShowPlanSelection(true)}
              className="change-plan-btn"
            >
              Change Plan
            </button>
            
            {subscription.subscription.status === 'active' && (
              <button 
                onClick={handleCancelSubscription}
                className="cancel-subscription-btn"
                disabled={loading}
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      )}
      
      {showPlanSelection && (
        <PlanSelection
          currentSubscription={subscription}
          onPlanChange={handlePlanChange}
        />
      )}
    </div>
  )
}

export default SubscriptionPage
```

## 🚀 Advanced Features

### 1. Real-time Usage Updates

```javascript
// hooks/useRealtimeUsage.js
import { useState, useEffect, useCallback } from 'react'
import { subscriptionService } from '../services/subscriptionService.js'

export const useRealtimeUsage = (interval = 30000) => {
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUsage = useCallback(async () => {
    try {
      const usageData = await subscriptionService.getSubscriptionUsage()
      setUsage(usageData)
    } catch (error) {
      console.error('Failed to fetch usage:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsage()
    
    const intervalId = setInterval(fetchUsage, interval)
    
    return () => clearInterval(intervalId)
  }, [fetchUsage, interval])

  return { usage, loading, refreshUsage: fetchUsage }
}
```

### 2. Subscription Notifications

```javascript
// hooks/useSubscriptionNotifications.js
import { useState, useEffect } from 'react'
import { subscriptionService } from '../services/subscriptionService.js'

export const useSubscriptionNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Check for subscription-related notifications
    const checkNotifications = () => {
      // This would integrate with your notification system
      // Check for trial ending, payment due, etc.
    }

    checkNotifications()
    const interval = setInterval(checkNotifications, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  return { notifications, unreadCount }
}
```

## 📱 Mobile Responsive Design

```css
/* Mobile styles */
@media (max-width: 768px) {
  .plans-grid {
    grid-template-columns: 1fr;
  }
  
  .plan-card {
    margin-bottom: 20px;
  }
  
  .billing-cycle-selector {
    flex-direction: column;
  }
  
  .billing-cycle-selector button {
    border-radius: 8px;
    margin-bottom: 5px;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
  
  .upgrade-options {
    grid-template-columns: 1fr;
  }
}
```

## 🔒 Error Handling

```javascript
// utils/errorHandler.js
export const handleSubscriptionError = (error, context = '') => {
  console.error(`Subscription Error ${context}:`, error)
  
  // Map common errors to user-friendly messages
  const errorMessages = {
    'User already has an active subscription': 'You already have an active subscription',
    'Account type not found': 'Selected plan is not available',
    'Subscription not found': 'Subscription not found',
    'Access denied': 'You do not have permission to perform this action'
  }
  
  return errorMessages[error.message] || 'An unexpected error occurred'
}
```

This comprehensive integration guide provides everything needed to integrate the subscription system into your frontend application. The components are designed to be reusable, responsive, and provide excellent user experience with proper error handling and loading states.
