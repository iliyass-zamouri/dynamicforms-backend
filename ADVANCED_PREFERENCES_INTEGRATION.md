# Advanced User Preferences Integration Guide

This guide explains how to extend the user preferences system to add new account types, limits, and features in the Dynamic Forms backend.

## Table of Contents

1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Adding New Account Types](#adding-new-account-types)
4. [Adding New Preference Fields](#adding-new-preference-fields)
5. [Adding New Limits](#adding-new-limits)
6. [Adding Export Features](#adding-export-features)
7. [Middleware Integration](#middleware-integration)
8. [Frontend Integration](#frontend-integration)
9. [Testing](#testing)
10. [Migration Strategy](#migration-strategy)

## System Overview

The user preferences system is designed with extensibility in mind. It consists of:

- **UserPreferences Model**: Core business logic and validation
- **Database Schema**: Flexible table structure with JSON support
- **Admin Endpoints**: Full CRUD operations for preferences management
- **User Model Integration**: Convenient methods for checking limits
- **Export Tracking**: Comprehensive export usage monitoring

## Database Schema

### Core Tables

#### `user_preferences`
```sql
CREATE TABLE user_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    account_type ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
    
    -- Form limits
    max_forms INT DEFAULT 5,
    max_submissions_per_form INT DEFAULT 100,
    
    -- Export permissions and limits
    can_export_forms BOOLEAN DEFAULT FALSE,
    can_export_submissions BOOLEAN DEFAULT FALSE,
    max_exports_per_form INT DEFAULT 0,
    max_exports_per_submission INT DEFAULT 0,
    
    -- Additional preferences (JSON for extensibility)
    additional_preferences JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preferences (user_id)
);
```

#### `export_tracking`
```sql
CREATE TABLE export_tracking (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    form_id VARCHAR(36),
    submission_id VARCHAR(36),
    export_type ENUM('form', 'submission') NOT NULL,
    export_format ENUM('json', 'csv', 'xlsx', 'pdf') NOT NULL,
    file_path VARCHAR(500),
    file_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    FOREIGN KEY (submission_id) REFERENCES form_submissions(id) ON DELETE CASCADE
);
```

## Adding New Account Types

### Step 1: Update Database Schema

Add the new account type to the ENUM:

```sql
-- Migration: Add new account type
ALTER TABLE user_preferences 
MODIFY COLUMN account_type ENUM('free', 'basic', 'premium', 'enterprise', 'custom') DEFAULT 'free';
```

### Step 2: Update UserPreferences Model

In `src/models/UserPreferences.js`, update the `getDefaultPreferences` method:

```javascript
static getDefaultPreferences(accountType) {
  const defaults = {
    free: {
      maxForms: 5,
      maxSubmissionsPerForm: 100,
      canExportForms: false,
      canExportSubmissions: false,
      maxExportsPerForm: 0,
      maxExportsPerSubmission: 0,
      additionalPreferences: {}
    },
    basic: {
      maxForms: 25,
      maxSubmissionsPerForm: 500,
      canExportForms: true,
      canExportSubmissions: true,
      maxExportsPerForm: 10,
      maxExportsPerSubmission: 10,
      additionalPreferences: {}
    },
    premium: {
      maxForms: 100,
      maxSubmissionsPerForm: 2000,
      canExportForms: true,
      canExportSubmissions: true,
      maxExportsPerForm: 50,
      maxExportsPerSubmission: 50,
      additionalPreferences: {}
    },
    enterprise: {
      maxForms: 999999,
      maxSubmissionsPerForm: 999999,
      canExportForms: true,
      canExportSubmissions: true,
      maxExportsPerForm: 999999,
      maxExportsPerSubmission: 999999,
      additionalPreferences: {}
    },
    // NEW ACCOUNT TYPE
    custom: {
      maxForms: 50,
      maxSubmissionsPerForm: 1000,
      canExportForms: true,
      canExportSubmissions: true,
      maxExportsPerForm: 25,
      maxExportsPerSubmission: 25,
      additionalPreferences: {
        customFeature: true,
        advancedAnalytics: true
      }
    }
  }

  return defaults[accountType] || defaults.free
}
```

### Step 3: Update Validation

In `src/routes/preferences.js`, update the validation:

```javascript
// Validate account type
if (updateData.accountType && !['free', 'basic', 'premium', 'enterprise', 'custom'].includes(updateData.accountType)) {
  return res.status(400).json({
    success: false,
    message: 'Invalid account type. Must be one of: free, basic, premium, enterprise, custom',
  })
}
```

## Adding New Preference Fields

### Step 1: Add Database Column

```sql
-- Migration: Add new preference field
ALTER TABLE user_preferences 
ADD COLUMN new_feature_enabled BOOLEAN DEFAULT FALSE;
```

### Step 2: Update UserPreferences Model

Add the field to the constructor and methods:

```javascript
export class UserPreferences {
  constructor(data) {
    this.id = data.id
    this.userId = data.user_id
    this.accountType = data.account_type
    this.maxForms = data.max_forms
    this.maxSubmissionsPerForm = data.max_submissions_per_form
    this.canExportForms = data.can_export_forms
    this.canExportSubmissions = data.can_export_submissions
    this.maxExportsPerForm = data.max_exports_per_form
    this.maxExportsPerSubmission = data.max_exports_per_submission
    this.newFeatureEnabled = data.new_feature_enabled // NEW FIELD
    this.additionalPreferences = data.additional_preferences
    this.createdAt = data.created_at
    this.updatedAt = data.updated_at
  }

  // Add validation method
  async canUseNewFeature() {
    return this.newFeatureEnabled
  }

  // Update the update method
  async update(updateData) {
    const allowedFields = [
      'accountType',
      'maxForms',
      'maxSubmissionsPerForm',
      'canExportForms',
      'canExportSubmissions',
      'maxExportsPerForm',
      'maxExportsPerSubmission',
      'newFeatureEnabled', // NEW FIELD
      'additionalPreferences'
    ]
    // ... rest of the method
  }

  // Update toJSON method
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      accountType: this.accountType,
      maxForms: this.maxForms,
      maxSubmissionsPerForm: this.maxSubmissionsPerForm,
      canExportForms: this.canExportForms,
      canExportSubmissions: this.canExportSubmissions,
      maxExportsPerForm: this.maxExportsPerForm,
      maxExportsPerSubmission: this.maxExportsPerSubmission,
      newFeatureEnabled: this.newFeatureEnabled, // NEW FIELD
      additionalPreferences: this.additionalPreferences,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}
```

### Step 3: Update Default Preferences

```javascript
static getDefaultPreferences(accountType) {
  const defaults = {
    free: {
      maxForms: 5,
      maxSubmissionsPerForm: 100,
      canExportForms: false,
      canExportSubmissions: false,
      maxExportsPerForm: 0,
      maxExportsPerSubmission: 0,
      newFeatureEnabled: false, // NEW FIELD
      additionalPreferences: {}
    },
    // ... other account types
  }
}
```

### Step 4: Update User Model

Add convenience method to User model:

```javascript
// In src/models/User.js
async canUseNewFeature() {
  const preferences = await this.getPreferences()
  return await preferences.canUseNewFeature()
}
```

## Adding New Limits

### Step 1: Add Database Column

```sql
-- Migration: Add new limit field
ALTER TABLE user_preferences 
ADD COLUMN max_api_calls_per_day INT DEFAULT 100;
```

### Step 2: Update UserPreferences Model

```javascript
export class UserPreferences {
  constructor(data) {
    // ... existing fields
    this.maxApiCallsPerDay = data.max_api_calls_per_day // NEW FIELD
  }

  // Add limit checking method
  async canMakeApiCall() {
    const currentApiCalls = await this.getCurrentApiCallsToday()
    return currentApiCalls < this.maxApiCallsPerDay
  }

  // Add usage tracking method
  async getCurrentApiCallsToday() {
    const sql = `
      SELECT COUNT(*) as count 
      FROM api_usage_tracking 
      WHERE user_id = ? AND DATE(created_at) = CURDATE()
    `
    const result = await executeQuery(sql, [this.userId])
    
    if (result.success) {
      return result.data[0].count
    }
    
    return 0
  }

  // Update methods...
}
```

### Step 3: Create Usage Tracking Table

```sql
-- Migration: Add API usage tracking
CREATE TABLE api_usage_tracking (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, created_at)
);
```

### Step 4: Create Middleware

Create `src/middleware/apiUsageLimiter.js`:

```javascript
import { UserPreferences } from '../models/UserPreferences.js'
import { executeQuery } from '../database/connection.js'

export const apiUsageLimiter = async (req, res, next) => {
  try {
    if (!req.user) {
      return next()
    }

    const preferences = await req.user.getPreferences()
    const canMakeApiCall = await preferences.canMakeApiCall()

    if (!canMakeApiCall) {
      return res.status(429).json({
        success: false,
        message: `API rate limit exceeded. Your plan allows ${preferences.maxApiCallsPerDay} API calls per day.`,
        data: {
          limit: preferences.maxApiCallsPerDay,
          accountType: preferences.accountType
        }
      })
    }

    // Record the API call
    await UserPreferences.recordApiCall({
      userId: req.user.id,
      endpoint: req.path,
      method: req.method
    })

    next()
  } catch (error) {
    console.error('API usage limiter error:', error)
    next() // Continue on error to avoid breaking the app
  }
}
```

### Step 5: Add Recording Method

In `UserPreferences.js`:

```javascript
// Record an API call
static async recordApiCall(apiCallData) {
  const { userId, endpoint, method } = apiCallData
  
  const callId = crypto.randomUUID()
  
  const sql = `
    INSERT INTO api_usage_tracking (id, user_id, endpoint, method)
    VALUES (?, ?, ?, ?)
  `
  
  const result = await executeQuery(sql, [callId, userId, endpoint, method])
  return result.success
}
```

## Adding Export Features

### Step 1: Add New Export Format

Update the export_tracking table:

```sql
-- Migration: Add new export format
ALTER TABLE export_tracking 
MODIFY COLUMN export_format ENUM('json', 'csv', 'xlsx', 'pdf', 'xml') NOT NULL;
```

### Step 2: Create Export Service

Create `src/services/exportService.js`:

```javascript
import { UserPreferences } from '../models/UserPreferences.js'
import { Form } from '../models/Form.js'
import { FormSubmission } from '../models/FormSubmission.js'

export class ExportService {
  static async exportForm(userId, formId, format = 'json') {
    // Check permissions
    const preferences = await UserPreferences.findByUserId(userId)
    if (!preferences.canExportForm()) {
      throw new Error('Export forms not allowed for this account')
    }

    if (!preferences.canExportFormWithinLimits(formId)) {
      throw new Error('Export limit reached for this form')
    }

    // Get form data
    const form = await Form.findById(formId)
    if (!form) {
      throw new Error('Form not found')
    }

    // Generate export based on format
    let exportData
    let filePath
    let fileSize

    switch (format) {
      case 'json':
        exportData = JSON.stringify(form.toJSON(), null, 2)
        filePath = `/exports/form_${formId}_${Date.now()}.json`
        fileSize = Buffer.byteLength(exportData, 'utf8')
        break
      case 'csv':
        exportData = this.convertFormToCSV(form)
        filePath = `/exports/form_${formId}_${Date.now()}.csv`
        fileSize = Buffer.byteLength(exportData, 'utf8')
        break
      case 'xml':
        exportData = this.convertFormToXML(form)
        filePath = `/exports/form_${formId}_${Date.now()}.xml`
        fileSize = Buffer.byteLength(exportData, 'utf8')
        break
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }

    // Record the export
    await UserPreferences.recordExport({
      userId,
      formId,
      submissionId: null,
      exportType: 'form',
      exportFormat: format,
      filePath,
      fileSize
    })

    return {
      data: exportData,
      filePath,
      fileSize,
      format
    }
  }

  static convertFormToCSV(form) {
    // Implementation for CSV conversion
    const headers = ['Field ID', 'Field Type', 'Label', 'Required', 'Options']
    const rows = []

    form.steps.forEach(step => {
      step.fields.forEach(field => {
        const options = field.options ? field.options.map(opt => `${opt.label}:${opt.value}`).join(';') : ''
        rows.push([
          field.id,
          field.type,
          field.label,
          field.required ? 'Yes' : 'No',
          options
        ])
      })
    })

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  static convertFormToXML(form) {
    // Implementation for XML conversion
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<form>\n'
    xml += `  <id>${form.id}</id>\n`
    xml += `  <title>${form.title}</title>\n`
    xml += `  <description>${form.description || ''}</description>\n`
    xml += '  <steps>\n'

    form.steps.forEach(step => {
      xml += '    <step>\n'
      xml += `      <title>${step.title}</title>\n`
      xml += '      <fields>\n'

      step.fields.forEach(field => {
        xml += '        <field>\n'
        xml += `          <id>${field.id}</id>\n`
        xml += `          <type>${field.type}</type>\n`
        xml += `          <label>${field.label}</label>\n`
        xml += `          <required>${field.required}</required>\n`
        
        if (field.options && field.options.length > 0) {
          xml += '          <options>\n'
          field.options.forEach(option => {
            xml += '            <option>\n'
            xml += `              <label>${option.label}</label>\n`
            xml += `              <value>${option.value}</value>\n`
            xml += '            </option>\n'
          })
          xml += '          </options>\n'
        }

        xml += '        </field>\n'
      })

      xml += '      </fields>\n'
      xml += '    </step>\n'
    })

    xml += '  </steps>\n'
    xml += '</form>'

    return xml
  }
}
```

### Step 3: Create Export Endpoints

Add to `src/routes/forms.js`:

```javascript
/**
 * @swagger
 * /api/forms/{id}/export:
 *   post:
 *     summary: Export form data
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Form ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, xml]
 *           default: json
 *         description: Export format
 *     responses:
 *       200:
 *         description: Form exported successfully
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
 *                         exportData:
 *                           type: string
 *                         filePath:
 *                           type: string
 *                         fileSize:
 *                           type: integer
 *                         format:
 *                           type: string
 *       403:
 *         description: Export not allowed or limit reached
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Form not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Export form
router.post('/:id/export', authenticateToken, validateFormId, async (req, res) => {
  try {
    const { id } = req.params
    const { format = 'json' } = req.query

    const form = await Form.findById(id)

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      })
    }

    // Check if user owns the form or is admin
    if (req.user.role !== 'admin' && form.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      })
    }

    const exportResult = await ExportService.exportForm(req.user.id, id, format)

    res.json({
      success: true,
      message: 'Form exported successfully',
      data: exportResult,
    })
  } catch (error) {
    console.error('Export form error:', error)
    
    if (error.message.includes('not allowed') || error.message.includes('limit reached')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      })
    }

    sendErrorResponse(res, error, req, 'Internal server error', 500)
  }
})
```

## Middleware Integration

### Rate Limiting Middleware

Create `src/middleware/preferencesLimiter.js`:

```javascript
import { UserPreferences } from '../models/UserPreferences.js'

export const preferencesLimiter = (checkType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next()
      }

      const preferences = await req.user.getPreferences()
      let canProceed = false

      switch (checkType) {
        case 'createForm':
          canProceed = await preferences.canCreateForm()
          break
        case 'createSubmission':
          canProceed = await preferences.canCreateSubmission(req.params.formId || req.body.formId)
          break
        case 'exportForm':
          canProceed = await preferences.canExportFormWithinLimits(req.params.id)
          break
        case 'exportSubmission':
          canProceed = await preferences.canExportSubmissionWithinLimits(req.params.id)
          break
        default:
          canProceed = true
      }

      if (!canProceed) {
        return res.status(403).json({
          success: false,
          message: `Action not allowed based on your ${preferences.accountType} plan limits`,
          data: {
            accountType: preferences.accountType,
            preferences: preferences.toJSON()
          }
        })
      }

      next()
    } catch (error) {
      console.error('Preferences limiter error:', error)
      next() // Continue on error
    }
  }
}
```

### Usage in Routes

```javascript
import { preferencesLimiter } from '../middleware/preferencesLimiter.js'

// Apply to specific routes
router.post('/', authenticateToken, preferencesLimiter('createForm'), validateFormCreation, async (req, res) => {
  // Route handler
})

router.post('/:id/export', authenticateToken, preferencesLimiter('exportForm'), async (req, res) => {
  // Export handler
})
```

## Frontend Integration

### Preference Management Component

```javascript
// components/PreferencesManager.jsx
import React, { useState, useEffect } from 'react'
import { api } from '../services/api'

const PreferencesManager = () => {
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/preferences')
      setPreferences(response.data.data.preferences)
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (newPreferences) => {
    try {
      const response = await api.put('/preferences', {
        additionalPreferences: newPreferences
      })
      setPreferences(response.data.data.preferences)
    } catch (error) {
      console.error('Failed to update preferences:', error)
    }
  }

  if (loading) return <div>Loading preferences...</div>

  return (
    <div className="preferences-manager">
      <h2>Account Preferences</h2>
      <div className="account-info">
        <p><strong>Account Type:</strong> {preferences.accountType}</p>
        <p><strong>Forms Limit:</strong> {preferences.maxForms}</p>
        <p><strong>Submissions per Form:</strong> {preferences.maxSubmissionsPerForm}</p>
        <p><strong>Export Forms:</strong> {preferences.canExportForms ? 'Yes' : 'No'}</p>
        <p><strong>Export Submissions:</strong> {preferences.canExportSubmissions ? 'Yes' : 'No'}</p>
      </div>
      
      <div className="additional-preferences">
        <h3>Additional Settings</h3>
        <label>
          <input
            type="checkbox"
            checked={preferences.additionalPreferences?.darkMode || false}
            onChange={(e) => updatePreferences({
              ...preferences.additionalPreferences,
              darkMode: e.target.checked
            })}
          />
          Dark Mode
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={preferences.additionalPreferences?.notifications || false}
            onChange={(e) => updatePreferences({
              ...preferences.additionalPreferences,
              notifications: e.target.checked
            })}
          />
          Email Notifications
        </label>
      </div>
    </div>
  )
}

export default PreferencesManager
```

### Admin Preferences Management

```javascript
// components/AdminPreferencesManager.jsx
import React, { useState, useEffect } from 'react'
import { api } from '../services/api'

const AdminPreferencesManager = () => {
  const [preferences, setPreferences] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllPreferences()
  }, [])

  const fetchAllPreferences = async () => {
    try {
      const response = await api.get('/preferences/admin')
      setPreferences(response.data.data.preferences)
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserPreferences = async (userId, updates) => {
    try {
      await api.put(`/preferences/admin/${userId}`, updates)
      fetchAllPreferences() // Refresh the list
    } catch (error) {
      console.error('Failed to update user preferences:', error)
    }
  }

  const resetUserPreferences = async (userId, accountType) => {
    try {
      await api.post(`/preferences/admin/${userId}/reset?accountType=${accountType}`)
      fetchAllPreferences() // Refresh the list
    } catch (error) {
      console.error('Failed to reset user preferences:', error)
    }
  }

  if (loading) return <div>Loading preferences...</div>

  return (
    <div className="admin-preferences-manager">
      <h2>User Preferences Management</h2>
      
      <table className="preferences-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Account Type</th>
            <th>Max Forms</th>
            <th>Max Submissions</th>
            <th>Export Forms</th>
            <th>Export Submissions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {preferences.map(pref => (
            <tr key={pref.id}>
              <td>{pref.userName} ({pref.userEmail})</td>
              <td>
                <select
                  value={pref.accountType}
                  onChange={(e) => updateUserPreferences(pref.userId, {
                    accountType: e.target.value
                  })}
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </td>
              <td>
                <input
                  type="number"
                  value={pref.maxForms}
                  onChange={(e) => updateUserPreferences(pref.userId, {
                    maxForms: parseInt(e.target.value)
                  })}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={pref.maxSubmissionsPerForm}
                  onChange={(e) => updateUserPreferences(pref.userId, {
                    maxSubmissionsPerForm: parseInt(e.target.value)
                  })}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={pref.canExportForms}
                  onChange={(e) => updateUserPreferences(pref.userId, {
                    canExportForms: e.target.checked
                  })}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={pref.canExportSubmissions}
                  onChange={(e) => updateUserPreferences(pref.userId, {
                    canExportSubmissions: e.target.checked
                  })}
                />
              </td>
              <td>
                <button
                  onClick={() => resetUserPreferences(pref.userId, 'free')}
                  className="btn-reset"
                >
                  Reset to Free
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AdminPreferencesManager
```

## Testing

### Unit Tests

Create `tests/models/UserPreferences.test.js`:

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { UserPreferences } from '../../src/models/UserPreferences.js'
import { User } from '../../src/models/User.js'

describe('UserPreferences', () => {
  let testUser
  let testPreferences

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123'
    })

    // Create test preferences
    testPreferences = await UserPreferences.createDefault(testUser.id, 'free')
  })

  afterEach(async () => {
    // Cleanup
    if (testUser) {
      await testUser.delete()
    }
  })

  it('should create default preferences for free account', async () => {
    expect(testPreferences.accountType).toBe('free')
    expect(testPreferences.maxForms).toBe(5)
    expect(testPreferences.maxSubmissionsPerForm).toBe(100)
    expect(testPreferences.canExportForms).toBe(false)
    expect(testPreferences.canExportSubmissions).toBe(false)
  })

  it('should check form creation limits', async () => {
    // Should be able to create forms initially
    expect(await testPreferences.canCreateForm()).toBe(true)

    // Create 5 forms to reach limit
    for (let i = 0; i < 5; i++) {
      await Form.create({
        title: `Test Form ${i}`,
        userId: testUser.id
      })
    }

    // Should not be able to create more forms
    expect(await testPreferences.canCreateForm()).toBe(false)
  })

  it('should update preferences', async () => {
    const success = await testPreferences.update({
      maxForms: 10,
      canExportForms: true
    })

    expect(success).toBe(true)

    const updatedPreferences = await UserPreferences.findByUserId(testUser.id)
    expect(updatedPreferences.maxForms).toBe(10)
    expect(updatedPreferences.canExportForms).toBe(true)
  })
})
```

### Integration Tests

Create `tests/routes/preferences.test.js`:

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import app from '../../src/app.js'
import { User } from '../../src/models/User.js'
import { UserPreferences } from '../../src/models/UserPreferences.js'

describe('Preferences Routes', () => {
  let testUser
  let authToken

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123'
    })

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      })

    authToken = loginResponse.body.data.token
  })

  afterEach(async () => {
    if (testUser) {
      await testUser.delete()
    }
  })

  it('should get user preferences', async () => {
    const response = await request(app)
      .get('/api/preferences')
      .set('Authorization', `Bearer ${authToken}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.preferences).toBeDefined()
    expect(response.body.data.preferences.accountType).toBe('free')
  })

  it('should update user preferences', async () => {
    const response = await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        additionalPreferences: {
          darkMode: true,
          notifications: false
        }
      })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.preferences.additionalPreferences.darkMode).toBe(true)
    expect(response.body.data.preferences.additionalPreferences.notifications).toBe(false)
  })

  it('should enforce form creation limits', async () => {
    // Create 5 forms to reach free plan limit
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/forms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: `Test Form ${i}`
        })
    }

    // Try to create one more form
    const response = await request(app)
      .post('/api/forms')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Excess Form'
      })

    expect(response.status).toBe(403)
    expect(response.body.success).toBe(false)
    expect(response.body.message).toContain('Limite de formulaires atteinte')
  })
})
```

## Migration Strategy

### Database Migrations

1. **Always create migration files** in `src/database/migrations/`
2. **Test migrations** on a copy of production data
3. **Use transactions** for complex migrations
4. **Provide rollback scripts** when possible

### Example Migration File

```sql
-- Migration: Add new preference features
-- File: src/database/migrations/add_advanced_features.sql

