import express from 'express'
import { Form } from '../models/Form.js'
import { FormSubmission } from '../models/FormSubmission.js'
import {
  validateFormCreation,
  validateFormUpdate,
  validateFormId,
  validatePagination,
} from '../middleware/validation.js'
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// Get all forms (with pagination)
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query

    let forms
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0

    if (req.user.role === 'admin') {
      forms = await Form.findAll(limitNum, offsetNum)
    } else {
      forms = await Form.findByUserId(req.user.id, limitNum, offsetNum)
    }

    res.json({
      success: true,
      data: {
        forms: forms.map((form) => form.toJSON()),
      },
    })
  } catch (error) {
    console.error('Get forms error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Get form by ID
router.get('/:id', authenticateToken, validateFormId, async (req, res) => {
  try {
    const { id } = req.params
    const form = await Form.findById(id)

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Formulaire non trouvé',
      })
    }

    // Check if user owns the form or is admin
    if (req.user.role !== 'admin' && form.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      })
    }

    res.json({
      success: true,
      data: {
        form: form.toJSON(),
      },
    })
  } catch (error) {
    console.error('Get form error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Get form by slug (public access)
router.get('/slug/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params
    const form = await Form.findBySlug(slug)

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Formulaire non trouvé',
      })
    }

    // Check if form requires authentication
    if (form.requireAuthentication && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise pour accéder à ce formulaire',
      })
    }

    res.json({
      success: true,
      data: {
        form: form.toJSON(),
      },
    })
  } catch (error) {
    console.error('Get form by slug error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Create new form
router.post('/', authenticateToken, validateFormCreation, async (req, res) => {
  try {
    const formData = {
      ...req.body,
      userId: req.user.id,
      slug: req.body.slug || generateSlug(req.body.title),
    }

    const form = await Form.create(formData)

    if (!form) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la création du formulaire',
      })
    }

    res.status(201).json({
      success: true,
      message: 'Formulaire créé avec succès',
      data: {
        form: form.toJSON(),
      },
    })
  } catch (error) {
    console.error('Create form error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Update form
router.put('/:id', authenticateToken, validateFormId, validateFormUpdate, async (req, res) => {
  try {
    const { id } = req.params
    const form = await Form.findById(id)

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Formulaire non trouvé',
      })
    }

    // Check if user owns the form or is admin
    if (req.user.role !== 'admin' && form.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      })
    }

    const success = await form.update(req.body)

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la mise à jour du formulaire',
      })
    }

    // Get updated form
    const updatedForm = await Form.findById(id)

    res.json({
      success: true,
      message: 'Formulaire mis à jour avec succès',
      data: {
        form: updatedForm.toJSON(),
      },
    })
  } catch (error) {
    console.error('Update form error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Update form steps and fields
router.put('/:id/steps', authenticateToken, validateFormId, async (req, res) => {
  try {
    const { id } = req.params
    const { steps } = req.body

    if (!steps || !Array.isArray(steps)) {
      return res.status(400).json({
        success: false,
        message: 'Le tableau des étapes est requis',
      })
    }

    const form = await Form.findById(id)

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Formulaire non trouvé',
      })
    }

    // Check if user owns the form or is admin
    if (req.user.role !== 'admin' && form.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      })
    }

    const success = await form.updateSteps(steps)

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la mise à jour des étapes du formulaire',
      })
    }

    // Get updated form
    const updatedForm = await Form.findById(id)

    res.json({
      success: true,
      message: 'Étapes du formulaire mises à jour avec succès',
      data: {
        form: updatedForm.toJSON(),
      },
    })
  } catch (error) {
    console.error('Update form steps error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Update form marketing settings
router.put('/:id/marketing', authenticateToken, validateFormId, async (req, res) => {
  try {
    const { id } = req.params
    const { marketing } = req.body

    if (!marketing) {
      return res.status(400).json({
        success: false,
        message: 'Les paramètres marketing sont requis',
      })
    }

    const form = await Form.findById(id)

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Formulaire non trouvé',
      })
    }

    // Check if user owns the form or is admin
    if (req.user.role !== 'admin' && form.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      })
    }

    const success = await Form.saveMarketingSettings(id, marketing)

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la mise à jour des paramètres marketing',
      })
    }

    // Get updated form
    const updatedForm = await Form.findById(id)

    res.json({
      success: true,
      message: 'Paramètres marketing mis à jour avec succès',
      data: {
        form: updatedForm.toJSON(),
      },
    })
  } catch (error) {
    console.error('Update form marketing error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Delete form
router.delete('/:id', authenticateToken, validateFormId, async (req, res) => {
  try {
    const { id } = req.params
    const form = await Form.findById(id)

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Formulaire non trouvé',
      })
    }

    // Check if user owns the form or is admin
    if (req.user.role !== 'admin' && form.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      })
    }

    const success = await form.delete()

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la suppression du formulaire',
      })
    }

    res.json({
      success: true,
      message: 'Formulaire supprimé avec succès',
    })
  } catch (error) {
    console.error('Delete form error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Get form submissions
router.get(
  '/:id/submissions',
  authenticateToken,
  validateFormId,
  validatePagination,
  async (req, res) => {
    try {
      const { id } = req.params
      const { limit = 50, offset = 0 } = req.query

      const form = await Form.findById(id)

      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Formulaire non trouvé',
        })
      }

      // Check if user owns the form or is admin
      if (req.user.role !== 'admin' && form.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé',
        })
      }

      const limitNum = parseInt(limit) || 50
      const offsetNum = parseInt(offset) || 0
      const submissions = await FormSubmission.findByFormId(id, limitNum, offsetNum)

      res.json({
        success: true,
        data: {
          submissions: submissions.map((submission) => submission.toJSON()),
        },
      })
    } catch (error) {
      console.error('Get form submissions error:', error)
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
      })
    }
  },
)

// Get form statistics
router.get('/:id/stats', authenticateToken, validateFormId, async (req, res) => {
  try {
    const { id } = req.params

    const form = await Form.findById(id)

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Formulaire non trouvé',
      })
    }

    // Check if user owns the form or is admin
    if (req.user.role !== 'admin' && form.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      })
    }

    const stats = await FormSubmission.getStats(id)

    res.json({
      success: true,
      data: {
        stats,
      },
    })
  } catch (error) {
    console.error('Get form stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

// Helper function to generate slug
function generateSlug(title) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-') +
    '-' +
    uuidv4().substring(0, 8)
  )
}

export default router
