# Frontend OAuth Integration Guide - Google & LinkedIn Login

This guide provides comprehensive instructions for integrating Google and LinkedIn OAuth authentication into your frontend application.

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
    localStorage.setItem('authToken', token)
  },
  
  // Remove authentication token
  clearAuthToken() {
    delete this.headers['Authorization']
    localStorage.removeItem('authToken')
  }
}

export default apiClient
```

### 2. OAuth Authentication Service

```javascript
// services/oauthService.js
import apiClient from '../config/api.js'

export const oauthService = {
  /**
   * Login with Google ID token
   * @param {string} idToken - Google ID token from Google Sign-In
   * @returns {Promise<{user: Object, token: string}>}
   */
  async loginWithGoogle(idToken) {
    const response = await fetch(`${apiClient.baseURL}/auth/oauth/google`, {
      method: 'POST',
      headers: apiClient.headers,
      body: JSON.stringify({ idToken })
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Google authentication failed')
    }
    
    // Store token and update API client
    apiClient.setAuthToken(data.data.token)
    
    return {
      user: data.data.user,
      token: data.data.token
    }
  },

  /**
   * Login with LinkedIn authorization code
   * @param {string} code - LinkedIn authorization code
   * @param {string} redirectUri - Redirect URI used in LinkedIn app config
   * @returns {Promise<{user: Object, token: string}>}
   */
  async loginWithLinkedIn(code, redirectUri) {
    const response = await fetch(`${apiClient.baseURL}/auth/oauth/linkedin`, {
      method: 'POST',
      headers: apiClient.headers,
      body: JSON.stringify({ code, redirectUri })
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'LinkedIn authentication failed')
    }
    
    // Store token and update API client
    apiClient.setAuthToken(data.data.token)
    
    return {
      user: data.data.user,
      token: data.data.token
    }
  }
}

export default oauthService
```

## 🔵 Google Sign-In Integration

### Option 1: Using Google Identity Services (Recommended)

```javascript
// services/googleAuth.js
export class GoogleAuthService {
  constructor(clientId) {
    this.clientId = clientId
    this.initialized = false
  }

  /**
   * Initialize Google Identity Services
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.accounts) {
        this.initialized = true
        resolve()
        return
      }

      // Load Google Identity Services script
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: this.handleCredentialResponse.bind(this)
        })
        this.initialized = true
        resolve()
      }
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
      document.head.appendChild(script)
    })
  }

  /**
   * Render Google Sign-In button
   * @param {string} elementId - ID of the element to render the button
   * @param {Object} options - Button options (theme, size, text, etc.)
   */
  renderButton(elementId, options = {}) {
    if (!this.initialized) {
      console.error('Google Auth not initialized. Call initialize() first.')
      return
    }

    window.google.accounts.id.renderButton(
      document.getElementById(elementId),
      {
        theme: options.theme || 'outline',
        size: options.size || 'large',
        text: options.text || 'signin_with',
        shape: options.shape || 'rectangular',
        logo_alignment: options.logoAlignment || 'left',
        ...options
      }
    )
  }

  /**
   * Handle credential response from Google
   * @param {Object} response - Credential response from Google
   */
  async handleCredentialResponse(response) {
    try {
      // Send ID token to backend
      const result = await oauthService.loginWithGoogle(response.credential)
      
      // Dispatch custom event for successful login
      window.dispatchEvent(new CustomEvent('googleSignInSuccess', {
        detail: result
      }))
    } catch (error) {
      window.dispatchEvent(new CustomEvent('googleSignInError', {
        detail: { error: error.message }
      }))
    }
  }

  /**
   * Prompt one-tap sign-in
   */
  promptOneTap() {
    if (!this.initialized) return
    
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // One-tap not available or skipped
        console.log('One-tap sign-in not available')
      }
    })
  }
}
```

### Option 2: Using Legacy Google Sign-In Button

```javascript
// services/googleAuthLegacy.js
export class GoogleAuthLegacyService {
  constructor(clientId) {
    this.clientId = clientId
  }

