/**
 * Utilitaires pour la génération et la validation de formulaires
 */

/**
 * Types de champs supportés
 */
export const SUPPORTED_FIELD_TYPES = [
  'text',
  'email',
  'tel',
  'number',
  'textarea',
  'select',
  'radio',
  'checkbox',
  'file',
  'date',
  'time',
  'url'
]

/**
 * Thèmes disponibles
 */
export const AVAILABLE_THEMES = [
  'default',
  'modern',
  'elegant',
  'minimal',
  'dark',
  'colorful'
]

/**
 * Couleurs principales suggérées
 */
export const SUGGESTED_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
  '#6b7280'  // Gray
]

/**
 * Valide un type de champ
 * @param {string} type - Type de champ à valider
 * @returns {boolean} True si valide
 */
export function isValidFieldType(type) {
  return SUPPORTED_FIELD_TYPES.includes(type)
}

/**
 * Valide un thème
 * @param {string} theme - Thème à valider
 * @returns {boolean} True si valide
 */
export function isValidTheme(theme) {
  return AVAILABLE_THEMES.includes(theme)
}

/**
 * Valide une couleur hexadécimale
 * @param {string} color - Couleur à valider
 * @returns {boolean} True si valide
 */
export function isValidColor(color) {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexColorRegex.test(color)
}

/**
 * Génère un slug à partir d'un titre
 * @param {string} title - Titre du formulaire
 * @returns {string} Slug généré
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, '') // Supprime les caractères spéciaux
    .replace(/\s+/g, '-') // Remplace les espaces par des tirets
    .replace(/-+/g, '-') // Supprime les tirets multiples
    .trim()
}

/**
 * Valide la structure d'un champ de formulaire
 * @param {Object} field - Champ à valider
 * @returns {Object} Résultat de validation
 */
