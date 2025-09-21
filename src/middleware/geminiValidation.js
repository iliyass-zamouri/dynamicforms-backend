import Joi from 'joi'

/**
 * Schéma de validation pour la génération de formulaire
 */
export const generateFormSchema = Joi.object({
  description: Joi.string()
    .min(10)
    .max(2000)
    .required()
    .messages({
      'string.min': 'La description doit contenir au moins 10 caractères',
      'string.max': 'La description ne peut pas dépasser 2000 caractères',
      'any.required': 'La description est requise'
    }),
  options: Joi.object({
    theme: Joi.string()
      .valid('default', 'modern', 'elegant', 'minimal', 'dark', 'colorful')
      .optional()
      .messages({
        'any.only': 'Thème invalide. Valeurs autorisées: default, modern, elegant, minimal, dark, colorful'
      }),
    primaryColor: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .optional()
      .messages({
        'string.pattern.base': 'La couleur principale doit être une couleur hexadécimale valide (ex: #3b82f6)'
      }),
    includeMarketing: Joi.boolean()
      .optional()
      .default(false),
    language: Joi.string()
      .valid('fr', 'en', 'es', 'de', 'it')
      .optional()
      .default('fr')
      .messages({
        'any.only': 'Langue invalide. Valeurs autorisées: fr, en, es, de, it'
      })
  }).optional().default({})
})

/**
 * Schéma de validation pour la modification de formulaire
 */
export const modifyFormSchema = Joi.object({
  formId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'L\'ID du formulaire doit être un UUID valide',
      'any.required': 'L\'ID du formulaire est requis'
    }),
  instructions: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Les instructions doivent contenir au moins 10 caractères',
      'string.max': 'Les instructions ne peuvent pas dépasser 1000 caractères',
      'any.required': 'Les instructions sont requises'
    }),
  options: Joi.object({
    preserveData: Joi.boolean()
      .optional()
      .default(true),
    language: Joi.string()
      .valid('fr', 'en', 'es', 'de', 'it')
      .optional()
      .default('fr')
      .messages({
        'any.only': 'Langue invalide. Valeurs autorisées: fr, en, es, de, it'
      })
  }).optional().default({})
})

/**
 * Schéma de validation pour l'analyse de formulaire
 */
export const analyzeFormSchema = Joi.object({
  formId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'L\'ID du formulaire doit être un UUID valide',
      'any.required': 'L\'ID du formulaire est requis'
    }),
  analysisType: Joi.string()
    .valid('comprehensive', 'accessibility', 'ux', 'conversion', 'seo')
    .optional()
    .default('comprehensive')
    .messages({
      'any.only': 'Type d\'analyse invalide. Valeurs autorisées: comprehensive, accessibility, ux, conversion, seo'
    })
})

/**
 * Middleware de validation pour la génération de formulaire
 */
export const validateGenerateForm = (req, res, next) => {
  const { error, value } = generateFormSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  if (error) {
    const errorMessages = error.details.map(detail => detail.message)
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errorMessages
    })
  }

  req.validatedData = value
  next()
}

/**
 * Middleware de validation pour la modification de formulaire
 */
export const validateModifyForm = (req, res, next) => {
  const { error, value } = modifyFormSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  if (error) {
    const errorMessages = error.details.map(detail => detail.message)
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errorMessages
    })
  }

  req.validatedData = value
  next()
}

/**
 * Middleware de validation pour l'analyse de formulaire
 */
export const validateAnalyzeForm = (req, res, next) => {
  const { error, value } = analyzeFormSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  if (error) {
    const errorMessages = error.details.map(detail => detail.message)
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errorMessages
    })
  }

  req.validatedData = value
  next()
}

/**
 * Middleware de validation générale pour les requêtes Gemini
 */
export const validateGeminiRequest = (req, res, next) => {
  // Vérifier que l'API key Gemini est configurée
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      success: false,
      message: 'Service Gemini non configuré'
    })
  }

  // Vérifier la limite de taille du body
  const contentLength = req.get('content-length')
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB
    return res.status(413).json({
      success: false,
      message: 'Requête trop volumineuse'
    })
  }

  next()
}

/**
 * Middleware de validation pour les paramètres de requête
 */
export const validateQueryParams = (req, res, next) => {
  const { limit, offset } = req.query

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      success: false,
      message: 'Le paramètre limit doit être un nombre entre 1 et 100'
    })
  }

  if (offset && (isNaN(offset) || parseInt(offset) < 0)) {
    return res.status(400).json({
      success: false,
      message: 'Le paramètre offset doit être un nombre positif ou zéro'
    })
  }

  next()
}

/**
 * Middleware de validation pour les headers
 */
export const validateHeaders = (req, res, next) => {
  const contentType = req.get('content-type')
  
  if (!contentType || !contentType.includes('application/json')) {
    return res.status(400).json({
      success: false,
      message: 'Content-Type doit être application/json'
    })
  }

  next()
}

/**
 * Middleware de validation pour l'authentification
 */
export const validateAuth = (req, res, next) => {
  const authHeader = req.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token d\'authentification requis'
    })
  }

  const token = authHeader.substring(7)
  if (!token || token.length < 10) {
    return res.status(401).json({
      success: false,
      message: 'Token d\'authentification invalide'
    })
  }

  next()
}

/**
 * Middleware de validation pour les permissions
 */
export const validatePermissions = (req, res, next) => {
  // Vérifier que l'utilisateur a les permissions nécessaires
  // Cette fonction sera implémentée selon le système d'authentification existant
  const user = req.user
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Utilisateur non authentifié'
    })
  }

  // Vérifier les permissions spécifiques si nécessaire
  if (req.method === 'DELETE' && !user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Permissions insuffisantes pour cette action'
    })
  }

  next()
}

/**
 * Middleware de validation pour les erreurs Gemini
 */
export const handleGeminiErrors = (error, req, res, next) => {
  if (error.message.includes('GEMINI_API_KEY')) {
    return res.status(500).json({
      success: false,
      message: 'Service Gemini temporairement indisponible'
    })
  }

  if (error.message.includes('quota')) {
    return res.status(429).json({
      success: false,
      message: 'Quota Gemini dépassé, veuillez réessayer plus tard'
    })
  }

  if (error.message.includes('timeout')) {
    return res.status(504).json({
      success: false,
      message: 'Timeout de la requête Gemini'
    })
  }

  if (error.message.includes('parsing')) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement de la réponse Gemini'
    })
  }

  next(error)
}

/**
 * Middleware de validation pour les limites de rate
 */
export const validateRateLimit = (req, res, next) => {
  // Cette fonction sera implémentée avec le système de rate limiting existant
  // Pour l'instant, on utilise une validation basique
  const user = req.user
  const now = Date.now()
  
  if (!user.geminiRequests) {
    user.geminiRequests = []
  }

  // Nettoyer les requêtes anciennes (plus de 1 minute)
  user.geminiRequests = user.geminiRequests.filter(
    timestamp => now - timestamp < 60000
  )

  // Vérifier la limite (10 requêtes par minute)
  if (user.geminiRequests.length >= 10) {
    return res.status(429).json({
      success: false,
      message: 'Trop de requêtes Gemini, veuillez attendre avant de réessayer'
    })
  }

  // Ajouter la requête actuelle
  user.geminiRequests.push(now)
  
  next()
}
