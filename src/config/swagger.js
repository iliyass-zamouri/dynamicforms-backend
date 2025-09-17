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
        name: 'Health',
        description: 'Vérification de l\'état du serveur'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/server.js']
}

export const swaggerSpec = swaggerJsdoc(options)
