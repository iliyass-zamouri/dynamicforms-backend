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
 *     description: Returns the AI plugin manifest for LLM integration
 *     tags: [AI Plugin]
 *     security: []
 *     responses:
 *       200:
 *         description: AI plugin manifest
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 schema_version:
 *                   type: string
 *                   example: "v1"
 *                 name_for_human:
 *                   type: string
 *                   example: "Dynamic Forms API"
 *                 name_for_model:
 *                   type: string
 *                   example: "dynamic_forms"
 *                 description_for_human:
 *                   type: string
 *                 description_for_model:
 *                   type: string
 *                 auth:
 *                   type: object
 *                 api:
 *                   type: object
 */
router.get('/.well-known/ai-plugin.json', (req, res) => {
  const manifest = {
    schema_version: 'v1',
    name_for_human: 'Dynamic Forms API',
    name_for_model: 'dynamic_forms',
    description_for_human:
      'Create, manage, and analyze dynamic forms with AI-powered generation using Gemini AI. Handle form submissions, analytics, and user management.',
    description_for_model:
      'Dynamic Forms API enables you to create and manage dynamic multi-step forms with AI assistance. You can generate forms from natural language descriptions, modify existing forms, analyze form performance, manage submissions, track analytics, and handle user subscriptions. The API supports form creation with various field types (text, email, number, textarea, select, radio, checkbox, date, file), multi-step workflows, authentication, payment processing via Stripe, and comprehensive analytics tracking. Available capabilities: 1) Generate forms from natural language (POST /api/gemini/generate), 2) Modify existing forms (POST /api/gemini/modify), 3) Analyze form performance (POST /api/gemini/analyze), 4) Manage forms (GET/POST/PUT/DELETE /api/forms), 5) Handle submissions (GET/POST /api/submissions), 6) Track analytics (GET /api/analytics), 7) User authentication (POST /api/auth/register, POST /api/auth/login), 8) Manage subscriptions (GET/POST /api/subscriptions).',
    auth: {
      type: 'user_http',
      authorization_type: 'bearer',
      authorization_content_type: 'application/json',
    },
    api: {
      type: 'openapi',
      url: `${req.protocol}://${req.get('host')}/openapi.json`,
      is_user_authenticated: false,
    },
    logo_url: `${req.protocol}://${req.get('host')}/logo.png`,
    contact_email: 'support@dynamicforms.com',
    legal_info_url: `${req.protocol}://${req.get('host')}/legal`,
  }

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.json(manifest)
})

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
  // Enhance the swagger spec with additional metadata for AI plugins
  const enhancedSpec = {
    ...swaggerSpec,
    info: {
      ...swaggerSpec.info,
      'x-logo': {
        url: `${req.protocol}://${req.get('host')}/logo.png`,
        altText: 'Dynamic Forms API',
      },
    },
    servers: [
      {
        url: `${req.protocol}://${req.get('host')}`,
        description: 'Current server',
      },
      ...(swaggerSpec.servers || []),
    ],
  }

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
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