export function validateField(field) {
  const errors = []
  
  if (!field.type || !isValidFieldType(field.type)) {
    errors.push('Type de champ invalide')
  }
  
  if (!field.label || field.label.trim().length === 0) {
    errors.push('Label du champ requis')
  }
  
  if (field.required && typeof field.required !== 'boolean') {
    errors.push('Le champ required doit être un booléen')
  }
  
  if (field.validation && typeof field.validation !== 'object') {
    errors.push('La validation doit être un objet')
  }
  
  // Validation spécifique selon le type
  if (['select', 'radio'].includes(field.type)) {
    if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
      errors.push('Les champs select et radio nécessitent des options')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Valide la structure d'une étape de formulaire
 * @param {Object} step - Étape à valider
 * @returns {Object} Résultat de validation
 */
export function validateStep(step) {
  const errors = []
  
  if (!step.title || step.title.trim().length === 0) {
    errors.push('Titre de l\'étape requis')
  }
  
  if (!step.fields || !Array.isArray(step.fields)) {
    errors.push('Les champs doivent être un tableau')
  } else {
    step.fields.forEach((field, index) => {
      const fieldValidation = validateField(field)
      if (!fieldValidation.isValid) {
        errors.push(`Champ ${index + 1}: ${fieldValidation.errors.join(', ')}`)
      }
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Valide la structure complète d'un formulaire
 * @param {Object} formData - Données du formulaire à valider
 * @returns {Object} Résultat de validation
 */
export function validateFormStructure(formData) {
  const errors = []
  
  if (!formData.title || formData.title.trim().length === 0) {
    errors.push('Titre du formulaire requis')
  }
  
  if (!formData.steps || !Array.isArray(formData.steps) || formData.steps.length === 0) {
    errors.push('Le formulaire doit avoir au moins une étape')
  } else {
    formData.steps.forEach((step, index) => {
      const stepValidation = validateStep(step)
      if (!stepValidation.isValid) {
        errors.push(`Étape ${index + 1}: ${stepValidation.errors.join(', ')}`)
      }
    })
  }
  
  if (formData.theme && !isValidTheme(formData.theme)) {
    errors.push('Thème invalide')
  }
  
  if (formData.primaryColor && !isValidColor(formData.primaryColor)) {
    errors.push('Couleur principale invalide')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Génère des suggestions d'amélioration pour un formulaire
 * @param {Object} formData - Données du formulaire
 * @returns {Array} Liste de suggestions
 */
export function generateSuggestions(formData) {
  const suggestions = []
  
  // Vérifier la longueur des étapes
  if (formData.steps && formData.steps.length > 3) {
    suggestions.push('Considérer diviser le formulaire en plusieurs pages pour améliorer l\'expérience utilisateur')
  }
  
  // Vérifier les champs requis
  const requiredFields = formData.steps?.flatMap(step => 
    step.fields?.filter(field => field.required) || []
  ) || []
  
  if (requiredFields.length > 5) {
    suggestions.push('Trop de champs requis peuvent décourager les utilisateurs')
  }
  
  // Vérifier la présence de validation email
  const hasEmailField = formData.steps?.some(step => 
    step.fields?.some(field => field.type === 'email')
  )
  
  if (hasEmailField) {
    suggestions.push('Ajouter une validation email renforcée pour améliorer la qualité des données')
  }
  
  // Vérifier la présence de champs de contact
  const hasContactFields = formData.steps?.some(step => 
    step.fields?.some(field => 
      ['email', 'tel'].includes(field.type) || 
      field.label?.toLowerCase().includes('contact')
    )
  )
  
  if (!hasContactFields) {
    suggestions.push('Considérer ajouter des champs de contact pour le suivi')
  }
  
  return suggestions
}

/**
 * Nettoie et normalise les données d'un formulaire
 * @param {Object} formData - Données du formulaire à nettoyer
 * @returns {Object} Données nettoyées
 */
export function cleanFormData(formData) {
  const cleaned = { ...formData }
  
  // Nettoyer le titre
  if (cleaned.title) {
    cleaned.title = cleaned.title.trim()
  }
  
  // Nettoyer la description
  if (cleaned.description) {
    cleaned.description = cleaned.description.trim()
  }
  
  // Générer un slug si nécessaire
  if (cleaned.title && !cleaned.slug) {
    cleaned.slug = generateSlug(cleaned.title)
  }
  
  // Nettoyer les étapes
  if (cleaned.steps && Array.isArray(cleaned.steps)) {
    cleaned.steps = cleaned.steps.map(step => ({
      ...step,
      title: step.title?.trim() || '',
      fields: step.fields?.map(field => ({
        ...field,
        label: field.label?.trim() || '',
        placeholder: field.placeholder?.trim() || '',
        options: field.options?.map(option => ({
          ...option,
          label: option.label?.trim() || '',
          value: option.value?.trim() || ''
        })) || []
      })) || []
    }))
  }
  
  return cleaned
}

/**
 * Génère un formulaire par défaut en cas d'erreur
 * @param {string} title - Titre du formulaire
 * @returns {Object} Formulaire par défaut
 */
export function generateDefaultForm(title = 'Nouveau Formulaire') {
  return {
    title,
    description: 'Formulaire généré automatiquement',
    slug: generateSlug(title),
    theme: 'default',
    primaryColor: '#3b82f6',
    allowMultipleSubmissions: true,
    requireAuthentication: false,
    emailNotifications: false,
    steps: [
      {
        title: 'Informations de base',
        fields: [
          {
            type: 'text',
            label: 'Nom',
            placeholder: 'Votre nom',
            required: true,
            validation: {
              minLength: 2,
              maxLength: 50
            }
          },
          {
            type: 'email',
            label: 'Email',
            placeholder: 'votre@email.com',
            required: true,
            validation: {
              pattern: '^[^@]+@[^@]+\\.[^@]+$'
            }
          }
        ]
      }
    ],
    marketing: {
      sidebar: {
        title: 'Contactez-nous',
        description: 'Nous sommes là pour vous aider',
        enabled: false,
        socialMedia: {
          enabled: false,
          title: 'Suivez-nous',
          buttons: []
        },
        footer: {
          text: '© 2024 Votre Entreprise'
        }
      }
    },
    successModal: {
      enabled: true,
      title: 'Merci !',
      message: 'Votre formulaire a été soumis avec succès.',
      showButton: true,
      buttonText: 'Fermer'
    }
  }
}
