import express from 'express'
import { User } from '../models/User.js'
import { generateToken } from '../utils/jwt.js'
import {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
} from '../middleware/validation.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { sendErrorResponse } from '../utils/errorResponse.js'
import captchaService from '../services/captchaService.js'
import logger from '../utils/logger.js'
import { 
  sendEmailVerificationEmail, 
  sendPasswordResetEmail, 
  sendAdminNewUserNotification,
  sendWelcomeEmail
} from '../utils/email.js'
import { loginWithGoogleIdToken, loginWithLinkedInCode } from '../services/oauthService.js'
import { UserPreferences } from '../models/UserPreferences.js'
import { Subscription } from '../models/Subscription.js'

const router = express.Router()

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Enregistrer un nouvel utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nom de l'utilisateur
 *                 example: "Jean Dupont"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Adresse email de l'utilisateur
 *                 example: "jean.dupont@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Mot de passe de l'utilisateur
 *                 example: "motdepasse123"
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 default: user
 *                 description: Rôle de l'utilisateur
 *               captchaToken:
 *                 type: string
 *                 description: Token reCAPTCHA v2 (requis si CAPTCHA activé)
 *                 example: "03AGdBq25..."
 *     security: []
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         token:
 *                           type: string
 *                           description: Token JWT d'authentification
 *       400:
 *         description: Données de validation invalides ou CAPTCHA échoué
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Register new user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { name, email, password, role = 'user', captchaToken } = req.body

    // Validate CAPTCHA if enabled
    if (captchaService.isEnabled()) {
      const captchaResult = await captchaService.validateToken(captchaToken, req.ip)
      if (!captchaResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation CAPTCHA échouée',
          errors: captchaResult.errors || ['Token CAPTCHA invalide'],
        })
      }
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà',
      })
    }

    // Create new user
    const user = await User.create({ name, email, password, role })

    if (!user) {
      logger.logAuth('register', null, false, { email, reason: 'User creation failed' })
      return res.status(500).json({
        success: false,
        message: "Échec de la création de l'utilisateur",
      })
    }

    // Generate token
    const token = generateToken(user.id, user.role)

    // Send email verification email
    const emailSent = await sendEmailVerificationEmail(user, user.emailVerificationToken, user.emailVerificationCode)
    
    if (!emailSent) {
      logger.logError(new Error('Failed to send verification email'), { 
        action: 'user_registration', 
        userId: user.id, 
        email 
      })
    }

    // Send admin notification for new user registration
    const adminNotificationSent = await sendAdminNewUserNotification(user)
    
    if (!adminNotificationSent) {
      logger.logError(new Error('Failed to send admin notification for new user'), { 
        action: 'user_registration', 
        userId: user.id, 
        email 
      })
    }

    logger.logAuth('register', user.id, true, { email, role })

    res.status(201).json({
      success: true,
      message: 'Veuillez vérifier votre email pour activer votre compte.',
      data: {
        user: user.toJSON(),
        token,
      },
    })
  } catch (error) {
    logger.logError(error, { action: 'user_registration', email: req.body.email })
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connecter un utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Adresse email de l'utilisateur
 *                 example: "jean.dupont@example.com"
 *               password:
 *                 type: string
 *                 description: Mot de passe de l'utilisateur
 *                 example: "motdepasse123"
 *               captchaToken:
 *                 type: string
 *                 description: Token reCAPTCHA v2 (requis si CAPTCHA activé)
 *                 example: "03AGdBq25..."
 *     security: []
 *     responses:
 *       200:
 *         description: Connexion réussie
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         token:
 *                           type: string
 *                           description: Token JWT d'authentification
 *       400:
 *         description: Données de validation invalides ou CAPTCHA échoué
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Identifiants invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Login user
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body

    // Validate CAPTCHA if enabled
    if (captchaService.isEnabled()) {
      const captchaResult = await captchaService.validateToken(captchaToken, req.ip)
      if (!captchaResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation CAPTCHA échouée',
          errors: captchaResult.errors || ['Token CAPTCHA invalide'],
        })
      }
    }

    // Find user by email
    const user = await User.findByEmail(email)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe invalide',
      })
    }

    // Verify password
    const isValidPassword = await user.verifyPassword(password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe invalide',
      })
    }

    // Generate token
    const token = generateToken(user.id, user.role)

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: user.toJSON(),
        token,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

/**
 * @swagger
 * /api/auth/oauth/google:
 *   post:
 *     summary: Login/Register with Google ID token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from Google Sign-In
 *     security: []
 *     responses:
 *       200:
 *         description: Login successful
 *       500:
 *         description: Server error
 */
