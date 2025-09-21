import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  validateGenerateForm,
  validateModifyForm,
  validateAnalyzeForm,
  validateGeminiRequest,
  validateHeaders,
  validateAuth,
  validatePermissions,
  handleGeminiErrors,
  validateRateLimit
} from '../middleware/geminiValidation.js'
import geminiService from '../services/geminiService.js'
import { cleanFormData, validateFormStructure, generateDefaultForm } from '../utils/formGenerator.js'

const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     GeminiGenerateRequest:
 *       type: object
 *       required:
 *         - description
 *       properties:
 *         description:
 *           type: string
 *           minLength: 10
 *           maxLength: 2000
 *           description: Description du formulaire souhaité
 *           example: "Je veux créer un formulaire de contact avec nom, email, sujet et message"
 *         options:
 *           type: object
 *           properties:
 *             theme:
 *               type: string
 *               enum: [default, modern, elegant, minimal, dark, colorful]
 *               description: Thème du formulaire
 *               example: "modern"
 *             primaryColor:
 *               type: string
 *               pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
 *               description: Couleur principale du formulaire
 *               example: "#3b82f6"
 *             includeMarketing:
 *               type: boolean
 *               description: Inclure les éléments marketing
 *               example: true
 *             language:
 *               type: string
 *               enum: [fr, en, es, de, it]
 *               description: Langue du formulaire
 *               example: "fr"
 *     GeminiModifyRequest:
 *       type: object
 *       required:
 *         - formId
 *         - instructions
 *       properties:
 *         formId:
 *           type: string
 *           format: uuid
 *           description: ID du formulaire à modifier
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         instructions:
 *           type: string
 *           minLength: 10
 *           maxLength: 1000
 *           description: Instructions de modification
 *           example: "Ajouter un champ pour le numéro de téléphone et changer le thème en sombre"
 *         options:
 *           type: object
 *           properties:
 *             preserveData:
 *               type: boolean
 *               description: Préserver les données existantes
 *               example: true
 *             language:
 *               type: string
 *               enum: [fr, en, es, de, it]
 *               description: Langue des instructions
 *               example: "fr"
 *     GeminiAnalyzeRequest:
 *       type: object
 *       required:
 *         - formId
 *       properties:
 *         formId:
 *           type: string
 *           format: uuid
 *           description: ID du formulaire à analyser
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         analysisType:
 *           type: string
 *           enum: [comprehensive, accessibility, ux, conversion, seo]
 *           description: Type d'analyse
 *           example: "comprehensive"
 *     GeminiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             form:
 *               $ref: '#/components/schemas/Form'
 *             suggestions:
 *               type: array
 *               items:
 *                 type: string
 *               description: Suggestions d'amélioration
 *               example: ["Considérer ajouter un champ téléphone", "Le formulaire pourrait bénéficier d'une validation email renforcée"]
 *             changes:
 *               type: array
 *               items:
 *                 type: string
 *               description: Liste des changements effectués (pour les modifications)
 *               example: ["Ajout du champ téléphone", "Changement du thème en sombre"]
 *             analysis:
 *               type: object
 *               description: Résultats de l'analyse (pour l'analyse)
 *               properties:
 *                 accessibility:
 *                   type: string
 *                   example: "Score: 8/10 - Bonne structure, considérer ajouter des labels ARIA"
 *                 ux:
 *                   type: string
 *                   example: "Score: 7/10 - Interface claire, améliorer la progression visuelle"
 *                 conversion:
 *                   type: string
 *                   example: "Score: 6/10 - Considérer réduire le nombre d'étapes"
 *                 seo:
 *                   type: string
 *                   example: "Score: 9/10 - Excellente structure sémantique"
 *             recommendations:
 *               type: array
 *               items:
 *                 type: string
 *               description: Recommandations générales
 *               example: ["Ajouter des indicateurs de progression", "Implémenter la validation en temps réel"]
 *             suggestedImprovements:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [field, step, validation, design]
 *                   suggestion:
 *                     type: string
 *                   priority:
 *                     type: string
 *                     enum: [high, medium, low]
 *                   impact:
 *                     type: string
 *         message:
 *           type: string
 *           example: "Formulaire généré avec succès"
 *         generatedBy:
 *           type: string
 *           example: "gemini"
 */