  /**
 \- Load Google Sign-In library
   */
  loadScript() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Google Sign-In'))
      document.head.appendChild(script)
    })
  }

  /**
   * Initialize and sign in
   */
  async signIn() {
    try {
      await this.loadScript()
      
      return new Promise((resolve, reject) => {
        window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: 'openid email profile',
          callback: async (tokenResponse) => {
            try {
              // Get user info
              const userInfo = await this.getUserInfo(tokenResponse.access_token)
              
              // For ID token, you can use the token directly or exchange it
              // Note: For ID token, use the credential response approach above
              resolve(userInfo)
            } catch (error) {
              reject(error)
            }
          }
        }).requestAccessToken()
      })
    } catch (error) {
      throw new Error(`Google Sign-In failed: ${error.message}`)
    }
  }
}
```

## 🔷 LinkedIn Sign-In Integration

```javascript
// services/linkedInAuth.js
export class LinkedInAuthService {
  constructor(clientId, redirectUri) {
    this.clientId = clientId
    this.redirectUri = redirectUri
    this.scopes = ['openid', 'profile', 'email']
  }

  /**
   * Get LinkedIn authorization URL
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      state: this.generateState() // CSRF protection
    })

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  }

  /**
   * Generate的身 state parameter for CSRF protection
   * @returns {string} Random state string
   */
  generateState() {
    const state = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem('linkedin_oauth_state', state)
    return state
  }

  /**
   * Verify state parameter
   * @param {string} state - State parameter from callback
   * @returns {boolean} True if state is valid
   */
  verifyState(state) {
    const savedState = sessionStorage.getItem('linkedin_oauth_state')
    sessionStorage.removeItem('linkedin_oauth_state')
    return savedState === state
  }

  /**
   * Initiate LinkedIn login
   */
  login() {
    window.location.href = this.getAuthorizationUrl()
  }

  /**
   * Handle OAuth callback
   * @param {string} code - Authorization code from callback
   * @param {string} state - State parameter from callback
   * @returns {Promise<{user: Object, token: string}>}
   */
  async handleCallback(code, state) {
    if (!this.verifyState(state)) {
      throw new Error('Invalid state parameter. Possible CSRF attack.')
    }

    try {
      const result = await oauthService.loginWithLinkedIn(code, this.redirectUri)
      return result
    } catch (error) {
      throw new Error(`LinkedIn authentication failed: ${error.message}`)
    }
  }

  /**
   * Check if current URL is OAuth callback
   * @returns {boolean} True if URL contains OAuth callback parameters
   */
  isCallback() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.has('code') && urlParams.has('state')
  }

  /**
   * Process callback if present
   * @returns {Promise<{user: Object, token: string}>|null}
   */
  async processCallback() {
    if (!this.isCallback()) {
      return null
    }

    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname)

    return await this.handleCallback(code, state)
  }
}
```

## 🎨 React Components

### 1. Google Sign-In Button Component

```jsx
// components/GoogleSignInButton.jsx
import React, { useEffect, useRef, useState } from 'react'
import { GoogleAuthService } from '../services/googleAuth.js'
import oauthService from '../services/oauthService.js'

const GoogleSignInButton = ({ 
  clientId, 
  onSuccess, 
  onError,
  theme = 'outline',
  size = 'large',
  text = 'signin_with',
  className = ''
}) => {
  const buttonRef = useRef(null)
  const [googleAuth, setGoogleAuth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initGoogleAuth = async () => {
      try {
        const authService = new GoogleAuthService(clientId)
        await authService.initialize()
        setGoogleAuth(authService)
        setLoading(false)

        // Render button once initialized
        if (buttonRef.current) {
          authService.renderButton(buttonRef.current.id, { theme, size, text })
        }

        // Set up event listeners
        window.addEventListener('googleMirrorInSuccess', handleSuccess)
        window.addEventListener('googleSignInError', handleError)
      } catch (error) {
        console.error('Failed to initialize Google Auth:', error)
        setLoading(false)
        if (onError) onError(error)
      }
    }

    initGoogleAuth()

    return () => {
      window.removeEventListener('googleSignInSuccess', handleSuccess)
      window.removeEventListener('googleSignInError', handleError)
    }
  }, [clientId, theme, size, text])

  const handleSuccess = async (event) => {
    try {
      const { user, token } = event.detail
      if (onSuccess) {
        onSuccess({ user, token })
      }
    } catch (error) {
      if (onError) {
        onError(error)
      }
    }
  }

  const handleError = (event) => {
    if (onError) {
      onError(new Error(event.detail.error))
    }
  }

  if (loading) {
    return <div className="google-signin-loading">Loading Google Sign-In...</div>
  }

  return (
    <div className={`google-signin-wrapper ${className}`}>
      <div ref={buttonRef} id="google-signin-button"></div>
    </div>
  )
}

