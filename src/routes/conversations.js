import express from 'express'
import { Conversation, ConversationSession } from '../models/Conversation.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { validatePagination, validateConversationsQuery } from '../middleware/validation.js'

const router = express.Router()

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Obtenir les conversations d'un formulaire spécifique pour l'utilisateur
 *     description: Récupère toutes les conversations liées à un formulaire donné pour l'utilisateur authentifié
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du formulaire pour lequel récupérer les conversations
 *         example: "123e4567-e89b-12d3-a456-426614174000"
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
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [generate, modify, analyze]
 *         description: Filtrer par type de conversation
 *     responses:
 *       200:
 *         description: Conversations récupérées avec succès
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
 *                         conversations:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Conversation'
 *                         formId:
 *                           type: string
 *                           format: uuid
 *                           description: ID du formulaire filtré
 *       400:
 *         description: formId manquant ou invalide
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
 *         description: Accès refusé au formulaire
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
// Obtenir les conversations d'un formulaire spécifique pour l'utilisateur
router.get('/', validateConversationsQuery, authenticateToken, async (req, res) => {
  try {
    const { formId, limit = 50, offset = 0, type } = req.query
    const userId = req.user.id

    // formId est maintenant validé par le middleware validateConversationsQuery

    // Vérifier que l'utilisateur a accès au formulaire
    const { Form } = await import('../models/Form.js')
    const form = await Form.findById(formId)
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Formulaire non trouvé'
      })
    }

    if (form.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas accès à ce formulaire'
      })
    }

    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0

    // Récupérer les conversations liées au formulaire et à l'utilisateur
    let conversations
    if (type) {
      // Filtrer par type, formulaire ET utilisateur
      conversations = await Conversation.findByTypeFormIdAndUserId(formId, userId, type, limitNum, offsetNum)
    } else {
      // Récupérer toutes les conversations du formulaire pour cet utilisateur
      conversations = await Conversation.findByFormIdAndUserId(formId, userId, limitNum, offsetNum)
    }

    res.json({
      success: true,
      data: {
        conversations: conversations.map(conv => conv.toJSON()),
        formId: formId,
        total: conversations.length
      }
    })
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    })
  }
})

/**
 * @swagger
 * /api/conversations/sessions:
 *   get:
 *     summary: Obtenir toutes les sessions de conversation de l'utilisateur
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Sessions récupérées avec succès
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
 *                         sessions:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/ConversationSession'
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
// Obtenir toutes les sessions de conversation
router.get('/sessions', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query
    const userId = req.user.id
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0

    const sessions = await ConversationSession.findByUserId(userId, limitNum, offsetNum)

    res.json({
      success: true,
      data: {
        sessions: sessions.map(session => session.toJSON())
      }
    })
  } catch (error) {
    console.error('Get conversation sessions error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    })
  }
})

/**
 * @swagger
 * /api/conversations/sessions/{sessionId}:
 *   get:
 *     summary: Obtenir les conversations d'une session spécifique
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la session
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
 *         description: Conversations de la session récupérées avec succès
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
 *                         conversations:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: Token d'authentification invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session non trouvée
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
// Obtenir les conversations d'une session spécifique
router.get('/sessions/:sessionId', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { sessionId } = req.params
    const { limit = 50, offset = 0 } = req.query
    const userId = req.user.id
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0

    // Vérifier que la session appartient à l'utilisateur
    const session = await ConversationSession.findById(sessionId)
    if (!session || session.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée'
      })
    }

    const conversations = await Conversation.findBySessionId(sessionId, limitNum, offsetNum)

    res.json({
      success: true,
      data: {
        session: session.toJSON(),
        conversations: conversations.map(conv => conv.toJSON())
      }
    })
  } catch (error) {
    console.error('Get session conversations error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    })
  }
})

/**
 * @swagger
 * /api/conversations/stats:
 *   get:
 *     summary: Obtenir les statistiques des conversations de l'utilisateur
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
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
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               conversation_type:
 *                                 type: string
 *                                 enum: [generate, modify, analyze, chat]
 *                               total_conversations:
 *                                 type: integer
 *                               total_tokens:
 *                                 type: integer
 *                               avg_processing_time:
 *                                 type: number
 *                               last_conversation:
 *                                 type: string
 *                                 format: date-time
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
// Obtenir les statistiques des conversations
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const stats = await Conversation.getStatsByUserId(userId)

    res.json({
      success: true,
      data: {
        stats
      }
    })
  } catch (error) {
    console.error('Get conversation stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    })
  }
})

/**
 * @swagger
 * /api/conversations/{id}:
 *   delete:
 *     summary: Supprimer une conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la conversation
 *     responses:
 *       200:
 *         description: Conversation supprimée avec succès
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
 *       404:
 *         description: Conversation non trouvée
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
// Supprimer une conversation
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Vérifier que la conversation appartient à l'utilisateur
    const conversation = await Conversation.findById(id)
    if (!conversation || conversation.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée'
      })
    }

    const deleted = await Conversation.deleteById(id)
    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression'
      })
    }

    res.json({
      success: true,
      message: 'Conversation supprimée avec succès'
    })
  } catch (error) {
    console.error('Delete conversation error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    })
  }
})

export default router
