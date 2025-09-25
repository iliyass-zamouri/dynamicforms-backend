import swaggerJsdoc from 'swagger-jsdoc'
import { getEnvironmentConfig } from './environments.js'

const envConfig = getEnvironmentConfig()

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dynamic Forms API',
      version: '1.0.0',
      description: 'API pour la gestion de formulaires dynamiques avec authentification et soumissions',
      contact: {
        name: 'Dynamic Forms Team',
        email: 'support@dynamicforms.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: envConfig.swagger.servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT pour l\'authentification'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique de l\'utilisateur'
            },
            name: {
              type: 'string',
              description: 'Nom de l\'utilisateur'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email de l\'utilisateur'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'Rôle de l\'utilisateur'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de dernière mise à jour'
            }
          }
        },
        Form: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique du formulaire'
            },
            title: {
              type: 'string',
              description: 'Titre du formulaire'
            },
            description: {
              type: 'string',
              description: 'Description du formulaire'
            },
            slug: {
              type: 'string',
              description: 'Slug unique du formulaire'
            },
            steps: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/FormStep'
              },
              description: 'Étapes du formulaire'
            },
            isActive: {
              type: 'boolean',
              description: 'Statut actif du formulaire'
            },
            requireAuthentication: {
              type: 'boolean',
              description: 'Authentification requise'
            },
            allowMultipleSubmissions: {
              type: 'boolean',
              description: 'Autoriser les soumissions multiples'
            },
            userId: {
              type: 'integer',
              description: 'ID du créateur du formulaire'
            },
            successModal: {
              $ref: '#/components/schemas/SuccessModalSettings',
              description: 'Paramètres du modal de succès'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de dernière mise à jour'
            }
          }
        },
        FormStep: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID unique de l\'étape'
            },
            title: {
              type: 'string',
              description: 'Titre de l\'étape'
            },
            description: {
              type: 'string',
              description: 'Description de l\'étape'
            },
            fields: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/FormField'
              },
              description: 'Champs de l\'étape'
            }
          }
        },
        FormField: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID unique du champ'
            },
            type: {
              type: 'string',
              enum: ['text', 'email', 'number', 'textarea', 'select', 'radio', 'checkbox', 'date', 'file'],
              description: 'Type du champ'
            },
            label: {
              type: 'string',
              description: 'Libellé du champ'
            },
            placeholder: {
              type: 'string',
              description: 'Texte d\'aide du champ'
            },
            required: {
              type: 'boolean',
              description: 'Champ obligatoire'
            },
            options: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Options pour les champs select, radio, checkbox'
            },
            validation: {
              type: 'object',
              description: 'Règles de validation'
            }
          }
        },
        FormSubmission: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique de la soumission'
            },
            formId: {
              type: 'integer',
              description: 'ID du formulaire'
            },
            userId: {
              type: 'integer',
              nullable: true,
              description: 'ID de l\'utilisateur (peut être null)'
            },
            data: {
              type: 'object',
              description: 'Données soumises'
            },
            ipAddress: {
              type: 'string',
              description: 'Adresse IP de soumission'
            },
            userAgent: {
              type: 'string',
              description: 'User Agent du navigateur'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de soumission'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Message d\'erreur'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Message de succès'
            },
            data: {
              type: 'object',
              description: 'Données de réponse'
            }
          },
          required: ['success']
        },
        Pagination: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Nombre total d\'éléments'
            },
            limit: {
              type: 'integer',
              description: 'Nombre d\'éléments par page'
            },
            offset: {
              type: 'integer',
              description: 'Décalage de pagination'
            },
            hasMore: {
              type: 'boolean',
              description: 'Y a-t-il plus d\'éléments'
            }
          }
        },
        SuccessModalSettings: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              description: 'Titre du modal de succès',
              example: 'Félicitations !'
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Description du modal de succès',
              example: 'Votre formulaire a été soumis avec succès.'
            },
            actions: {
              type: 'array',
              description: 'Actions personnalisées du modal',
              items: {
                $ref: '#/components/schemas/SuccessModalAction'
              }
            },
            closeEnabled: {
              type: 'boolean',
              description: 'Permettre la fermeture du modal',
              default: true
            },
            returnHomeEnabled: {
              type: 'boolean',
              description: 'Afficher le bouton retour à l\'accueil',
              default: true
            },
            resubmitEnabled: {
              type: 'boolean',
              description: 'Permettre la resoumission du formulaire',
              default: false
            }
          }
        },
        SuccessModalAction: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 50,
              description: 'Nom du bouton d\'action',
              example: 'Voir les résultats'
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'URL de destination de l\'action',
              example: 'https://example.com/results'
            }
          }
        },
        GeminiGenerateRequest: {
          type: 'object',
          required: ['description'],
          properties: {
            description: {
              type: 'string',
              minLength: 10,
              maxLength: 2000,
              description: 'Description du formulaire souhaité',
              example: 'Je veux créer un formulaire de contact avec nom, email, sujet et message'
            },
            options: {
              type: 'object',
              properties: {
                theme: {
                  type: 'string',
                  enum: ['default', 'modern', 'elegant', 'minimal', 'dark', 'colorful'],
                  description: 'Thème du formulaire',
                  example: 'modern'
                },
                primaryColor: {
                  type: 'string',
                  pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
                  description: 'Couleur principale du formulaire',
                  example: '#3b82f6'
                },
                includeMarketing: {
                  type: 'boolean',
                  description: 'Inclure les éléments marketing',
                  example: true
                },
                language: {
                  type: 'string',
                  enum: ['fr', 'en', 'es', 'de', 'it'],
                  description: 'Langue du formulaire',
                  example: 'fr'
                }
              }
            }
          }
        },
        GeminiModifyRequest: {
          type: 'object',
          required: ['formId', 'instructions'],
          properties: {
            formId: {
              type: 'string',
              format: 'uuid',
              description: 'ID du formulaire à modifier',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            instructions: {
              type: 'string',
              minLength: 10,
              maxLength: 1000,
              description: 'Instructions de modification',
              example: 'Ajouter un champ pour le numéro de téléphone et changer le thème en sombre'
            },
            options: {
              type: 'object',
              properties: {
                preserveData: {
                  type: 'boolean',
                  description: 'Préserver les données existantes',
                  example: true
                },
                language: {
                  type: 'string',
                  enum: ['fr', 'en', 'es', 'de', 'it'],
                  description: 'Langue des instructions',
                  example: 'fr'
                }
              }
            }
          }
        },
        GeminiAnalyzeRequest: {
          type: 'object',
          required: ['formId'],
          properties: {
            formId: {
              type: 'string',
              format: 'uuid',
              description: 'ID du formulaire à analyser',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            analysisType: {
              type: 'string',
              enum: ['comprehensive', 'accessibility', 'ux', 'conversion', 'seo'],
              description: 'Type d\'analyse',
              example: 'comprehensive'
            }
          }
        },
        AccountType: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID unique du type de compte',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            name: {
              type: 'string',
              description: 'Nom unique du type de compte',
              example: 'pro'
            },
            displayName: {
              type: 'string',
              description: 'Nom d\'affichage du type de compte',
              example: 'Plan Pro'
            },
            description: {
              type: 'string',
              description: 'Description du type de compte',
              example: 'Plan avancé avec des fonctionnalités professionnelles'
            },
            maxForms: {
              type: 'integer',
              minimum: 0,
              description: 'Nombre maximum de formulaires',
              example: 25
            },
            maxSubmissionsPerForm: {
              type: 'integer',
              minimum: 0,
              description: 'Nombre maximum de soumissions par formulaire',
              example: 1000
            },
            canExportForms: {
              type: 'boolean',
              description: 'Peut exporter les formulaires',
              example: true
            },
            canExportSubmissions: {
              type: 'boolean',
              description: 'Peut exporter les soumissions',
              example: true
            },
            maxExportsPerForm: {
              type: 'integer',
              minimum: 0,
              description: 'Nombre maximum d\'exports par formulaire',
              example: 50
            },
            maxExportsPerSubmission: {
              type: 'integer',
              minimum: 0,
              description: 'Nombre maximum d\'exports par soumission',
              example: 50
            },
            features: {
              type: 'object',
              description: 'Fonctionnalités supplémentaires',
              example: {
                support: 'priority',
                analytics: true,
                customDomains: 3,
                apiAccess: true
              }
            },
            priceMonthly: {
              type: 'number',
              minimum: 0,
              description: 'Prix mensuel',
              example: 29.99
            },
            priceYearly: {
              type: 'number',
              minimum: 0,
              description: 'Prix annuel',
              example: 299.99
            },
            currency: {
              type: 'string',
              description: 'Code de la devise',
              example: 'USD'
            },
            currencySymbol: {
              type: 'string',
              description: 'Symbole de la devise pour l\'affichage',
              example: '$'
            },
            isActive: {
              type: 'boolean',
              description: 'Si le type de compte est actif',
              example: true
            },
            isDefault: {
              type: 'boolean',
              description: 'Si c\'est le type de compte par défaut',
              example: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de dernière mise à jour'
            }
          }
        },
        GeminiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                form: {
                  $ref: '#/components/schemas/Form'
                },
                suggestions: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Suggestions d\'amélioration',
                  example: ['Considérer ajouter un champ téléphone', 'Le formulaire pourrait bénéficier d\'une validation email renforcée']
                },
                changes: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Liste des changements effectués (pour les modifications)',
                  example: ['Ajout du champ téléphone', 'Changement du thème en sombre']
                },
                analysis: {
                  type: 'object',
                  description: 'Résultats de l\'analyse (pour l\'analyse)',
                  properties: {
                    accessibility: {
                      type: 'string',
                      example: 'Score: 8/10 - Bonne structure, considérer ajouter des labels ARIA'
                    },
                    ux: {
                      type: 'string',
                      example: 'Score: 7/10 - Interface claire, améliorer la progression visuelle'
                    },
                    conversion: {
                      type: 'string',
                      example: 'Score: 6/10 - Considérer réduire le nombre d\'étapes'
                    },
                    seo: {
                      type: 'string',
                      example: 'Score: 9/10 - Excellente structure sémantique'
                    }
                  }
                },
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Recommandations générales',
                  example: ['Ajouter des indicateurs de progression', 'Implémenter la validation en temps réel']
                },
                suggestedImprovements: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['field', 'step', 'validation', 'design']
                      },
                      suggestion: {
                        type: 'string'
                      },
                      priority: {
                        type: 'string',
                        enum: ['high', 'medium', 'low']
                      },
                      impact: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            },
            message: {
              type: 'string',
              example: 'Formulaire généré avec succès'
            },
            generatedBy: {
              type: 'string',
              example: 'gemini'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints d\'authentification et gestion des utilisateurs'
      },
      {
        name: 'Forms',
        description: 'Gestion des formulaires dynamiques'
      },
      {
        name: 'Submissions',
        description: 'Gestion des soumissions de formulaires'
      },
      {
        name: 'Account Types',
        description: 'Gestion des types de comptes et tarification'
      },
      {
        name: 'Gemini AI',
        description: 'Génération et modification de formulaires avec l\'IA Gemini'
      },
      {
        name: 'Health',
        description: 'Vérification de l\'état du serveur'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/server.js']
}

export const swaggerSpec = swaggerJsdoc(options)