export default GoogleSignInButton
```

### 2. LinkedIn Sign-In Button Component

```jsx
// components/LinkedInSignInButton.jsx
import React, { useEffect, useState } from 'react'
import { LinkedInAuthService } from '../services/linkedInAuth.js'

const LinkedInSignInButton = ({ 
  clientId, 
  redirectUri,
  onSuccess,
  onError,
  className = '',
  buttonText = 'Sign in with LinkedIn'
}) => {
  const [linkedInAuth, setLinkedInAuth] = useState(null)

  useEffect(() => {
    // Initialize LinkedIn auth service
    const authService = new LinkedInAuthService(clientId, redirectUri)
    setLinkedInAuth(authService)

    // Check if this is an OAuth callback
    const processCallback = async () => {
      try {
        const result = await authService.processCallback()
        if (result && onSuccess) {
          onSuccess(result)
        }
      } catch (error) {
        if (onError) {
          onError(error)
        }
      }
    }

    processCallback()
  }, [clientId, redirectUri, onSuccess, onError])

  const handleClick = () => {
    if (linkedInAuth) {
      linkedInAuth.login()
    }
  }

  return (
    <button 
      className={`linkedin-signin-button ${className}`}
      onClick={handleClick}
      type="button"
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        style={{ marginRight: '8px', verticalAlign: 'middle' }}
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      {buttonText}
    </button>
  )
}

export default LinkedInSignInButton
```

### 3. OAuth Login Form Component

```jsx
// components/OAuthLoginForm.jsx
import React, { useState } from 'react'
import GoogleSignInButton from './GoogleSignInButton.jsx'
import LinkedInSignInButton from './LinkedInSignInButton.jsx'
import './OAuthLoginForm.css'

