#!/usr/bin/env node

/**
 * Script de test pour le modal de succès
 * Teste l'endpoint PATCH /api/forms/{id}/success-modal
 */

import fetch from 'node-fetch'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'

// Configuration de test
const testConfig = {
  // Remplacez par un token valide et un ID de formulaire existant
  authToken: 'YOUR_AUTH_TOKEN_HERE',
  formId: 'YOUR_FORM_ID_HERE'
}

// Données de test pour le modal de succès
const testSuccessModal = {
  successModal: {
    title: "Félicitations !",
    description: "Votre formulaire a été soumis avec succès. Nous vous recontacterons dans les plus brefs délais.",
    actions: [
      {
        name: "Voir les résultats",
        url: "https://example.com/results"
      },
      {
        name: "Télécharger PDF",
        url: "https://example.com/download"
      }
    ],
    closeEnabled: true,
    returnHomeEnabled: true,
    resubmitEnabled: false
  }
}

async function testSuccessModalEndpoint() {
  console.log('🧪 Test de l\'endpoint du modal de succès')
  console.log('==========================================')

  try {
    // Test 1: Mise à jour du modal de succès
    console.log('\n1. Test de mise à jour du modal de succès...')
    
    const response = await fetch(`${API_BASE_URL}/api/forms/${testConfig.formId}/success-modal`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${testConfig.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testSuccessModal)
    })

    const responseData = await response.json()

    if (response.ok) {
      console.log('✅ Modal de succès mis à jour avec succès')
      console.log('📋 Réponse:', JSON.stringify(responseData, null, 2))
      
      // Vérifier que le modal est bien inclus dans la réponse
      if (responseData.data?.form?.successModal) {
        console.log('✅ Le modal de succès est présent dans la réponse')
        console.log('📝 Titre:', responseData.data.form.successModal.title)
        console.log('📝 Description:', responseData.data.form.successModal.description)
        console.log('📝 Actions:', responseData.data.form.successModal.actions?.length || 0)
      } else {
        console.log('❌ Le modal de succès n\'est pas présent dans la réponse')
      }
    } else {
      console.log('❌ Erreur lors de la mise à jour:', response.status, responseData.message)
    }

    // Test 2: Récupération du formulaire pour vérifier la persistance
    console.log('\n2. Test de récupération du formulaire...')
    
    const getResponse = await fetch(`${API_BASE_URL}/api/forms/${testConfig.formId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testConfig.authToken}`
      }
    })

    const getResponseData = await getResponse.json()

    if (getResponse.ok) {
      console.log('✅ Formulaire récupéré avec succès')
      
      if (getResponseData.data?.form?.successModal) {
        console.log('✅ Le modal de succès est persistant')
        console.log('📝 Titre persistant:', getResponseData.data.form.successModal.title)
      } else {
        console.log('❌ Le modal de succès n\'est pas persistant')
      }
    } else {
      console.log('❌ Erreur lors de la récupération:', getResponse.status, getResponseData.message)
    }

    // Test 3: Test de validation avec des données invalides
    console.log('\n3. Test de validation avec des données invalides...')
    
    const invalidData = {
      successModal: {
        title: "", // Titre vide - devrait échouer
        description: "A".repeat(501), // Description trop longue - devrait échouer
        actions: [
          {
            name: "", // Nom vide - devrait échouer
            url: "invalid-url" // URL invalide - devrait échouer
          }
        ]
      }
    }

    const validationResponse = await fetch(`${API_BASE_URL}/api/forms/${testConfig.formId}/success-modal`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${testConfig.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidData)
    })

    const validationData = await validationResponse.json()

    if (!validationResponse.ok && validationResponse.status === 400) {
      console.log('✅ Validation fonctionne correctement - erreurs détectées')
      console.log('📋 Erreurs de validation:', validationData.errors)
    } else {
      console.log('❌ La validation n\'a pas fonctionné comme attendu')
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  }
}

async function testWithoutAuth() {
  console.log('\n4. Test sans authentification...')
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/forms/${testConfig.formId}/success-modal`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testSuccessModal)
    })

    const responseData = await response.json()

    if (response.status === 401) {
      console.log('✅ Authentification requise - test réussi')
    } else {
      console.log('❌ L\'authentification n\'est pas requise comme attendu')
    }
  } catch (error) {
    console.error('❌ Erreur lors du test d\'authentification:', error.message)
  }
}

// Fonction principale
async function runTests() {
  console.log('🚀 Démarrage des tests du modal de succès')
  console.log('==========================================')
  
  if (testConfig.authToken === 'YOUR_AUTH_TOKEN_HERE' || testConfig.formId === 'YOUR_FORM_ID_HERE') {
    console.log('⚠️  Veuillez configurer testConfig avec un token et un ID de formulaire valides')
    console.log('   - authToken: Token JWT valide')
    console.log('   - formId: ID d\'un formulaire existant')
    return
  }

  await testSuccessModalEndpoint()
  await testWithoutAuth()
  
  console.log('\n🏁 Tests terminés')
}

// Exécuter les tests
runTests().catch(console.error)
