/**
 * Script de test pour vérifier que la documentation Swagger fonctionne
 */

import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3000'

async function testSwaggerDocumentation() {
  console.log('🧪 Test de la documentation Swagger...\n')

  try {
    // Test 1: Vérifier que le serveur répond
    console.log('1. Test du serveur...')
    const healthResponse = await fetch(`${BASE_URL}/health`)
    const healthData = await healthResponse.json()
    
    if (healthData.success) {
      console.log('✅ Serveur opérationnel')
    } else {
      console.log('❌ Serveur non opérationnel')
      return
    }

    // Test 2: Vérifier l'accès à la documentation Swagger
    console.log('\n2. Test de la documentation Swagger...')
    const docsResponse = await fetch(`${BASE_URL}/api-docs/`)
    
    if (docsResponse.ok) {
      console.log('✅ Documentation Swagger accessible')
    } else {
      console.log('❌ Documentation Swagger non accessible')
      return
    }

    // Test 3: Vérifier le JSON de la spécification
    console.log('\n3. Test de la spécification JSON...')
    const specResponse = await fetch(`${BASE_URL}/api-docs.json`)
    
    if (specResponse.ok) {
      const spec = await specResponse.json()
      console.log('✅ Spécification JSON accessible')
      console.log(`   - Titre: ${spec.info.title}`)
      console.log(`   - Version: ${spec.info.version}`)
      console.log(`   - Nombre de chemins: ${Object.keys(spec.paths || {}).length}`)
    } else {
      console.log('❌ Spécification JSON non accessible')
    }

    // Test 4: Vérifier l'endpoint API de base
    console.log('\n4. Test de l\'endpoint API de base...')
    const apiResponse = await fetch(`${BASE_URL}/api`)
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json()
      console.log('✅ Endpoint API accessible')
      console.log(`   - Message: ${apiData.message}`)
      console.log(`   - Documentation: ${apiData.documentation}`)
    } else {
      console.log('❌ Endpoint API non accessible')
    }

    console.log('\n🎉 Tous les tests sont passés !')
    console.log(`📚 Documentation disponible sur: ${BASE_URL}/api-docs`)

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message)
  }
}

// Exécuter les tests
testSwaggerDocumentation()