const OAuthLoginForm = ({ 
  onSuccess, 
  onError,
  googleClientId,
  linkedInClientId,
  linkedInRedirectUri 
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSuccess = async (data) => {
    setLoading(true)
    setError(null)
    
    try {
      if (onSuccess) {
        await onSuccess(data)
      }
    } catch (err) {
      setError(err.message)
      if (onError) {
        onError(err)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleError = (err) => {
    setError(err.message || 'Authentication failed')
    if (onError) {
      onError(err)
    }
  }

  return (
    <div className="oauth-login-form">
      <div className="oauth-divider">
        <span>Or continue with</span>
      </div>

      <div className="oauth-buttons">
        {googleClientId && (
          <div className="oauth-button-wrapper">
            <GoogleSignInButton
              clientId={googleClientId}
              onSuccess={handleSuccess}
              onError={handleError}
              theme="outline"
              size="large"
            />
          </div>
        )}

        {linkedInClientId && linkedInRedirectUri && (
          <div className="oauth-button-wrapper">
            <LinkedInSignInButton
              clientId={linkedInClientId}
              redirectUri={linkedInRedirectUri}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>
        )}
      </div>

      {loading && (
        <div className="oauth-loading">Authenticating...</div>
      )}

      {error && (
        <div className="oauth-error">
          {error}
        </div>
      )}
    </div>
  )
}

export default OAuthLoginForm
```

## 🔧 React Hooks

### 1. useOAuth Hook

```jsx
// hooks/useOAuth.js
import { useState, useCallback } from 'react'
import oauthService from '../services/oauthService.js'

export const useOAuth = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  const loginWithGoogle = useCallback(async (idToken) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await oauthService.loginWithGoogle(idToken)
      setUser(result.user)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const loginWithLinkedIn = useCallback(async (code, redirectUri) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await oauthService.loginWithLinkedIn(code, redirectUri)
      setUser(result.user)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    apiClient.clearAuthToken()
    setUser(null)
    setError(null)
  }, [])

  return {
    user,
    loading,
    error,
    loginWithGoogle,
    loginWithLinkedIn,
    logout
  }
}
```

### 2. useAuth Hook (Extended)

```jsx
// hooks/useAuth.js
import { useState, useEffect, useContext, createContext } from 'react'
import apiClient from '../config/api.js'
import { useOAuth } from './useOAuth.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const oauth = useOAuth()
  const [initialized, setInitialized] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Initialize auth token from localStorage
    const token = localStorage.getItem('authToken')
    if (token) {
      apiClient.setAuthToken(token)
      // Optionally fetch user profile
      fetchUserProfile()
    }
    setInitialized(true)
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${apiClient.baseURL}/auth/profile`, {
        headers: apiClient.headers
      })
      const data = await response.json()
      if (data.success) {
        setUser(data.data.user)
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      logout()
    }
  }

  const logout = () => {
    apiClient.clearAuthToken()
    setUser(null)
    oauth.logout()
  }

  const handleOAuthSuccess = async (data) => {
    setUser(data.user)
    return data
  }

  return (
    <AuthContext.Provider
      value={{
        ...oauth,
        user: user || oauth.user,
        logout,
        initialized,
        handleOAuthSuccess
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

## 🎨 CSS Styles

```css
/* styles/OAuthLoginForm.css */

.oauth-login-form {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.oauth-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 24px 0;
  color: #6c757d;
  font-size: 14px;
}

.oauth-divider::before,
.oauth-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e9ecef;
}

.oauth-divider span {
  padding: 0 16px;
}

.oauth-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.oauth-button-wrapper {
  width: 100%;
}

.oauth-button-wrapper > div {
  width: 100% !important;
}

#google-signin-button {
  width: 100% !important;
}

.linkedin-signin-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  background-color: #0077b5;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.linkedin-signin-button:hover {
  background-color: #005885;
}

.linkedin-signin-button:active {
  background-color: #004971;
}

.linkedin-signin-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.google-signin-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  color: #6c757d;
}

.oauth-loading {
  text-align: center;
  margin-top: 16px;
  color: #6c757d;
}