/**
 * @swagger
 * /api/gemini/generate:
 *   post:
 *     summary: Générer un formulaire avec Gemini AI
 *     description: Génère un nouveau formulaire basé sur une description textuelle en utilisant l'IA Gemini
 *     tags: [Gemini AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeminiGenerateRequest'
 *     responses:
 *       200:
 *         description: Formulaire généré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GeminiResponse'
 *       400:
 *         description: Erreur de validation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Erreur de validation"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["La description doit contenir au moins 10 caractères"]
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Token d'authentification requis"
 *       429:
 *         description: Trop de requêtes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Trop de requêtes Gemini, veuillez attendre avant de réessayer"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Erreur lors de la génération du formulaire"
 */
router.post('/generate', 
  validateHeaders,
  validateAuth,
  authenticateToken,
  validatePermissions,
  validateRateLimit,
  validateGeminiRequest,
  validateGenerateForm,
  async (req, res) => {
    try {
      const { description, options, formId, sessionId } = req.validatedData
      const userId = req.user.id

      console.log(`🚀 Génération de formulaire demandée par l'utilisateur ${userId}`)
      console.log(`📝 Description: ${description.substring(0, 100)}...`)
      if (formId) {
        console.log(`📋 Formulaire existant: ${formId}`)
      }

      const result = await geminiService.generateForm(description, options, userId, formId, sessionId)

      console.log(`✅ Formulaire ${result.isNewForm ? 'généré' : 'modifié'} avec succès: ${result.form.id}`)

      res.json({
        success: true,
        data: result,
        message: 'Formulaire généré avec succès',
        generatedBy: 'gemini'
      })
    } catch (error) {
      console.error('❌ Erreur lors de la génération du formulaire:', error)
      
      // En cas d'erreur, générer un formulaire par défaut
      try {
        const defaultForm = generateDefaultForm('Formulaire généré automatiquement')
        const { Form } = await import('../models/Form.js')
        const form = await Form.create({
          ...defaultForm,
          userId: req.user.id,
          status: 'draft'
        })

        res.json({
          success: true,
          data: {
            form: form.toJSON(),
            suggestions: ['Formulaire généré avec des paramètres par défaut en raison d\'une erreur technique'],
            generatedBy: 'fallback'
          },
          message: 'Formulaire généré avec des paramètres par défaut',
          warning: 'Erreur lors de la génération avec Gemini, formulaire par défaut utilisé'
        })
      } catch (fallbackError) {
        console.error('❌ Erreur lors de la génération du formulaire de fallback:', fallbackError)
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la génération du formulaire',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur'
        })
      }
    }
  }
)

/**
 * @swagger
 * /api/gemini/modify:
 *   post:
 *     summary: Modifier un formulaire existant avec Gemini AI
 *     description: Modifie un formulaire existant basé sur des instructions textuelles en utilisant l'IA Gemini
 *     tags: [Gemini AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeminiModifyRequest'
 *     responses:
 *       200:
 *         description: Formulaire modifié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GeminiResponse'
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Formulaire non trouvé
 *       429:
 *         description: Trop de requêtes
 *       500:
 *         description: Erreur serveur
 */
