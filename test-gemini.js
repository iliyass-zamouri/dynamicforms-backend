/**
 * Script de test pour l'endpoint Gemini
 * Ce script démontre l'utilisation des endpoints Gemini pour la génération et modification de formulaires
 */

import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3000'
const API_URL = `${BASE_URL}/api`

// Token d'authentification (à remplacer par un token valide)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmMjAyNjM2MC04ZmJiLTExZjAtOTI2My1kZDEyYzA4ZTg4ZmQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTg0MTg2ODMsImV4cCI6MTc1OTAyMzQ4M30.Rg8HjzPc7Od2LNvpfVRoF2HIvbFQ_78kIFOxZPDs7bQ'

// Headers pour les requêtes
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
}

/**
 * Test de génération de formulaire
 */
async function testGenerateForm() {
  console.log('🚀 Test de génération de formulaire...')
  
  const requestData = {
    description: "Je veux créer un formulaire de contact avec nom, email, sujet et message. Le message doit être obligatoire et le formulaire doit avoir un thème moderne.",
    options: {
      theme: "modern",
      primaryColor: "#3b82f6",
      includeMarketing: true,
      language: "fr"
    }
  }

  try {
    const response = await fetch(`${API_URL}/gemini/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Formulaire généré avec succès!')
      console.log(`📝 Titre: ${result.data.form.title}`)
      console.log(`📊 Nombre d'étapes: ${result.data.form.steps.length}`)
      console.log(`💡 Suggestions: ${result.data.suggestions.length}`)
      return result.data.form.id
    } else {
      console.error('❌ Erreur lors de la génération:', result.message)
      return null
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message)
    return null
  }
}

/**
 * Test de modification de formulaire
 */
async function testModifyForm(formId) {
  if (!formId) {
    console.log('⏭️  Pas de formulaire à modifier')
    return
  }

  console.log('🔧 Test de modification de formulaire...')
  
  const requestData = {
    formId: formId,
    instructions: "Ajouter un champ pour le numéro de téléphone et changer la couleur principale en vert. Ajouter aussi une étape pour les informations de l'entreprise.",
    options: {
      preserveData: true,
      language: "fr"
    }
  }

  try {
    const response = await fetch(`${API_URL}/gemini/modify`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Formulaire modifié avec succès!')
      console.log(`📝 Titre: ${result.data.form.title}`)
      console.log(`📊 Nombre d'étapes: ${result.data.form.steps.length}`)
      console.log(`🎨 Couleur: ${result.data.form.primaryColor}`)
      console.log(`📋 Changements: ${result.data.changes.join(', ')}`)
    } else {
      console.error('❌ Erreur lors de la modification:', result.message)
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message)
  }
}

/**
 * Test d'analyse de formulaire
 */
async function testAnalyzeForm(formId) {
  if (!formId) {
    console.log('⏭️  Pas de formulaire à analyser')
    return
  }

  console.log('🔍 Test d\'analyse de formulaire...')
  
  const requestData = {
    formId: formId,
    analysisType: "comprehensive"
  }

  try {
    const response = await fetch(`${API_URL}/gemini/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Analyse terminée avec succès!')
      console.log(`📊 Accessibilité: ${result.data.analysis.accessibility}`)
      console.log(`🎨 UX: ${result.data.analysis.ux}`)
      console.log(`📈 Conversion: ${result.data.analysis.conversion}`)
      console.log(`🔍 SEO: ${result.data.analysis.seo}`)
      console.log(`💡 Recommandations: ${result.data.recommendations.length}`)
    } else {
      console.error('❌ Erreur lors de l\'analyse:', result.message)
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message)
  }
}

/**
 * Test de santé du service Gemini
 */
async function testGeminiHealth() {
  console.log('🏥 Test de santé du service Gemini...')
  
  try {
    const response = await fetch(`${API_URL}/gemini/health`, {
      method: 'GET',
      headers
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Service Gemini opérationnel!')
      console.log(`📊 Statut: ${result.status}`)
      console.log(`⏰ Timestamp: ${result.timestamp}`)
    } else {
      console.error('❌ Service Gemini indisponible:', result.message)
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message)
  }
}

/**
 * Test de génération de formulaire d'inscription événement
 */
async function testGenerateEventForm() {
  console.log('🎉 Test de génération de formulaire d\'événement...')
  
  const requestData = {
    description: "Créer un formulaire d'inscription pour un événement avec nom, prénom, email, téléphone, choix du repas (végétarien/normal), allergies, et acceptation des conditions. Le formulaire doit être élégant et professionnel.",
    options: {
      theme: "elegant",
      primaryColor: "#8b5cf6",
      includeMarketing: true,
      language: "fr"
    }
  }

  try {
    const response = await fetch(`${API_URL}/gemini/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Formulaire d\'événement généré avec succès!')
      console.log(`📝 Titre: ${result.data.form.title}`)
      console.log(`📊 Nombre d'étapes: ${result.data.form.steps.length}`)
      console.log(`🎨 Thème: ${result.data.form.theme}`)
      console.log(`🎨 Couleur: ${result.data.form.primaryColor}`)
      
      // Afficher les champs générés
      result.data.form.steps.forEach((step, index) => {
        console.log(`\n📋 Étape ${index + 1}: ${step.title}`)
        step.fields.forEach((field, fieldIndex) => {
          console.log(`  - ${field.label} (${field.type}) ${field.required ? '✓' : ''}`)
        })
      })
      
      return result.data.form.id
    } else {
      console.error('❌ Erreur lors de la génération:', result.message)
      return null
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message)
    return null
  }
}

/**
 * Fonction principale de test
 */
async function runTests() {
  console.log('🧪 Démarrage des tests Gemini...\n')
  
  // Test de santé
  await testGeminiHealth()
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test de génération de formulaire de contact
  const contactFormId = await testGenerateForm()
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test de modification
  await testModifyForm(contactFormId)
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test d'analyse
  await testAnalyzeForm(contactFormId)
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test de génération de formulaire d'événement
  const eventFormId = await testGenerateEventForm()
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test d'analyse du formulaire d'événement
  await testAnalyzeForm(eventFormId)
  
  console.log('\n🎉 Tests terminés!')
}

/**
 * Instructions d'utilisation
 */
function printInstructions() {
  console.log(`
📚 Instructions d'utilisation du test Gemini:

1. Assurez-vous que le serveur est démarré:
   npm start

2. Obtenez un token d'authentification valide:
   - Connectez-vous via POST /api/auth/login
   - Copiez le token de la réponse

3. Remplacez 'your_jwt_token_here' dans ce fichier par votre token

4. Exécutez le test:
   node test-gemini.js

5. Vérifiez que GEMINI_API_KEY est configuré dans votre .env

🔧 Configuration requise:
- GEMINI_API_KEY=your_gemini_api_key_here
- Serveur en cours d'exécution sur le port 3000
- Token JWT valide

📖 Documentation API: http://localhost:3000/api-docs
`)
}

// Vérifier si le script est exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  if (AUTH_TOKEN === 'your_jwt_token_here') {
    printInstructions()
  } else {
    runTests().catch(console.error)
  }
}

export {
  testGenerateForm,
  testModifyForm,
  testAnalyzeForm,
  testGeminiHealth,
  testGenerateEventForm,
  runTests
}
