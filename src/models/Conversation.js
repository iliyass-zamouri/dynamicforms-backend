import { executeQuery } from '../database/connection.js'
import { v4 as uuidv4 } from 'uuid'

export class Conversation {
  constructor(data) {
    this.id = data.id
    this.userId = data.user_id
    this.sessionId = data.session_id
    this.conversationType = data.conversation_type
    this.formId = data.form_id
    this.userMessage = data.user_message
    this.geminiResponse = data.gemini_response
    this.promptUsed = data.prompt_used
    this.responseMetadata = data.response_metadata ? 
      (typeof data.response_metadata === 'string' && data.response_metadata !== '[object Object]' ? 
        JSON.parse(data.response_metadata) : 
        (typeof data.response_metadata === 'object' ? data.response_metadata : null)) : null
    this.tokensUsed = data.tokens_used
    this.processingTimeMs = data.processing_time_ms
    this.createdAt = data.created_at
    this.updatedAt = data.updated_at
  }

  // Créer une nouvelle conversation
  static async create(conversationData) {
    const {
      userId,
      sessionId,
      conversationType,
      formId = null,
      userMessage,
      geminiResponse,
      promptUsed,
      responseMetadata = null,
      tokensUsed = 0,
      processingTimeMs = 0
    } = conversationData

    const conversationId = uuidv4()

    const sql = `
      INSERT INTO gemini_conversations (
        id, user_id, session_id, conversation_type, form_id, 
        user_message, gemini_response, prompt_used, response_metadata,
        tokens_used, processing_time_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const result = await executeQuery(sql, [
      conversationId,
      userId,
      sessionId,
      conversationType,
      formId,
      userMessage,
      geminiResponse,
      promptUsed,
      responseMetadata ? JSON.stringify(responseMetadata) : null,
      tokensUsed,
      processingTimeMs
    ])

    if (result.success) {
      return await Conversation.findById(conversationId)
    }

    return null
  }

  // Trouver une conversation par ID
  static async findById(id) {
    const sql = 'SELECT * FROM gemini_conversations WHERE id = ?'
    const result = await executeQuery(sql, [id])

    if (result.success && result.data.length > 0) {
      return new Conversation(result.data[0])
    }

    return null
  }

  // Trouver toutes les conversations d'un utilisateur
  static async findByUserId(userId, limit = 50, offset = 0) {
    const sql = `
      SELECT * FROM gemini_conversations 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0
    const result = await executeQuery(sql, [userId, limitNum, offsetNum])

    if (result.success) {
      return result.data.map(conv => new Conversation(conv))
    }

    return []
  }

  // Trouver toutes les conversations d'une session
  static async findBySessionId(sessionId, limit = 50, offset = 0) {
    const sql = `
      SELECT * FROM gemini_conversations 
      WHERE session_id = ? 
      ORDER BY created_at ASC 
      LIMIT ? OFFSET ?
    `
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0
    const result = await executeQuery(sql, [sessionId, limitNum, offsetNum])

    if (result.success) {
      return result.data.map(conv => new Conversation(conv))
    }

    return []
  }

  // Trouver les conversations par type
  static async findByType(userId, conversationType, limit = 50, offset = 0) {
    const sql = `
      SELECT * FROM gemini_conversations 
      WHERE user_id = ? AND conversation_type = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `
    const result = await executeQuery(sql, [userId, conversationType, parseInt(limit), parseInt(offset)])

    if (result.success) {
      return result.data.map(conv => new Conversation(conv))
    }

    return []
  }

  // Trouver les conversations liées à un formulaire
  static async findByFormId(formId, limit = 50, offset = 0) {
    const sql = `
      SELECT * FROM gemini_conversations 
      WHERE form_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0
    const result = await executeQuery(sql, [formId, limitNum, offsetNum])

    if (result.success) {
      return result.data.map(conv => new Conversation(conv))
    }

    return []
  }

  // Trouver les conversations liées à un formulaire et à un utilisateur spécifique
  static async findByFormIdAndUserId(formId, userId, limit = 50, offset = 0) {
    const sql = `
      SELECT * FROM gemini_conversations 
      WHERE form_id = ? AND user_id = ?
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0
    const result = await executeQuery(sql, [formId, userId, limitNum, offsetNum])

    if (result.success) {
      return result.data.map(conv => new Conversation(conv))
    }

    return []
  }

