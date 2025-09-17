/**
 * Configuration des environnements pour la documentation API
 */

const environments = {
  development: {
    swagger: {
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Serveur de développement'
        }
      ]
    }
  },
  production: {
    swagger: {
      servers: [
        {
          url: 'https://api.dynamicforms.com',
          description: 'Serveur de production'
        }
      ]
    }
  },
  staging: {
    swagger: {
      servers: [
        {
          url: 'https://staging-api.dynamicforms.com',
          description: 'Serveur de staging'
        }
      ]
    }
  }
}

export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development'
  return environments[env] || environments.development
}

