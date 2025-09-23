/**
 * Configuration des environnements pour la documentation API
 */

const getSwaggerServers = () => {
  const apiUrl = process.env.API_URL || 'http://localhost:3000'
  const env = process.env.NODE_ENV || 'development'
  
  return [
    {
      url: apiUrl,
      description: `Serveur ${env}`
    }
  ]
}

const environments = {
  development: {
    swagger: {
      servers: getSwaggerServers()
    }
  },
  production: {
    swagger: {
      servers: getSwaggerServers()
    }
  },
  staging: {
    swagger: {
      servers: getSwaggerServers()
    }
  }
}

export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development'
  return environments[env] || environments.development
}

