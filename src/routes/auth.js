import express from 'express'
import { User } from '../models/User.js'
import { generateToken } from '../utils/jwt.js'
import {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
} from '../middleware/validation.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Register new user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body

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
      return res.status(500).json({
        success: false,
        message: "Échec de la création de l'utilisateur",
      })
    }

    // Generate token
    const token = generateToken(user.id, user.role)

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: user.toJSON(),
        token,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Login user
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body

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

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toJSON(),
      },
    })
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

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

export default router