  // Trouver les conversations par type, formulaire et utilisateur
  static async findByTypeFormIdAndUserId(formId, userId, conversationType, limit = 50, offset = 0) {
    const sql = `
      SELECT * FROM gemini_conversations 
      WHERE form_id = ? AND user_id = ? AND conversation_type = ?
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0
    const result = await executeQuery(sql, [formId, userId, conversationType, limitNum, offsetNum])

    if (result.success) {
      return result.data.map(conv => new Conversation(conv))
    }

    return []
  }

  // Obtenir les statistiques des conversations d'un utilisateur
  static async getStatsByUserId(userId) {
    const sql = `
      SELECT 
        conversation_type,
        COUNT(*) as total_conversations,
        SUM(tokens_used) as total_tokens,
        AVG(processing_time_ms) as avg_processing_time,
        MAX(created_at) as last_conversation
      FROM gemini_conversations 
      WHERE user_id = ? 
      GROUP BY conversation_type
    `
    const result = await executeQuery(sql, [userId])

    if (result.success) {
      return result.data
    }

    return []
  }

  // Supprimer une conversation
  static async deleteById(id) {
    const sql = 'DELETE FROM gemini_conversations WHERE id = ?'
    const result = await executeQuery(sql, [id])
    return result.success
  }

  // Supprimer toutes les conversations d'un utilisateur
  static async deleteByUserId(userId) {
    const sql = 'DELETE FROM gemini_conversations WHERE user_id = ?'
    const result = await executeQuery(sql, [userId])
    return result.success
  }

  // Convertir en JSON
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      sessionId: this.sessionId,
      conversationType: this.conversationType,
      formId: this.formId,
      userMessage: this.userMessage,
      geminiResponse: this.geminiResponse,
      promptUsed: this.promptUsed,
      responseMetadata: this.responseMetadata,
      tokensUsed: this.tokensUsed,
      processingTimeMs: this.processingTimeMs,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}

export class ConversationSession {
  constructor(data) {
    this.id = data.id
    this.userId = data.user_id
    this.title = data.title
    this.description = data.description
    this.isActive = data.is_active
    this.createdAt = data.created_at
    this.updatedAt = data.updated_at
  }

  // Créer une nouvelle session
  static async create(sessionData) {
    const { userId, title, description = null } = sessionData
    const sessionId = uuidv4()

    const sql = `
      INSERT INTO gemini_sessions (id, user_id, title, description)
      VALUES (?, ?, ?, ?)
    `

    const result = await executeQuery(sql, [sessionId, userId, title, description])

    if (result.success) {
      return await ConversationSession.findById(sessionId)
    }

    return null
  }

  // Trouver une session par ID
  static async findById(id) {
    const sql = 'SELECT * FROM gemini_sessions WHERE id = ?'
    const result = await executeQuery(sql, [id])

    if (result.success && result.data.length > 0) {
      return new ConversationSession(result.data[0])
    }

    return null
  }

  // Trouver toutes les sessions d'un utilisateur
  static async findByUserId(userId, limit = 50, offset = 0) {
    const sql = `
      SELECT * FROM gemini_sessions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `
    const limitNum = parseInt(limit) || 50
    const offsetNum = parseInt(offset) || 0
    const result = await executeQuery(sql, [userId, limitNum, offsetNum])

    if (result.success) {
      return result.data.map(session => new ConversationSession(session))
    }

    return []
  }

  // Mettre à jour une session
  async update(updateData) {
    const { title, description, isActive } = updateData
    const sql = `
      UPDATE gemini_sessions 
      SET title = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `

    const result = await executeQuery(sql, [title, description, isActive, this.id])
    return result.success
  }

  // Supprimer une session
  static async deleteById(id) {
    const sql = 'DELETE FROM gemini_sessions WHERE id = ?'
    const result = await executeQuery(sql, [id])
    return result.success
  }

  // Convertir en JSON
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      description: this.description,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}
