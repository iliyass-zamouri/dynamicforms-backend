import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { swaggerSpec } from '../config/swagger.js'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * @swagger
 * /.well-known/ai-plugin.json:
 *   get:
 *     summary: Get AI Plugin Manifest
 *     description: Returns the AI plugin manifest for LLM integration (served as static file)
 *     tags: [AI Plugin]
 *     security: []
 *     responses:
 *       200:
 *         description: AI plugin manifest
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

/**
 * @swagger
 * /openapi.json:
 *   get:
 *     summary: Get OpenAPI Specification
 *     description: Returns the OpenAPI specification for the API (optimized for AI plugins)
 *     tags: [AI Plugin]
 *     security: []
 *     responses:
 *       200:
 *         description: OpenAPI specification in JSON format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/openapi.json', (req, res) => {
  // OpenAI Actions limit: Maximum 30 operations
  // Select the most important operations for AI assistance
  const priorityOperations = {
    // Authentication (3 operations)
    '/api/auth/register': ['post'],
    '/api/auth/login': ['post'],
    '/api/auth/profile': ['get'],
    
    // Forms Management - Core CRUD (6 operations)
    '/api/forms': ['get', 'post'],
    '/api/forms/{id}': ['get', 'put', 'delete'],
    '/api/forms/slug/{slug}': ['get'],
    
    // Submissions (4 operations)
    '/api/submissions': ['get', 'post'],
    '/api/submissions/{id}': ['get'],
    '/api/forms/{id}/submissions': ['get'],
    
    // Analytics (3 operations)
    '/api/analytics': ['get'],
    '/api/analytics/forms': ['get'],
    '/api/analytics/kpis': ['get'],
    
    // Subscriptions (2 operations)
    '/api/subscriptions': ['get'],
    '/api/subscriptions/current': ['get'],
    
    // Preferences (2 operations)
    '/api/preferences': ['get', 'put'],
    
    // Health Check (1 operation)
    '/health': ['get']
    
    // Total: 21 operations (removed Gemini AI, Admin, and Conversations)
  }

  // Filter swagger spec to only include priority operations
  const filteredPaths = {}
  let totalOperations = 0
  
  if (swaggerSpec.paths) {
    for (const [path, pathItem] of Object.entries(swaggerSpec.paths)) {
      // Check if this path is in our priority list
      if (priorityOperations[path]) {
        const filteredPathItem = {}
        
        // Only include methods that are in our priority list
        for (const method of priorityOperations[path]) {
          if (pathItem[method]) {
            filteredPathItem[method] = {
              ...pathItem[method],
              // Enhance description for AI
              summary: pathItem[method].summary || '',
              description: pathItem[method].description || ''
            }
            totalOperations++
          }
        }
        
        if (Object.keys(filteredPathItem).length > 0) {
          filteredPaths[path] = filteredPathItem
        }
      }
    }
  }

  // Enhance the swagger spec for OpenAI Actions (GPT Actions)
  const enhancedSpec = {
    openapi: swaggerSpec.openapi || '3.0.0',
    info: {
      ...swaggerSpec.info,
      title: 'Dynamic Forms API',
      version: swaggerSpec.info.version || '1.0.0',
      description: 'API for creating and managing dynamic forms. Create forms, handle submissions, track analytics, and manage user accounts. Optimized for AI assistance with essential operations only.',
      'x-logo': {
        url: `${req.protocol}://${req.get('host')}/logo.png`,
        altText: 'Dynamic Forms API',
      },
    },
    servers: [
      {
        url: `${req.protocol}://${req.get('host')}`,
        description: 'Dynamic Forms API Server',
      }
    ],
    paths: filteredPaths,
    components: swaggerSpec.components || {},
    security: swaggerSpec.security || [],
    tags: [
      {
        name: 'Forms',
        description: 'Create, read, update, and delete forms',
        'x-priority': 1
      },
      {
        name: 'Submissions',
        description: 'Handle form submissions and retrieve data',
        'x-priority': 2
      },
      {
        name: 'Analytics',
        description: 'Track form performance and insights',
        'x-priority': 3
      },
      {
        name: 'Authentication',
        description: 'User authentication and profile management',
        'x-priority': 4
      },
      {
        name: 'Subscriptions',
        description: 'View subscription information',
        'x-priority': 5
      },
      {
        name: 'Preferences',
        description: 'Manage user preferences',
        'x-priority': 6
      },
      {
        name: 'Health',
        description: 'API health status',
        'x-priority': 7
      }
    ],
    // GPT-specific metadata
    'x-gpt-description': 'API for managing dynamic forms. Create and manage forms, handle submissions, track analytics, and manage user accounts.',
    'x-gpt-instructions': 'Workflow: 1) Authenticate with /api/auth/login to get a token, 2) Use /api/forms endpoints to create and manage forms, 3) Use /api/submissions to handle form data, 4) Use /api/analytics for performance insights. Always explain actions in simple terms to users.',
    'x-operation-count': totalOperations
  }

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.setHeader('X-Operation-Count', totalOperations.toString())
  res.json(enhancedSpec)
})

/**
 * @swagger
 * /legal:
 *   get:
 *     summary: Get Legal Information
 *     description: Returns legal information and terms of service
 *     tags: [AI Plugin]
 *     security: []
 *     responses:
 *       200:
 *         description: Legal information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 terms_of_service:
 *                   type: string
 *                 privacy_policy:
 *                   type: string
 */
router.get('/legal', (req, res) => {
  res.json({
    terms_of_service: 'Terms of Service for Dynamic Forms API',
    privacy_policy: 'Privacy Policy for Dynamic Forms API',
    description:
      'This API is designed to help users create, manage, and analyze dynamic forms with AI assistance.',
    usage_guidelines:
      'Please use this API responsibly and in accordance with our terms of service.',
  })
})

/**
 * @swagger
 * /logo.png:
 *   get:
 *     summary: Get API Logo
 *     description: Returns the API logo image
 *     tags: [AI Plugin]
 *     security: []
 *     responses:
 *       200:
 *         description: Logo image
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/logo.png', (req, res) => {
  // Return a placeholder response or serve an actual logo file
  res.status(404).json({
    message: 'Logo not configured. Please add your logo file.',
  })
})

export default router

