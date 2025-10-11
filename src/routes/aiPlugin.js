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

