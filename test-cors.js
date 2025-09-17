#!/usr/bin/env node

/**
 * Script de test pour vérifier la configuration CORS
 * Usage: node test-cors.js
 */

import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3000'

async function testCORS() {
  console.log('🧪 Test de la configuration CORS...\n')

  const tests = [
    {
      name: 'Test endpoint health',
      url: `${BASE_URL}/health`,
      method: 'GET'
    },
    {
      name: 'Test endpoint API docs JSON',
      url: `${BASE_URL}/api-docs.json`,
      method: 'GET'
    },
    {
      name: 'Test endpoint API docs (Swagger UI)',
      url: `${BASE_URL}/api-docs`,
      method: 'GET'
    },
    {
      name: 'Test preflight OPTIONS',
      url: `${BASE_URL}/api/forms`,
      method: 'OPTIONS'
    }
  ]

  for (const test of tests) {
    try {
      console.log(`📡 Test: ${test.name}`)
      
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      })

      console.log(`   Status: ${response.status}`)
      console.log(`   CORS Headers:`)
      console.log(`   - Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin') || 'Non défini'}`)
      console.log(`   - Access-Control-Allow-Methods: ${response.headers.get('access-control-allow-methods') || 'Non défini'}`)
      console.log(`   - Access-Control-Allow-Headers: ${response.headers.get('access-control-allow-headers') || 'Non défini'}`)
      console.log(`   - Access-Control-Allow-Credentials: ${response.headers.get('access-control-allow-credentials') || 'Non défini'}`)
      
      if (response.ok) {
        console.log(`   ✅ Succès\n`)
      } else {
        console.log(`   ❌ Échec\n`)
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}\n`)
    }
  }

  console.log('🎯 Test de requête CORS depuis le navigateur...')
  console.log('Ouvrez http://localhost:3000/api-docs dans votre navigateur')
  console.log('et vérifiez que Swagger UI se charge correctement.')
}

// Vérifier si le serveur est en cours d'exécution
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/health`)
    if (response.ok) {
      console.log('✅ Serveur détecté et opérationnel\n')
      return true
    }
  } catch (error) {
    console.log('❌ Serveur non accessible. Veuillez démarrer le serveur avec:')
    console.log('   npm run dev')
    console.log('   ou')
    console.log('   node src/server.js\n')
    return false
  }
}

async function main() {
  console.log('🚀 Test de configuration CORS pour Dynamic Forms API\n')
  
  const serverRunning = await checkServer()
  if (serverRunning) {
    await testCORS()
  }
}

main().catch(console.error)
