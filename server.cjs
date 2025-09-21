// Point d'entrée principal pour Passenger
// Ce fichier utilise CommonJS pour être compatible avec Passenger

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

// Configuration de base de l'app Express
const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (comme les applications mobiles ou Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:8080',
      'http://127.0.0.1:8080'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Pour Swagger UI, autoriser les requêtes depuis le même serveur
    if (origin && origin.includes('localhost:3000')) {
      return callback(null, true);
    }
    
    callback(new Error('Non autorisé par CORS'));
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
}));

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (for file uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Le serveur fonctionne',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API documentation endpoint (legacy)
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API Dynamic Forms',
    version: '1.0.0',
    documentation: '/api-docs',
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
  });
});

// Charger les routes de manière asynchrone
async function loadRoutes() {
  try {
    // Import dynamique des routes ES Modules
    const authRoutes = (await import('./src/routes/auth.js')).default;
    const formsRoutes = (await import('./src/routes/forms.js')).default;
    const submissionsRoutes = (await import('./src/routes/submissions.js')).default;
    const geminiRoutes = (await import('./src/routes/gemini.js')).default;
    const conversationsRoutes = (await import('./src/routes/conversations.js')).default;
    
    // Import des middlewares
    const { generalLimiter, authLimiter, submissionLimiter, apiLimiter } = await import('./src/middleware/rateLimiter.js');
    const { errorHandler, notFound } = await import('./src/middleware/errorHandler.js');
    const { swaggerSpec } = await import('./src/config/swagger.js');
    
    // Appliquer les middlewares de rate limiting
    app.use(generalLimiter);
    
    // Routes API
    app.use('/api/auth', authLimiter, authRoutes);
    app.use('/api/forms', apiLimiter, formsRoutes);
    app.use('/api/submissions', submissionLimiter, submissionsRoutes);
    app.use('/api/gemini', apiLimiter, geminiRoutes);
    app.use('/api/conversations', apiLimiter, conversationsRoutes);
    
    // Middleware CORS spécifique pour Swagger UI
    app.use('/api-docs', (req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      next();
    });
    
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
        requestInterceptor: (req) => {
          req.headers['Access-Control-Allow-Origin'] = '*';
          return req;
        }
      }
    }));
    
    // Swagger JSON specification
    app.get('/api-docs.json', (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
    
    // 404 handler
    app.use(notFound);
    
    // Error handling middleware
    app.use(errorHandler);
    
    console.log('✅ All routes and middlewares loaded successfully with Passenger');
  } catch (error) {
    console.error('❌ Failed to load routes:', error);
    // Ajouter un middleware d'erreur de base si le chargement échoue
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    });
  }
}

// Charger les routes au démarrage
loadRoutes();

// Export de l'app pour Passenger
module.exports = app;
