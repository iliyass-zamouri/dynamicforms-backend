import { GoogleGenerativeAI } from '@google/generative-ai'
import { Form } from '../models/Form.js'
import { Conversation, ConversationSession } from '../models/Conversation.js'
import { v4 as uuidv4 } from 'uuid'

export class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      generationConfig: {
        temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
        maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 4096,
      }
    })
  }

  /**
   * Génère un formulaire basé sur une description textuelle
   * @param {string} description - Description du formulaire souhaité
   * @param {Object} options - Options de génération
   * @param {string} userId - ID de l'utilisateur
   * @param {string} formId - ID du formulaire existant (optionnel)
   * @param {string} sessionId - ID de la session de conversation
   * @returns {Object} Formulaire généré
   */
  async generateForm(description, options = {}, userId, formId = null, sessionId = null) {
    const startTime = Date.now()
    
    try {
      const prompt = this.buildGenerationPrompt(description, options)
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      const processingTime = Date.now() - startTime
      
      // Parser la réponse JSON de Gemini
      const formData = this.parseFormResponse(text)
      
      let form
      let isNewForm = false

      if (formId) {
        // Modifier un formulaire existant
        form = await Form.findById(formId)
        if (!form) {
          throw new Error('Formulaire non trouvé')
        }
        
        // Appliquer les modifications au formulaire existant
        form = await this.applyFormData(form, formData)
      } else {
        // Créer un nouveau formulaire
        form = await Form.create({
          ...formData,
          userId,
          status: 'draft'
        })
        isNewForm = true
      }

      if (!form) {
        throw new Error('Erreur lors de la création/modification du formulaire')
      }

      // Créer ou récupérer la session de conversation liée au formulaire
      let conversationSession = null
      if (sessionId) {
        conversationSession = await ConversationSession.findById(sessionId)
      }
      
      if (!conversationSession) {
        conversationSession = await ConversationSession.create({
          userId,
          title: `${isNewForm ? 'Génération' : 'Modification'}: ${formData.title || form.title}`,
          description: `Session de ${isNewForm ? 'génération' : 'modification'} de formulaire - ${description.substring(0, 100)}...`
        })
      }

      // Sauvegarder la conversation liée au formulaire
      await Conversation.create({
        userId,
        sessionId: conversationSession.id,
        conversationType: isNewForm ? 'generate' : 'modify',
        formId: form.id,
        userMessage: description,
        geminiResponse: text,
        promptUsed: prompt,
        responseMetadata: {
          formId: form.id,
          formTitle: formData.title || form.title,
          options: options,
          isNewForm: isNewForm
        },
        tokensUsed: this.estimateTokens(prompt + text),
        processingTimeMs: processingTime
      })

      return {
        form: form.toJSON(),
        suggestions: formData.suggestions || [],
        generatedBy: 'gemini',
        sessionId: conversationSession.id,
        conversationId: conversationSession.id,
        isNewForm: isNewForm
      }
    } catch (error) {
      console.error('Erreur lors de la génération du formulaire:', error)
      throw new Error(`Erreur de génération: ${error.message}`)
    }
  }

  /**
   * Modifie un formulaire existant basé sur des instructions
   * @param {string} formId - ID du formulaire à modifier
   * @param {string} instructions - Instructions de modification
   * @param {Object} options - Options de modification
   * @param {string} userId - ID de l'utilisateur
   * @param {string} sessionId - ID de la session de conversation
   * @returns {Object} Formulaire modifié
   */
  async modifyForm(formId, instructions, options = {}, userId, sessionId = null) {
    const startTime = Date.now()
    
    try {
      // Récupérer le formulaire existant
      const existingForm = await Form.findById(formId)
      if (!existingForm) {
        throw new Error('Formulaire non trouvé')
      }

      const prompt = this.buildModificationPrompt(existingForm, instructions, options)
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      const processingTime = Date.now() - startTime
      
      // Parser la réponse JSON de Gemini
      const modifications = this.parseModificationResponse(text)
      
      // Appliquer les modifications
      const updatedForm = await this.applyModifications(existingForm, modifications)

      // Créer ou récupérer la session de conversation
      let conversationSession = null
      if (sessionId) {
        conversationSession = await ConversationSession.findById(sessionId)
      }
      
      if (!conversationSession) {
        conversationSession = await ConversationSession.create({
          userId,
          title: `Modification: ${existingForm.title}`,
          description: `Session de modification de formulaire - ${instructions.substring(0, 100)}...`
        })
      }

      // Sauvegarder la conversation
      await Conversation.create({
        userId,
        sessionId: conversationSession.id,
        conversationType: 'modify',
        formId: formId,
        userMessage: instructions,
        geminiResponse: text,
        promptUsed: prompt,
        responseMetadata: {
          formId: formId,
          formTitle: existingForm.title,
          options: options,
          changes: modifications.changes || []
        },
        tokensUsed: this.estimateTokens(prompt + text),
        processingTimeMs: processingTime
      })

      return {
        form: updatedForm.toJSON(),
        suggestions: modifications.suggestions || [],
        changes: modifications.changes || [],
        generatedBy: 'gemini',
        sessionId: conversationSession.id,
        conversationId: conversationSession.id
      }
    } catch (error) {
      console.error('Erreur lors de la modification du formulaire:', error)
      throw new Error(`Erreur de modification: ${error.message}`)
    }
  }

  /**
   * Analyse un formulaire et fournit des suggestions
   * @param {string} formId - ID du formulaire à analyser
   * @param {string} analysisType - Type d'analyse
   * @param {string} userId - ID de l'utilisateur
   * @param {string} sessionId - ID de la session de conversation
   * @returns {Object} Analyse et suggestions
   */
  async analyzeForm(formId, analysisType = 'comprehensive', userId, sessionId = null) {
    const startTime = Date.now()
    
    try {
      const form = await Form.findById(formId)
      if (!form) {
        throw new Error('Formulaire non trouvé')
      }

      const prompt = this.buildAnalysisPrompt(form, analysisType)
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      const processingTime = Date.now() - startTime
      
      const analysisResult = this.parseAnalysisResponse(text)

      // Créer ou récupérer la session de conversation
      let conversationSession = null
      if (sessionId) {
        conversationSession = await ConversationSession.findById(sessionId)
      }
      
      if (!conversationSession) {
        conversationSession = await ConversationSession.create({
          userId,
          title: `Analyse: ${form.title}`,
          description: `Session d'analyse de formulaire - ${analysisType}`
        })
      }

      // Sauvegarder la conversation
      await Conversation.create({
        userId,
        sessionId: conversationSession.id,
        conversationType: 'analyze',
        formId: formId,
        userMessage: `Analyse de type: ${analysisType}`,
        geminiResponse: text,
        promptUsed: prompt,
        responseMetadata: {
          formId: formId,
          formTitle: form.title,
          analysisType: analysisType,
          analysis: analysisResult.analysis
        },
        tokensUsed: this.estimateTokens(prompt + text),
        processingTimeMs: processingTime
      })

      return {
        ...analysisResult,
        sessionId: conversationSession.id,
        conversationId: conversationSession.id
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse du formulaire:', error)
      throw new Error(`Erreur d'analyse: ${error.message}`)
    }
  }

  /**
   * Construit le prompt pour la génération de formulaire
   */
  buildGenerationPrompt(description, options) {
    const language = options.language || 'fr'
    const theme = options.theme || 'modern'
    const primaryColor = options.primaryColor || '#3b82f6'
    const includeMarketing = options.includeMarketing || false

    return `
Tu es un expert en création de formulaires web. Génère un formulaire complet basé sur la description suivante.

DESCRIPTION: ${description}

OPTIONS:
- Langue: ${language}
- Thème: ${theme}
- Couleur principale: ${primaryColor}
- Marketing inclus: ${includeMarketing}

Génère une réponse JSON avec la structure suivante:
{
  "title": "Titre du formulaire",
  "description": "Description du formulaire",
  "slug": "slug-du-formulaire",
  "theme": "${theme}",
  "primaryColor": "${primaryColor}",
  "allowMultipleSubmissions": true,
  "requireAuthentication": false,
  "emailNotifications": false,
  "steps": [
    {
      "title": "Nom de l'étape",
      "fields": [
        {
          "type": "text|email|tel|number|textarea|select|radio|checkbox|file|date|time|url",
          "label": "Label du champ",
          "placeholder": "Placeholder",
          "required": true,
          "validation": {
            "minLength": 2,
            "maxLength": 100,
            "pattern": "regex si nécessaire"
          },
          "options": [
            {"label": "Option 1", "value": "option1"}
          ]
        }
      ]
    }
  ],
  "marketing": {
    "sidebar": {
      "title": "Titre de la sidebar",
      "description": "Description de la sidebar",
      "enabled": ${includeMarketing},
      "socialMedia": {
        "enabled": ${includeMarketing},
        "title": "Suivez-nous",
        "buttons": []
      },
      "footer": {
        "text": "Texte du footer"
      }
    }
  },
  "successModal": {
    "enabled": true,
    "title": "Merci !",
    "message": "Votre formulaire a été soumis avec succès.",
    "showButton": true,
    "buttonText": "Fermer"
  },
  "suggestions": [
    "Suggestion d'amélioration 1",
    "Suggestion d'amélioration 2"
  ]
}

IMPORTANT: 
- Utilise uniquement des types de champs supportés
- Ajoute des validations appropriées
- Structure le formulaire en étapes logiques
- Assure-toi que le JSON est valide
- Réponds uniquement avec le JSON, sans texte supplémentaire
`
  }

  /**
   * Construit le prompt pour la modification de formulaire
   */
  buildModificationPrompt(existingForm, instructions, options) {
    const language = options.language || 'fr'
    const preserveData = options.preserveData !== false

    return `
Tu es un expert en modification de formulaires web. Modifie le formulaire existant selon les instructions.

FORMULAIRE EXISTANT:
${JSON.stringify(existingForm.toJSON(), null, 2)}

INSTRUCTIONS DE MODIFICATION: ${instructions}

OPTIONS:
- Langue: ${language}
- Préserver les données: ${preserveData}

Génère une réponse JSON avec la structure suivante:
{
  "modifications": {
    "title": "Nouveau titre (si modifié)",
    "description": "Nouvelle description (si modifiée)",
    "theme": "Nouveau thème (si modifié)",
    "primaryColor": "Nouvelle couleur (si modifiée)",
    "steps": [
      // Structure complète des étapes modifiées
    ],
    "marketing": {
      // Configuration marketing modifiée
    },
    "successModal": {
      // Modal de succès modifiée
    }
  },
  "changes": [
    "Description des changements effectués"
  ],
  "suggestions": [
    "Suggestions d'amélioration"
  ]
}

IMPORTANT:
- Préserve la structure existante autant que possible
- Applique uniquement les modifications demandées
- Assure-toi que le JSON est valide
- Réponds uniquement avec le JSON, sans texte supplémentaire
`
  }

  /**
   * Construit le prompt pour l'analyse de formulaire
   */
  buildAnalysisPrompt(form, analysisType) {
    return `
Tu es un expert en UX/UI et accessibilité web. Analyse le formulaire suivant et fournis des suggestions d'amélioration.

FORMULAIRE À ANALYSER:
${JSON.stringify(form.toJSON(), null, 2)}

TYPE D'ANALYSE: ${analysisType}

Génère une réponse JSON avec la structure suivante:
{
  "analysis": {
    "accessibility": "Score: X/10 - Description des points d'accessibilité",
    "ux": "Score: X/10 - Description de l'expérience utilisateur",
    "conversion": "Score: X/10 - Description du potentiel de conversion",
    "seo": "Score: X/10 - Description de l'optimisation SEO"
  },
  "recommendations": [
    "Recommandation générale 1",
    "Recommandation générale 2"
  ],
  "suggestedImprovements": [
    {
      "type": "field|step|validation|design",
      "suggestion": "Description de l'amélioration",
      "priority": "high|medium|low",
      "impact": "Description de l'impact attendu"
    }
  ]
}

IMPORTANT:
- Sois spécifique et actionnable
- Priorise les améliorations par impact
- Considère l'accessibilité et l'UX
- Réponds uniquement avec le JSON, sans texte supplémentaire
`
  }

  /**
   * Parse la réponse de génération de formulaire
   */
  parseFormResponse(text) {
    try {
      // Nettoyer la réponse pour extraire le JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Réponse JSON non trouvée')
      }
      
      const jsonStr = jsonMatch[0]
      return JSON.parse(jsonStr)
    } catch (error) {
      console.error('Erreur lors du parsing de la réponse:', error)
      throw new Error('Erreur lors du parsing de la réponse Gemini')
    }
  }

  /**
   * Parse la réponse de modification de formulaire
   */
  parseModificationResponse(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Réponse JSON non trouvée')
      }
      
      const jsonStr = jsonMatch[0]
      return JSON.parse(jsonStr)
    } catch (error) {
      console.error('Erreur lors du parsing de la réponse:', error)
      throw new Error('Erreur lors du parsing de la réponse Gemini')
    }
  }

  /**
   * Parse la réponse d'analyse de formulaire
   */
  parseAnalysisResponse(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Réponse JSON non trouvée')
      }
      
      const jsonStr = jsonMatch[0]
      return JSON.parse(jsonStr)
    } catch (error) {
      console.error('Erreur lors du parsing de la réponse:', error)
      throw new Error('Erreur lors du parsing de la réponse Gemini')
    }
  }

  /**
   * Applique les données de formulaire à un formulaire existant
   */
  async applyFormData(form, formData) {
    try {
      // Mettre à jour les propriétés de base
      if (formData.title) form.title = formData.title
      if (formData.description) form.description = formData.description
      if (formData.theme) form.theme = formData.theme
      if (formData.primaryColor) form.primaryColor = formData.primaryColor
      
      // Mettre à jour les étapes
      if (formData.steps) {
        await form.updateSteps(formData.steps)
      }
      
      // Mettre à jour le marketing
      if (formData.marketing) {
        await Form.saveMarketingSettings(form.id, formData.marketing)
      }
      
      // Mettre à jour la modal de succès
      if (formData.successModal) {
        await Form.updateSuccessModal(form.id, formData.successModal)
      }
      
      // Sauvegarder les modifications
      await form.update({
        title: form.title,
        description: form.description,
        theme: form.theme,
        primaryColor: form.primaryColor
      })
      
      // Recharger le formulaire avec toutes les données
      return await Form.findById(form.id)
    } catch (error) {
      console.error('Erreur lors de l\'application des données de formulaire:', error)
      throw new Error('Erreur lors de l\'application des données de formulaire')
    }
  }

  /**
   * Applique les modifications à un formulaire existant
   */
  async applyModifications(form, modifications) {
    try {
      const { modifications: mods } = modifications
      
      // Mettre à jour les propriétés de base
      if (mods.title) form.title = mods.title
      if (mods.description) form.description = mods.description
      if (mods.theme) form.theme = mods.theme
      if (mods.primaryColor) form.primaryColor = mods.primaryColor
      
      // Mettre à jour les étapes
      if (mods.steps) {
        await form.updateSteps(mods.steps)
      }
      
      // Mettre à jour le marketing
      if (mods.marketing) {
        await Form.saveMarketingSettings(form.id, mods.marketing)
      }
      
      // Mettre à jour la modal de succès
      if (mods.successModal) {
        await Form.updateSuccessModal(form.id, mods.successModal)
      }
      
      // Sauvegarder les modifications
      await form.update({
        title: form.title,
        description: form.description,
        theme: form.theme,
        primaryColor: form.primaryColor
      })
      
      // Recharger le formulaire avec toutes les données
      return await Form.findById(form.id)
    } catch (error) {
      console.error('Erreur lors de l\'application des modifications:', error)
      throw new Error('Erreur lors de l\'application des modifications')
    }
  }

  /**
   * Estime le nombre de tokens utilisés (approximation simple)
   */
  estimateTokens(text) {
    // Approximation simple : 1 token ≈ 4 caractères
    return Math.ceil(text.length / 4)
  }
}

export default new GeminiService()
