import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import swaggerUi from 'swagger-ui-express'

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler.js'
import {
  generalLimiter,
  authLimiter,
  submissionLimiter,
  apiLimiter,
} from './middleware/rateLimiter.js'

// Import routes
import authRoutes from './routes/auth.js'
import formsRoutes from './routes/forms.js'
import submissionsRoutes from './routes/submissions.js'
import geminiRoutes from './routes/gemini.js'
import conversationsRoutes from './routes/conversations.js'

// Import database connection
import { testConnection } from './database/connection.js'

// Import Swagger configuration
import { swaggerSpec } from './config/swagger.js'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT
? parseInt(process.env.PORT)
: 3000; // fallback only for local dev

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1)

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Autoriser les requêtes sans origin (comme les applications mobiles ou Postman)
      if (!origin) return callback(null, true)
      
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:8080',
        'http://127.0.0.1:8080'
      ]
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      
      // Pour Swagger UI, autoriser les requêtes depuis le même serveur
      if (origin && origin.includes('localhost:3000')) {
        return callback(null, true)
      }
      
      callback(new Error('Non autorisé par CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    optionsSuccessStatus: 200
  }),
)

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.sendStatus(200)
})

// Rate limiting
app.use(generalLimiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Static files (for file uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Vérifier l'état du serveur
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Serveur opérationnel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Le serveur fonctionne"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 uptime:
 *                   type: number
 *                   description: Temps de fonctionnement en secondes
 *                   example: 3600
 */
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Le serveur fonctionne',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// API routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/forms', apiLimiter, formsRoutes)
app.use('/api/submissions', submissionLimiter, submissionsRoutes)
app.use('/api/gemini', apiLimiter, geminiRoutes)
app.use('/api/conversations', apiLimiter, conversationsRoutes)

// Middleware CORS spécifique pour Swagger UI
app.use('/api-docs', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
})

// Swagger UI documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Dynamic Forms API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    tryItOutEnabled: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    // Configuration pour éviter les erreurs CORS
    requestInterceptor: (req) => {
      req.headers['Access-Control-Allow-Origin'] = '*'
      return req
    }
  }
}))

// Swagger JSON specification
app.get('/api-docs.json', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// API documentation endpoint (legacy)
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API Dynamic Forms',
    version: '1.0.0',
    documentation: 'http://localhost:3000/api-docs',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/profile': 'Get user profile',
        'PUT /api/auth/profile': 'Update user profile',
        'PUT /api/auth/change-password': 'Change password',
        'GET /api/auth/users': 'Get all users (admin only)',
        'DELETE /api/auth/users/:id': 'Delete user (admin only)',
      },
      forms: {
        'GET /api/forms': 'Get all forms',
        'GET /api/forms/:id': 'Get form by ID',
        'GET /api/forms/slug/:slug': 'Get form by slug (public)',
        'POST /api/forms': 'Create new form',
        'PUT /api/forms/:id': 'Update form',
        'PUT /api/forms/:id/steps': 'Update form steps and fields',
        'DELETE /api/forms/:id': 'Delete form',
        'GET /api/forms/:id/submissions': 'Get form submissions',
        'GET /api/forms/:id/stats': 'Get form statistics',
      },
      submissions: {
        'POST /api/submissions': 'Submit form',
        'GET /api/submissions': 'Get all submissions (admin only)',
        'GET /api/submissions/:id': 'Get submission by ID',
        'GET /api/submissions/user/my-submissions': 'Get user submissions',
        'GET /api/submissions/stats/overview': 'Get submission statistics (admin only)',
        'GET /api/submissions/stats/date-range': 'Get submissions by date range (admin only)',
        'DELETE /api/submissions/:id': 'Delete submission (admin only)',
      },
      gemini: {
        'POST /api/gemini/generate': 'Generate form with Gemini AI',
        'POST /api/gemini/modify': 'Modify existing form with Gemini AI',
        'POST /api/gemini/analyze': 'Analyze form with Gemini AI',
        'GET /api/gemini/health': 'Check Gemini service health',
      },
    },
  })
})

// 404 handler
app.use(notFound)

// Error handling middleware
app.use(errorHandler)

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection()
    if (!dbConnected) {
      console.error('❌ Failed to connect to database')
      process.exit(1)
    }

    // Start HTTP server
    app.listen(PORT, () => {
      console.log('🚀 Server started successfully!')
      console.log(`📡 Server running on port ${PORT}`)
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🔗 API URL: http://localhost:${PORT}/api`)
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`)
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

// Start the server
startServer()
