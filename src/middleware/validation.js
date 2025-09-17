import { body, param, query, validationResult } from 'express-validator'

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Échec de la validation',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    })
  }

  next()
}

// User validation rules
export const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),

  body('email').isEmail().normalizeEmail().withMessage('Veuillez fournir une adresse email valide'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  // .withMessage(
  //   'Le mot de passe doit contenir au moins une lettre minuscule, une lettre majuscule et un chiffre',
  // ),

  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Le rôle doit être soit utilisateur soit administrateur'),

  handleValidationErrors,
]

export const validateUserLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Veuillez fournir une adresse email valide'),

  body('password').notEmpty().withMessage('Le mot de passe est requis'),

  handleValidationErrors,
]

export const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),

  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez fournir une adresse email valide'),

  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Le rôle doit être soit utilisateur soit administrateur'),

  handleValidationErrors,
]

// Form validation rules
export const validateFormCreation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Le titre est requis et doit contenir moins de 255 caractères'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La description doit contenir moins de 1000 caractères'),

  body('slug')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Le slug ne doit contenir que des lettres minuscules, des chiffres et des tirets'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'draft'])
    .withMessage('Le statut doit être actif, inactif ou brouillon'),

  body('theme')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Le thème doit contenir moins de 50 caractères'),

  body('primaryColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('La couleur principale doit être une couleur hexadécimale valide'),

  body('notificationEmail')
    .optional()
    .custom((value, { req }) => {
      // If emailNotifications is true, notificationEmail is required
      if (req.body.emailNotifications === true) {
        if (!value) {
          throw new Error(
            "L'email de notification est requis lorsque les notifications par email sont activées",
          )
        } else if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          // If value is provided, it must be a valid email
          throw new Error("L'email de notification doit être une adresse email valide")
        }
      }
      return true
    })
    .normalizeEmail(),

  handleValidationErrors,
]

export const validateFormUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Le titre doit contenir moins de 255 caractères'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La description doit contenir moins de 1000 caractères'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'draft'])
    .withMessage('Le statut doit être actif, inactif ou brouillon'),

  body('theme')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Le thème doit contenir moins de 50 caractères'),

  body('primaryColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('La couleur principale doit être une couleur hexadécimale valide'),

  body('notificationEmail')
    .optional()
    .custom((value, { req }) => {
      // If emailNotifications is true, notificationEmail is required
      if (req.body.emailNotifications === true) {
        if (!value) {
          throw new Error(
            "L'email de notification est requis lorsque les notifications par email sont activées",
          )
        } else if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          // If value is provided, it must be a valid email
          throw new Error("L'email de notification doit être une adresse email valide")
        }
      }

      return true
    })
    .normalizeEmail(),

  handleValidationErrors,
]

// Form submission validation rules
export const validateFormSubmission = [
  body('data').isObject().withMessage('Les données de soumission doivent être un objet'),

  handleValidationErrors,
]

// Parameter validation
export const validateFormId = [
  param('id').isUUID().withMessage("L'ID du formulaire doit être un UUID valide"),

  handleValidationErrors,
]

export const validateSubmissionId = [
  param('id').isUUID().withMessage("L'ID de soumission doit être un UUID valide"),

  handleValidationErrors,
]

// Query validation
export const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage("L'offset doit être un entier non négatif"),

  handleValidationErrors,
]

// Success modal validation
export const validateSuccessModal = [
  body('successModal')
    .isObject()
    .withMessage('Le modal de succès doit être un objet'),

  body('successModal.title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Le titre du modal est requis et doit contenir entre 1 et 100 caractères'),

  body('successModal.description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La description du modal ne peut pas dépasser 500 caractères'),

  body('successModal.actions')
    .optional()
    .isArray()
    .withMessage('Les actions doivent être un tableau'),

  body('successModal.actions.*.name')
    .if(body('successModal.actions').isArray())
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Le nom de chaque action est requis et doit contenir entre 1 et 50 caractères'),

  body('successModal.actions.*.url')
    .if(body('successModal.actions').isArray())
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('L\'URL de chaque action doit être une URL valide (http ou https)'),

  body('successModal.closeEnabled')
    .optional()
    .isBoolean()
    .withMessage('closeEnabled doit être un booléen'),

  body('successModal.returnHomeEnabled')
    .optional()
    .isBoolean()
    .withMessage('returnHomeEnabled doit être un booléen'),

  body('successModal.resubmitEnabled')
    .optional()
    .isBoolean()
    .withMessage('resubmitEnabled doit être un booléen'),

  handleValidationErrors,
]