router.post('/oauth/google', async (req, res) => {
  try {
    const { idToken } = req.body
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'idToken requis' })
    }
    const user = await loginWithGoogleIdToken(idToken)
    const token = generateToken(user.id, user.role)
    res.json({ success: true, data: { user: user.toJSON(), token } })
  } catch (error) {
    logger.logError(error, { action: 'oauth_google' })
    res.status(401).json({ success: false, message: 'Authentification Google échouée' })
  }
})

/**
 * @swagger
 * /api/auth/oauth/linkedin:
 *   post:
 *     summary: Login/Register with LinkedIn authorization code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - redirectUri
 *             properties:
 *               code:
 *                 type: string
 *                 description: LinkedIn authorization code
 *               redirectUri:
 *                 type: string
 *                 description: Redirect URI used in LinkedIn app config
 *     security: []
 *     responses:
 *       200:
 *         description: Login successful
 *       500:
 *         description: Server error
 */
router.post('/oauth/linkedin', async (req, res) => {
  try {
    const { code, redirectUri } = req.body
    if (!code || !redirectUri) {
      return res.status(400).json({ success: false, message: 'code et redirectUri requis' })
    }
    const user = await loginWithLinkedInCode(code, redirectUri)
    const token = generateToken(user.id, user.role)
    res.json({ success: true, data: { user: user.toJSON(), token } })
  } catch (error) {
    logger.logError(error, { action: 'oauth_linkedin' })
    res.status(401).json({ success: false, message: 'Authentification LinkedIn échouée' })
  }
})

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obtenir le profil de l'utilisateur connecté
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         preferences:
 *                           type: object
 *                           description: User preferences including account type and limits
 *                         subscription:
 *                           type: object
 *                           description: Active subscription details
 *                         accountType:
 *                           type: object
 *                           description: Account type details with features and pricing
 *       401:
 *         description: Token d'authentification invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Get user preferences (without auto-creating if they don't exist)
    const preferences = await UserPreferences.findByUserId(userId)

    // Get active subscription
    const subscription = await Subscription.findActiveByUserId(userId)

    // Get account type details if subscription exists
    let accountType = null
    if (subscription) {
      accountType = await subscription.getAccountType()
    }

    const responseData = {
      user: req.user.toJSON(),
      preferences: preferences ? preferences.toJSON() : null,
      subscription: subscription ? subscription.toJSON() : null,
      accountType: accountType ? accountType.toJSON() : null,
    }

    res.json({
      success: true,
      data: responseData,
    })
  } catch (error) {
    logger.logError(error, { action: 'get_profile', userId: req.user?.id })
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Mettre à jour le profil utilisateur
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nouveau nom de l'utilisateur
 *                 example: "Jean Dupont"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Nouvel email de l'utilisateur
 *                 example: "jean.dupont@example.com"
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       400:
 *         description: Données de mise à jour invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token d'authentification invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email déjà utilisé par un autre utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Update user profile
router.put('/profile', authenticateToken, validateUserUpdate, async (req, res) => {
  try {
    const { name, email } = req.body
    const updates = {}

    if (name) updates.name = name
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findByEmail(email)
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(409).json({
          success: false,
          message: 'Cet email est déjà utilisé par un autre utilisateur',
        })
      }
      updates.email = email
    }

    const success = await req.user.update(updates)

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la mise à jour du profil',
      })
    }

    // Get updated user
    const updatedUser = await User.findById(req.user.id)

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        user: updatedUser.toJSON(),
      },
    })
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe actuel et le nouveau mot de passe sont requis',
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères',
      })
    }

    // Verify current password
    const isValidPassword = await req.user.verifyPassword(currentPassword)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Le mot de passe actuel est incorrect',
      })
    }

    // Update password
    const success = await req.user.updatePassword(newPassword)

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la mise à jour du mot de passe',
      })
    }

    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès',
    })
  } catch (error) {
    console.error('Password change error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0
    const users = await User.findAll(limitNum, offsetNum)
    const total = await User.count()

    res.json({
      success: true,
      data: {
        users: users.map((user) => user.toJSON()),
        pagination: {
          total,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < total,
        },
      },
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer votre propre compte',
      })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    const success = await user.delete()

    if (!success) {
      return res.status(500).json({
        success: false,
        message: "Échec de la suppression de l'utilisateur",
      })
    }

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
    })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify user email address
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Email verification token
 *                 example: "abc123def456..."
 *     security: []
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Verify email address
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de vérification requis',
      })
    }

    // Find user by verification token
    const user = await User.findByEmailVerificationToken(token)
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de vérification invalide ou expiré',
      })
    }

    // Check if email is already verified
    if (user.isEmailVerified()) {
      return res.status(400).json({
        success: false,
        message: 'Cette adresse email est déjà vérifiée',
      })
    }

    // Verify email and clear token
    const verifySuccess = await user.verifyEmail()
    const clearTokenSuccess = await user.clearEmailVerificationToken()

    if (!verifySuccess || !clearTokenSuccess) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la vérification de l\'email',
      })
    }

    // Send welcome email after successful verification
    try {
      await sendWelcomeEmail(user)
    } catch (e) {
      logger.logError(new Error('Failed to send welcome email'), { 
        action: 'email_verified', 
        userId: user.id 
      })
    }

    logger.logAuth('email_verified', user.id, true, { email: user.email })

    res.json({
      success: true,
      message: 'Email vérifié avec succès',
    })
  } catch (error) {
    logger.logError(error, { action: 'email_verification', token: req.body.token })
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend email verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to resend verification to
 *                 example: "user@example.com"
 *     security: []
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Email already verified or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Resend email verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Adresse email requise',
      })
    }

    // Find user by email
    const user = await User.findByEmail(email)
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Aucun utilisateur trouvé avec cette adresse email',
      })
    }

    // Check if email is already verified
    if (user.isEmailVerified()) {
      return res.status(400).json({
        success: false,
        message: 'Cette adresse email est déjà vérifiée',
      })
    }

    // Generate new verification token and code
    const verificationToken = user.generateEmailVerificationToken()
    const verificationCode = user.generateEmailVerificationCode()
    await user.setEmailVerificationToken(verificationToken)
    await user.setEmailVerificationCode(verificationCode)

    // Send verification email
    const emailSent = await sendEmailVerificationEmail(user, verificationToken, verificationCode)
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Échec de l\'envoi de l\'email de vérification',
      })
    }

    logger.logAuth('verification_resent', user.id, true, { email })

    res.json({
      success: true,
      message: 'Email de vérification renvoyé avec succès',
    })
  } catch (error) {
    logger.logError(error, { action: 'resend_verification', email: req.body.email })
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to send password reset to
 *                 example: "user@example.com"
 *     security: []
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid email address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Adresse email requise',
      })
    }

    // Find user by email
    const user = await User.findByEmail(email)
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'Si cette adresse email existe dans notre système, vous recevrez un email de réinitialisation',
      })
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken()
    await user.setPasswordResetToken(resetToken)

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(user, resetToken)
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Échec de l\'envoi de l\'email de réinitialisation',
      })
    }

    logger.logAuth('password_reset_requested', user.id, true, { email })

    res.json({
      success: true,
      message: 'Si cette adresse email existe dans notre système, vous recevrez un email de réinitialisation',
    })
  } catch (error) {
    logger.logError(error, { action: 'forgot_password', email: req.body.email })
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *                 example: "abc123def456..."
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: New password
 *                 example: "newpassword123"
 *     security: []
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid token or password requirements not met
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token et nouveau mot de passe requis',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères',
      })
    }

    // Find user by reset token
    const user = await User.findByPasswordResetToken(token)
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de réinitialisation invalide ou expiré',
      })
    }

    // Update password and clear reset token
    const updateSuccess = await user.updatePassword(password)
    const clearTokenSuccess = await user.clearPasswordResetToken()

    if (!updateSuccess || !clearTokenSuccess) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la réinitialisation du mot de passe',
      })
    }

    logger.logAuth('password_reset', user.id, true, { email: user.email })

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
    })
  } catch (error) {
    logger.logError(error, { action: 'password_reset', token: req.body.token })
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

/**
 * @swagger
 * /api/auth/verify-email-code:
 *   post:
 *     summary: Verify user email address with code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailVerificationCodeRequest'
 *     security: []
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid or expired verification code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Verify email address with code
router.post('/verify-email-code', async (req, res) => {
  try {
    const { code } = req.body

    if (!code || code.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Code de vérification invalide (6 chiffres requis)',
      })
    }

    // Find user by verification code
    const user = await User.findByEmailVerificationCode(code)
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Code de vérification invalide ou expiré',
      })
    }

    // Verify email and clear verification code
    const verifySuccess = await user.verifyEmail()
    const clearCodeSuccess = await user.clearEmailVerificationCode()

    if (!verifySuccess || !clearCodeSuccess) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la vérification de l\'email',
      })
    }

    // Send welcome email after successful verification
    try {
      await sendWelcomeEmail(user)
    } catch (e) {
      logger.logError(new Error('Failed to send welcome email'), { 
        action: 'email_verified_code', 
        userId: user.id 
      })
    }

    logger.logAuth('email_verified_code', user.id, true, { email: user.email })

    res.json({
      success: true,
      message: 'Email vérifié avec succès',
    })
  } catch (error) {
    logger.logError(error, { action: 'email_verification_code', code: req.body.code })
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

export default router
