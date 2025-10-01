# Frontend Integration Guide - Email Verification & Forgot Password

This guide provides comprehensive instructions for integrating the new email verification and forgot password functionality into your frontend application.

## Table of Contents
1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Frontend Implementation](#frontend-implementation)
4. [User Flow Examples](#user-flow-examples)
5. [Error Handling](#error-handling)
6. [Security Considerations](#security-considerations)
7. [Testing](#testing)

## Overview

The authentication system now includes:
- **Email Verification**: Required for new user accounts
- **Forgot Password**: Secure password reset functionality
- **Resend Verification**: Ability to resend verification emails

### Key Features
- Secure token-based verification and password reset
- 1-hour expiration for password reset tokens
- Professional email templates
- Comprehensive error handling
- Security-conscious responses

## API Endpoints

### 1. Email Verification

#### Verify Email Address
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "abc123def456..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Email vérifié avec succès"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Token de vérification invalide ou expiré"
}
```

#### Resend Verification Email
```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Email de vérification renvoyé avec succès"
}
```

### 2. Forgot Password

#### Request Password Reset
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Si cette adresse email existe dans notre système, vous recevrez un email de réinitialisation"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123def456...",
  "password": "newpassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès"
}
```

## Frontend Implementation

### 1. Email Verification Flow

#### Registration Success Handler
```javascript
// After successful registration
const handleRegistrationSuccess = (response) => {
  if (response.success) {
    // Show verification message
    showMessage(
      'success',
      'Compte créé avec succès! Veuillez vérifier votre email pour activer votre compte.'
    );
    
    // Redirect to verification page or show verification modal
    navigate('/verify-email', { 
      state: { email: userData.email } 
    });
  }
};
```

#### Email Verification Page Component
```jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    }
  }, [searchParams]);

  const verifyEmail = async (token) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Email vérifié avec succès! Vous pouvez maintenant vous connecter.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Erreur lors de la vérification de l\'email');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    const email = searchParams.get('email') || prompt('Entrez votre email:');
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('Email de vérification renvoyé avec succès');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Erreur lors du renvoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-container">
      <h2>Vérification de l'Email</h2>
      
      {loading && <div className="loading">Vérification en cours...</div>}
      
      {message && (
        <div className="success-message">
          {message}
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={resendVerification} disabled={loading}>
            Renvoyer l'email de vérification
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailVerificationPage;
```

### 2. Forgot Password Flow

#### Forgot Password Page Component
```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setEmail('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Erreur lors de l\'envoi de la demande de réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Mot de Passe Oublié</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Adresse Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Entrez votre adresse email"
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
        </button>
      </form>

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="links">
        <button onClick={() => navigate('/login')}>
          Retour à la connexion
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
```

#### Reset Password Page Component
```jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      navigate('/forgot-password');
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const token = searchParams.get('token');
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Mot de passe réinitialisé avec succès! Redirection vers la connexion...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <h2>Réinitialiser le Mot de Passe</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="password">Nouveau Mot de Passe</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Entrez votre nouveau mot de passe"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmer le Mot de Passe</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Confirmez votre nouveau mot de passe"
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
        </button>
      </form>

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="links">
        <button onClick={() => navigate('/login')}>
          Retour à la connexion
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
```

### 3. Updated Login Component

```jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Check if email is verified
        if (!data.data.user.emailVerifiedAt) {
          navigate('/verify-email', { 
            state: { email: data.data.user.email } 
          });
          return;
        }
        
        navigate('/dashboard');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Connexion</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Mot de Passe</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="links">
        <Link to="/forgot-password">
          Mot de passe oublié?
        </Link>
        <Link to="/register">
          Créer un compte
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
```

## User Flow Examples

### 1. New User Registration Flow
```
User Registration → Email Verification Email Sent → User Clicks Link → 
Email Verified → User Can Login → Dashboard
```

### 2. Forgot Password Flow
```
User Forgets Password → Requests Reset → Reset Email Sent → 
User Clicks Link → Enters New Password → Password Reset → Login
```

### 3. Unverified User Login Flow
```
User Logs In → System Checks Email Verification → 
If Not Verified → Redirect to Verification Page → 
User Verifies → Can Access Dashboard
```

## Error Handling

### Common Error Scenarios

1. **Invalid Verification Token**
   - Show error message
   - Provide option to resend verification email

2. **Expired Password Reset Token**
   - Show error message
   - Redirect to forgot password page

3. **Email Already Verified**
   - Show success message
   - Redirect to login

4. **Network Errors**
   - Show generic error message
   - Provide retry option

### Error Handling Utility

```javascript
const handleApiError = (error, response) => {
  if (!response.ok) {
    switch (response.status) {
      case 400:
        return 'Données invalides';
      case 401:
        return 'Non autorisé';
      case 404:
        return 'Ressource non trouvée';
      case 500:
        return 'Erreur serveur';
      default:
        return 'Une erreur est survenue';
    }
  }
  return null;
};
```

## Security Considerations

### Frontend Security Best Practices

1. **Token Handling**
   - Never store sensitive tokens in localStorage
   - Use secure HTTP-only cookies when possible
   - Clear tokens on logout

2. **Input Validation**
   - Validate email format client-side
   - Enforce password requirements
   - Sanitize user inputs

3. **Error Messages**
   - Don't reveal sensitive information
   - Use generic error messages for security

4. **HTTPS**
   - Always use HTTPS in production
   - Validate SSL certificates

## Testing

### Test Cases

1. **Email Verification**
   - Valid token verification
   - Invalid token handling
   - Expired token handling
   - Already verified email

2. **Forgot Password**
   - Valid email request
   - Invalid email handling
   - Valid token reset
   - Expired token reset

3. **Integration Tests**
   - Complete registration flow
   - Complete forgot password flow
   - Error scenarios

### Testing Utilities

```javascript
// Mock API responses for testing
const mockApiResponse = (success, data, message) => ({
  success,
  data,
  message,
});

// Test helper for async operations
const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));
```

## Environment Variables

Make sure these environment variables are set:

```env
# Frontend URL for email links
FRONTEND_URL=http://localhost:3000

# SMTP Configuration
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

## Deployment Checklist

- [ ] Update frontend routes for new pages
- [ ] Test email verification flow
- [ ] Test forgot password flow
- [ ] Verify email templates render correctly
- [ ] Test error handling scenarios
- [ ] Update user documentation
- [ ] Configure SMTP settings
- [ ] Test in production environment

## Support

For technical support or questions about this integration:
- Check the API documentation
- Review error logs
- Test with different email providers
- Verify SMTP configuration

---

*This guide covers the complete integration of email verification and forgot password functionality. Follow the examples and best practices to ensure a secure and user-friendly implementation.*
