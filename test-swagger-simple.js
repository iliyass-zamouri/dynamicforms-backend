import express from 'express'
import swaggerUi from 'swagger-ui-express'

const app = express()

// Configuration Swagger simplifiée pour test
const simpleSwaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Test API',
    version: '1.0.0',
    description: 'API de test simple'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Serveur de développement'
    }
  ],
  paths: {
    '/test': {
      get: {
        summary: 'Test endpoint',
        responses: {
          '200': {
            description: 'Succès',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true
                    },
                    message: {
                      type: 'string',
                      example: 'Test réussi'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

app.use('/test-docs', swaggerUi.serve, swaggerUi.setup(simpleSwaggerSpec))

app.listen(3002, () => {
  console.log('Test Swagger UI running on http://localhost:3002/test-docs')
})