START TRANSACTION;

-- Add new columns
ALTER TABLE user_preferences 
ADD COLUMN advanced_analytics BOOLEAN DEFAULT FALSE,
ADD COLUMN custom_domains INT DEFAULT 0,
ADD COLUMN api_rate_limit INT DEFAULT 100;

-- Update existing records based on account type
UPDATE user_preferences 
SET 
  advanced_analytics = CASE 
    WHEN account_type IN ('premium', 'enterprise') THEN TRUE 
    ELSE FALSE 
  END,
  custom_domains = CASE 
    WHEN account_type = 'enterprise' THEN 5
    WHEN account_type = 'premium' THEN 2
    ELSE 0
  END,
  api_rate_limit = CASE 
    WHEN account_type = 'enterprise' THEN 10000
    WHEN account_type = 'premium' THEN 1000
    WHEN account_type = 'basic' THEN 500
    ELSE 100
  END;

-- Create new tracking table
CREATE TABLE custom_domain_tracking (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

COMMIT;
```

### Rollback Script

```sql
-- Rollback: Remove advanced features
-- File: src/database/migrations/rollback_advanced_features.sql

START TRANSACTION;

-- Drop tracking table
DROP TABLE IF EXISTS custom_domain_tracking;

-- Remove columns
ALTER TABLE user_preferences 
DROP COLUMN advanced_analytics,
DROP COLUMN custom_domains,
DROP COLUMN api_rate_limit;

COMMIT;
```

## Best Practices

1. **Always validate input** in both frontend and backend
2. **Use transactions** for related database operations
3. **Implement proper error handling** with meaningful messages
4. **Log all preference changes** for audit purposes
5. **Test thoroughly** with different account types
6. **Document all new features** in API documentation
7. **Consider backward compatibility** when making changes
8. **Use feature flags** for gradual rollouts
9. **Monitor usage patterns** to optimize limits
10. **Provide clear upgrade paths** for users

## Conclusion

This system provides a flexible foundation for managing user preferences and account limits. By following this guide, you can easily extend the system with new features, account types, and limitations while maintaining data integrity and providing a smooth user experience.

The key to successful integration is:
- **Planning**: Design your changes before implementing
- **Testing**: Thoroughly test all scenarios
- **Documentation**: Keep documentation up to date
- **Monitoring**: Track usage and performance
- **Iteration**: Continuously improve based on feedback