router.post('/modify',
  validateHeaders,
  validateAuth,
  authenticateToken,
  validatePermissions,
  validateRateLimit,
  validateGeminiRequest,
  validateModifyForm,
  async (req, res) => {
    try {
      const { formId, instructions, options, sessionId } = req.validatedData
      const userId = req.user.id

      console.log(`🔧 Modification de formulaire demandée par l'utilisateur ${userId}`)
      console.log(`📝 Formulaire ID: ${formId}`)
      console.log(`📝 Instructions: ${instructions.substring(0, 100)}...`)

      // Vérifier que l'utilisateur possède le formulaire
      const { Form } = await import('../models/Form.js')
      const existingForm = await Form.findById(formId)
      
      if (!existingForm) {
        return res.status(404).json({
          success: false,
          message: 'Formulaire non trouvé'
        })
      }

      if (existingForm.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas les permissions pour modifier ce formulaire'
        })
      }

      const result = await geminiService.modifyForm(formId, instructions, options, userId, sessionId)

      console.log(`✅ Formulaire modifié avec succès: ${formId}`)

      res.json({
        success: true,
        data: result,
        message: 'Formulaire modifié avec succès',
        generatedBy: 'gemini'
      })
    } catch (error) {
      console.error('❌ Erreur lors de la modification du formulaire:', error)
      
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la modification du formulaire',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur'
      })
    }
  }
)

/**
 * @swagger
 * /api/gemini/analyze:
 *   post:
 *     summary: Analyser un formulaire avec Gemini AI
 *     description: Analyse un formulaire existant et fournit des suggestions d'amélioration en utilisant l'IA Gemini
 *     tags: [Gemini AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeminiAnalyzeRequest'
 *     responses:
 *       200:
 *         description: Analyse terminée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GeminiResponse'
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Formulaire non trouvé
 *       429:
 *         description: Trop de requêtes
 *       500:
 *         description: Erreur serveur
 */
router.post('/analyze',
  validateHeaders,
  validateAuth,
  authenticateToken,
  validatePermissions,
  validateRateLimit,
  validateGeminiRequest,
  validateAnalyzeForm,
  async (req, res) => {
    try {
      const { formId, analysisType, sessionId } = req.validatedData
      const userId = req.user.id

      console.log(`🔍 Analyse de formulaire demandée par l'utilisateur ${userId}`)
      console.log(`📝 Formulaire ID: ${formId}`)
      console.log(`📝 Type d'analyse: ${analysisType}`)

      // Vérifier que l'utilisateur possède le formulaire
      const { Form } = await import('../models/Form.js')
      const existingForm = await Form.findById(formId)
      
      if (!existingForm) {
        return res.status(404).json({
          success: false,
          message: 'Formulaire non trouvé'
        })
      }

      if (existingForm.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas les permissions pour analyser ce formulaire'
        })
      }

      const result = await geminiService.analyzeForm(formId, analysisType, userId, sessionId)

      console.log(`✅ Analyse terminée avec succès: ${formId}`)

      res.json({
        success: true,
        data: result,
        message: 'Analyse terminée avec succès',
        generatedBy: 'gemini'
      })
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse du formulaire:', error)
      
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'analyse du formulaire',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur'
      })
    }
  }
)

/**
 * @swagger
 * /api/gemini/health:
 *   get:
 *     summary: Vérifier l'état du service Gemini
 *     description: Vérifie si le service Gemini est opérationnel
 *     tags: [Gemini AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service opérationnel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Service Gemini opérationnel"
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *       500:
 *         description: Service indisponible
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Service Gemini indisponible"
 *                 status:
 *                   type: string
 *                   example: "unhealthy"
 */
router.get('/health',
  async (req, res) => {
    try {
      // Test simple de connexion à Gemini
      const testPrompt = "Réponds simplement 'OK'"
      const result = await geminiService.model.generateContent(testPrompt)
      const response = await result.response
      const text = response.text()

      res.json({
        success: true,
        message: 'Service Gemini opérationnel',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        response: text.trim()
      })
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du service Gemini:', error)
      
      res.status(500).json({
        success: false,
        message: 'Service Gemini indisponible',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: process.env.NODE_ENV === 'development' ? error.message : 'Service indisponible'
      })
    }
  }
)

// Middleware de gestion des erreurs spécifique à Gemini
router.use(handleGeminiErrors)

export default router