.oauth-error {
  margin-top: 16px;
  padding: 12px;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

/* Mobile responsive */
@media (max-width: 480px) {
  .oauth-login-form {
    padding: 0 16px;
  }

  .linkedin-signin-button {
    font-size: 14px;
    padding: 10px 20px;
  }
}
```

## 🔧 Vanilla JavaScript Example

```javascript
// vanilla-js-example.js
// HTML:
// <div id="google-signin-button"></div>
// <button id="linkedin-signin-button">Sign in with LinkedIn</button>

// Initialize Google Auth
const googleClientId = 'YOUR_GOOGLE_CLIENT_ID'
const googleAuth = new GoogleAuthService(googleClientId)

googleAuth.initialize().then(() => {
  googleAuth.renderButton('google-signin-button', {
    theme: 'outline',
    size: 'large'
  })

  // Listen for sign-in events
  window.addEventListener('googleSignInSuccess', (event) => {
    const { user, token } = event.detail
    console.log('Google Sign-In Success:', user)
    // Handle successful login
    handleAuthSuccess(user, token)
  })

  window.addEventListener('googleSignInError', (event) => {
    console.error('Google Sign-In Error:', event.detail.error)
    // Handle error
    showError(event.detail.error)
  })
})

// Initialize LinkedIn Auth
const linkedInClientId = 'YOUR_LINKEDIN_CLIENT_ID'
const linkedInRedirectUri = 'http://localhost:5173/auth/callback'
const linkedInAuth = new LinkedInAuthService(linkedInClientId, linkedInRedirectUri)

document.getElementById('linkedin-signin-button').addEventListener('click', () => {
  linkedInAuth.login()
})

// Handle LinkedIn callback on page load
linkedInAuth.processCallback().then((result) => {
  if (result) {
    console.log('LinkedIn Sign-In Success:', result.user)
    handleAuthSuccess(result.user, result.token)
  }
}).catch((error) => {
  console.error('LinkedIn Sign-In Error:', error)
  showError(error.message)
})

// Helper functions
function handleAuthSuccess(user, token) {
  // Store token
  localStorage.setItem('authToken', token)
  
  // Redirect or update UI
  window.location.href = '/dashboard'
}

function showError(message) {
  alert('Authentication failed: ' + message)
}
```

## 📱 Complete React Integration Example

```jsx
// App.jsx
import React from 'react'
import { AuthProvider } from './hooks/useAuth.js'
import LoginPage from './pages/LoginPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
```

```jsx
// pages/LoginPage.jsx
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import OAuthLoginForm from '../components/OAuthLoginForm.jsx'

const LoginPage = () => {
  const navigate = useNavigate()
  const { user, initialized, handleOAuthSuccess } = useAuth()

  useEffect(() => {
    if (initialized && user) {
      navigate('/dashboard')
    }
  }, [user, initialized, navigate])

  const handleSuccess = async (data) => {
    await handleOAuthSuccess(data)
    navigate('/dashboard')
  }

  const handleError = (error) => {
    console.error('Login error:', error)
    // Show error message to user
  }

  if (!initialized) {
    return <div>Loading...</div>
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Welcome to Dynamic Forms</h1>
        <OAuthLoginForm
          onSuccess={handleSuccess}
          onError={handleError}
          googleClientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
          linkedInClientId={process.env.REACT_APP_LINKEDIN_CLIENT_ID}
          linkedInRedirectUri={process.env.REACT_APP_LINKEDIN_REDIRECT_URI}
        />
      </div>
    </div>
  )
}

export default LoginPage
```

## 🔐 Environment Variables

```env
# Frontend .env file
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_LINKEDIN_CLIENT_ID=your_linkedin_client_id
REACT_APP_LINKEDIN_REDIRECT_URI=http://localhost:5173/auth/callback
```

## 🚨 Error Handling

```javascript
// utils/oauthErrorHandler.js
export const handleOAuthError = (error) => {
  const errorMessages = {
    'Invalid Google ID token': 'Google authentication failed. Please try again.',
    'Google token audience mismatch': 'Invalid Google configuration.',
    'LinkedIn token exchange failed': 'LinkedIn authentication failed. Please try again.',
    'Email not available from provider': 'Unable to retrieve email from provider.',
    'Missing Google idToken': 'Google authentication token is missing.',
    'Missing LinkedIn code or redirectUri': 'LinkedIn authentication parameters are missing.'
  }

  return errorMessages[error.message] || 'Authentication failed. Please try again.'
}
```

## 📚 Setup Instructions

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Add authorized JavaScript origins: `http://localhost:5173`
7. Add authorized redirect URIs if needed
8. Copy the Client ID to your `.env` file

### LinkedIn OAuth Setup

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. In "Auth" tab, add redirect URL: `http://localhost:5173/auth/callback`
4. Request access to scopes: `openid`, `profile`, `email`
5. Copy Client ID and Client Secret to your `.env` file

## ✅ 활용 가능한 기능

This integration guide provides:
- ✅ Google Sign-In with Identity Services (modern approach)
- ✅ LinkedIn OAuth 2.0 with authorization code flow
- ✅ React components ready to use
- ✅ React hooks for state management
- ✅ Vanilla JavaScript examples
- ✅ Error handling and loading states
- ✅ Responsive design
- ✅ TypeScript-ready (can be easily converted)

## 🎯 Best Practices

1. **Security**: Always verify state parameter for LinkedIn OAuth
2. **User Experience**: Show loading states during authentication
3. **Error Handling**: Provide user-friendly error messages
4. **Token Management**: Store tokens securely (localStorage for SPA, httpOnly cookies for server-side)
5. **Redirect URIs**: Ensure redirect URIs match exactly in OAuth provider settings
6. **Testing**: Test with both successful and failed authentication flows

