import express from 'express'
import crypto from 'crypto'
import { Form } from '../models/Form.js'
import { FormSubmission } from '../models/FormSubmission.js'
import {
  validateFormCreation,
  validateFormUpdate,
  validateFormId,
  validatePagination,
  validateSuccessModal,
} from '../middleware/validation.js'
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js'
import { 
  checkSubscriptionLimits, 
  trackSubscriptionUsage, 
  addSubscriptionContext 
} from '../middleware/subscriptionValidation.js'
import { sendErrorResponse } from '../utils/errorResponse.js'
import logger from '../utils/logger.js'
import { v4 as uuidv4 } from 'uuid'
import { sendAdminNewFormNotification } from '../utils/email.js'

const router = express.Router()

/**
 * @swagger
 * /api/forms:
 *   get:
 *     summary: Obtenir tous les formulaires
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page (utilisé avec limit)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Décalage de pagination (alternative à page)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordre de tri (asc ou desc)
     *     responses:
     *       200:
     *         description: Liste des formulaires récupérée avec succès
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
     *                         forms:
     *                           type: array
     *                           items:
     *                             $ref: '#/components/schemas/Form'
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
// Get all forms (with pagination)
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { limit = 10, page = 1, offset, sortOrder = 'desc' } = req.query

    let forms
    const limitNum = parseInt(limit) || 10
    let offsetNum = parseInt(offset) || 0
    
    // Convert page-based pagination to offset-based if page is provided
    if (page && !offset) {
      offsetNum = (parseInt(page) - 1) * limitNum
    }

    if (req.user.role === 'admin') {
      forms = await Form.findAll(limitNum, offsetNum, sortOrder)
    } else {
      forms = await Form.findByUserId(req.user.id, limitNum, offsetNum, sortOrder)
    }

    // Safely convert forms to JSON
    const formsJSON = []
    for (const form of forms) {
      try {
        formsJSON.push(form.toJSON())
      } catch (formError) {
        console.error('Error converting form to JSON:', formError, 'Form ID:', form.id)
        logger.logError(formError, {
          operation: 'form_to_json',
          formId: form.id,
          formTitle: form.title
        })
        // Skip this form and continue with others
      }
    }

    res.json({
      success: true,
      data: {
        forms: formsJSON,
        pagination: {
          page: parseInt(page) || Math.floor(offsetNum / limitNum) + 1,
          limit: limitNum,
          offset: offsetNum,
          sortOrder: sortOrder
        }
      },
    })
  } catch (error) {
    console.error('Get forms error:', error)
    console.error('Error stack:', error.stack)
    logger.logError(error, {
      operation: 'get_forms',
      method: req.method,
      url: req.url,
      userId: req.user?.id,
      query: req.query
    })
    sendErrorResponse(res, error, req, 'Erreur interne du serveur', 500)
  }
})

/**
 * @swagger
 * /api/forms/{id}:
 *   get:
 *     summary: Obtenir un formulaire par son ID
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
 *         description: ID du formulaire
 *     responses:
 *       200:
 *         description: Formulaire récupéré avec succès
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
 *                         form:
 *                           $ref: '#/components/schemas/Form'
 *       401:
 *         description: Token d'authentification invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès refusé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Formulaire non trouvé
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
    sendErrorResponse(res, error, req, 'Erreur interne du serveur', 500)
  }
})

/**
 * @swagger
 * /api/forms/slug/{slug}:
 *   get:
 *     summary: Obtenir un formulaire par son slug (accès public)
 *     tags: [Forms]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug du formulaire
 *         example: "formulaire-contact-abc123"
 *     security: []
 *     responses:
 *       200:
 *         description: Formulaire récupéré avec succès
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
 *                         form:
 *                           $ref: '#/components/schemas/Form'
 *       401:
 *         description: Authentification requise pour ce formulaire
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Formulaire non trouvé
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

/**
 * @swagger
 * /api/forms:
 *   post:
 *     summary: Créer un nouveau formulaire
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Titre du formulaire
 *                 example: "Formulaire de contact"
 *               description:
 *                 type: string
 *                 description: Description du formulaire
 *                 example: "Formulaire pour nous contacter"
 *               slug:
 *                 type: string
 *                 description: Slug unique du formulaire (généré automatiquement si non fourni)
 *                 example: "formulaire-contact-abc123"
 *               steps:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/FormStep'
 *                 description: Étapes du formulaire
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Statut actif du formulaire
 *               requireAuthentication:
 *                 type: boolean
 *                 default: false
 *                 description: Authentification requise
 *               allowMultipleSubmissions:
 *                 type: boolean
 *                 default: true
 *                 description: Autoriser les soumissions multiples
 *     responses:
 *       201:
 *         description: Formulaire créé avec succès
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
 *                         form:
 *                           $ref: '#/components/schemas/Form'
 *       400:
 *         description: Données de formulaire invalides
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
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Create new form
router.post('/', 
  authenticateToken, 
  addSubscriptionContext,
  checkSubscriptionLimits('create_form'),
  validateFormCreation, 
  trackSubscriptionUsage('create_form'),
  async (req, res) => {
  try {

    // Handle slug availability checking
    let finalSlug
    if (req.body.slug) {
      const isAvailable = await Form.isSlugAvailable(req.body.slug)
      if (isAvailable) {
        // Slug is available, use it as-is
        finalSlug = req.body.slug
      } else {
        // Slug is not available, add random string to user's slug
        finalSlug = req.body.slug + '-' + crypto.randomUUID().substring(0, 8)
      }
    } else {
      // No slug provided, generate one from title
      finalSlug = generateSlug(req.body.title)
    }

    const formData = {
      ...req.body,
      userId: req.user.id,
      slug: finalSlug,
    }

    const form = await Form.create(formData)

    if (!form) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la création du formulaire',
      })
    }

    // Notify admin about new form creation (best-effort)
    try {
      await sendAdminNewFormNotification(form, req.user)
    } catch (e) {
      console.error('Admin new form notification failed:', e)
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
    sendErrorResponse(res, error, req, 'Erreur interne du serveur', 500)
  }
})

/**
 * @swagger
 * /api/forms/{id}:
 *   put:
 *     summary: Mettre à jour un formulaire
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
 *         description: ID du formulaire
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Titre du formulaire
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Description du formulaire
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft]
 *                 description: Statut du formulaire
 *               theme:
 *                 type: string
 *                 maxLength: 50
 *                 description: Thème du formulaire
 *               primaryColor:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 description: Couleur principale (hexadécimal)
 *               notificationEmail:
 *                 type: string
 *                 format: email
 *                 description: Email de notification
 *               emailNotifications:
 *                 type: boolean
 *                 description: Activer les notifications par email
 *     responses:
 *       200:
 *         description: Formulaire mis à jour avec succès
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
 *                         form:
 *                           $ref: '#/components/schemas/Form'
 *       400:
 *         description: Données de validation invalides
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
 *       403:
 *         description: Accès refusé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Formulaire non trouvé
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

/**
 * @swagger
 * /api/forms/{id}/steps:
 *   put:
 *     summary: Mettre à jour les étapes et champs d'un formulaire
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
 *         description: ID du formulaire
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - steps
 *             properties:
 *               steps:
 *                 type: array
 *                 description: Liste des étapes du formulaire
 *                 items:
 *                   $ref: '#/components/schemas/FormStep'
 *     responses:
 *       200:
 *         description: Étapes du formulaire mises à jour avec succès
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
 *                         form:
 *                           $ref: '#/components/schemas/Form'
 *       400:
 *         description: Données de validation invalides
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
 *       403:
 *         description: Accès refusé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Formulaire non trouvé
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

/**
 * @swagger
 * /api/forms/{id}/marketing:
 *   put:
 *     summary: Mettre à jour les paramètres marketing d'un formulaire
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
 *         description: ID du formulaire
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - marketing
 *             properties:
 *               marketing:
 *                 type: object
 *                 description: Paramètres marketing du formulaire
 *                 properties:
 *                   sidebar:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         description: Titre de la sidebar
 *                       description:
 *                         type: string
 *                         description: Description de la sidebar
 *                       logo:
 *                         type: string
 *                         description: URL du logo
 *                       enabled:
 *                         type: boolean
 *                         description: Activer la sidebar
 *                       socialMedia:
 *                         type: object
 *                         properties:
 *                           enabled:
 *                             type: boolean
 *                           title:
 *                             type: string
 *                           buttons:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 platform:
 *                                   type: string
 *                                 url:
 *                                   type: string
 *                                 icon:
 *                                   type: string
 *                                 enabled:
 *                                   type: boolean
 *                                 order:
 *                                   type: integer
 *                       footer:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *     responses:
 *       200:
 *         description: Paramètres marketing mis à jour avec succès
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
 *                         form:
 *                           $ref: '#/components/schemas/Form'
 *       400:
 *         description: Données de validation invalides
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
 *       403:
 *         description: Accès refusé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Formulaire non trouvé
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

/**
 * @swagger
 * /api/forms/{id}:
 *   delete:
 *     summary: Supprimer un formulaire
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
 *         description: ID du formulaire
 *     responses:
 *       200:
 *         description: Formulaire supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Token d'authentification invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès refusé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Formulaire non trouvé
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

/**
 * @swagger
 * /api/forms/{id}/submissions:
 *   get:
 *     summary: Obtenir les soumissions d'un formulaire
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
 *         description: ID du formulaire
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Décalage de pagination
 *     responses:
 *       200:
 *         description: Soumissions récupérées avec succès
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
 *                         submissions:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/FormSubmission'
 *       401:
 *         description: Token d'authentification invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès refusé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Formulaire non trouvé
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

/**
 * @swagger
 * /api/forms/{id}/stats:
 *   get:
 *     summary: Obtenir les statistiques d'un formulaire
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
 *         description: ID du formulaire
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
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
 *                         stats:
 *                           type: object
 *                           description: Statistiques du formulaire
 *                           properties:
 *                             totalSubmissions:
 *                               type: integer
 *                               description: Nombre total de soumissions
 *                             submissionsToday:
 *                               type: integer
 *                               description: Soumissions aujourd'hui
 *                             submissionsThisWeek:
 *                               type: integer
 *                               description: Soumissions cette semaine
 *                             submissionsThisMonth:
 *                               type: integer
 *                               description: Soumissions ce mois
 *                             averageSubmissionsPerDay:
 *                               type: number
 *                               description: Moyenne de soumissions par jour
 *       401:
 *         description: Token d'authentification invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès refusé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Formulaire non trouvé
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

/**
 * @swagger
 * /api/forms/{id}/success-modal:
 *   put:
 *     summary: Mettre à jour le modal de succès d'un formulaire
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
 *         description: ID du formulaire
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - successModal
 *             properties:
 *               successModal:
 *                 type: object
 *                 description: Configuration du modal de succès
 *                 properties:
 *                   title:
 *                     type: string
 *                     description: Titre du modal
 *                     example: "Félicitations !"
 *                   description:
 *                     type: string
 *                     description: Description du modal
 *                     example: "Votre formulaire a été soumis avec succès."
 *                   actions:
 *                     type: array
 *                     description: Actions disponibles dans le modal
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "Voir les résultats"
 *                         url:
 *                           type: string
 *                           example: "https://example.com/results"
 *                   closeEnabled:
 *                     type: boolean
 *                     description: Permettre de fermer le modal
 *                     example: true
 *                   returnHomeEnabled:
 *                     type: boolean
 *                     description: Afficher le bouton retour à l'accueil
 *                     example: true
 *                   resubmitEnabled:
 *                     type: boolean
 *                     description: Permettre de soumettre à nouveau
 *                     example: false
 *     responses:
 *       200:
 *         description: Modal de succès mis à jour avec succès
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
 *                         form:
 *                           $ref: '#/components/schemas/Form'
 *       400:
 *         description: Données de validation invalides
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
 *       403:
 *         description: Accès refusé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Formulaire non trouvé
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
// Update success modal
router.put('/:id/success-modal', authenticateToken, validateFormId, async (req, res) => {
  try {
    const { id } = req.params
    const { successModal } = req.body

    if (!successModal) {
      return res.status(400).json({
        success: false,
        message: 'Les données du modal de succès sont requises',
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

    const success = await form.update({
      successModal: successModal
    })

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la mise à jour du modal de succès',
      })
    }

    // Get updated form
    const updatedForm = await Form.findById(id)

    res.json({
      success: true,
      message: 'Modal de succès mis à jour avec succès',
      data: {
        form: updatedForm.toJSON(),
      },
    })
  } catch (error) {
    console.error('Update success modal error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    })
  }
})

/**
 * @swagger
 * /api/forms/import:
 *   post:
 *     summary: Importer un formulaire complet avec toutes les données
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID du formulaire (optionnel, pour mise à jour)
 *               title:
 *                 type: string
 *                 description: Titre du formulaire
 *                 example: "Formulaire de contact"
 *               description:
 *                 type: string
 *                 description: Description du formulaire
 *               slug:
 *                 type: string
 *                 description: Slug unique du formulaire
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft]
 *                 default: draft
 *               allowMultipleSubmissions:
 *                 type: boolean
 *                 default: true
 *               requireAuthentication:
 *                 type: boolean
 *                 default: false
 *               theme:
 *                 type: string
 *                 default: default
 *               primaryColor:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 default: '#3b82f6'
 *               notificationEmail:
 *                 type: string
 *                 format: email
 *               emailNotifications:
 *                 type: boolean
 *                 default: false
 *               steps:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/FormStep'
 *                 description: Étapes du formulaire
 *               marketing:
 *                 type: object
 *                 description: Paramètres marketing du formulaire
 *                 properties:
 *                   sidebar:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       logo:
 *                         type: string
 *                       enabled:
 *                         type: boolean
 *                       socialMedia:
 *                         type: object
 *                         properties:
 *                           enabled:
 *                             type: boolean
 *                           title:
 *                             type: string
 *                           buttons:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 platform:
 *                                   type: string
 *                                 url:
 *                                   type: string
 *                                 icon:
 *                                   type: string
 *                                 enabled:
 *                                   type: boolean
 *                                 order:
 *                                   type: integer
 *                       footer:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *               successModal:
 *                 type: object
 *                 description: Configuration du modal de succès
 *                 properties:
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   actions:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         url:
 *                           type: string
 *                   closeEnabled:
 *                     type: boolean
 *                   returnHomeEnabled:
 *                     type: boolean
 *                   resubmitEnabled:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Formulaire importé/mis à jour avec succès
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
 *                         form:
 *                           $ref: '#/components/schemas/Form'
 *                         operation:
 *                           type: string
 *                           enum: [created, updated]
 *       400:
 *         description: Données de formulaire invalides
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
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Import form endpoint (create or update)
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const formData = req.body
    const { id } = formData

    // Check if form ID is provided for update and validate ownership
    if (id) {
      const existingForm = await Form.findById(id)
      
      if (existingForm) {
        // Check if user owns the form or is admin
        if (req.user.role !== 'admin' && existingForm.userId !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Accès refusé',
          })
        }
      }
    } else {
      // Check if user can create more forms (only for new forms)
      const canCreateForm = await req.user.canCreateForm()
      
      if (!canCreateForm) {
        const preferences = await req.user.getPreferences()
        return res.status(403).json({
          success: false,
          message: `Limite de formulaires atteinte. Votre plan ${preferences.accountType} permet ${preferences.maxForms} formulaires maximum.`,
          data: {
            limit: preferences.maxForms,
            accountType: preferences.accountType
          }
        })
      }
    }

    // Use the Form.import method
    const result = await Form.import(formData, req.user.id)

    res.json({
      success: true,
      message: `Formulaire ${result.operation === 'created' ? 'créé' : 'mis à jour'} avec succès`,
      data: {
        form: result.form.toJSON(),
        operation: result.operation,
      },
    })
  } catch (error) {
    console.error('Import form error:', error)
    logger.logError(error, {
      operation: 'import_form',
      method: req.method,
      url: req.url,
      userId: req.user?.id,
      formId: req.body?.id
    })
    
    // Handle specific error messages
    if (error.message.includes('requis') || error.message.includes('Échec')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }
    
    sendErrorResponse(res, error, req, 'Erreur interne du serveur', 500)
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
