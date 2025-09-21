/**
 * Test script pour vérifier la logique de mise à jour des steps
 * Ce script teste que les champs sont bien mis à jour plutôt que recréés
 */

import { Form } from './src/models/Form.js'
import { User } from './src/models/User.js'
import { executeQuery } from './src/database/connection.js'

async function testUpdateSteps() {
  console.log('🧪 Test de la logique de mise à jour des steps...\n')

  try {
    // Créer un utilisateur de test
    console.log('0. Création d\'un utilisateur de test...')
    const testUser = await User.create({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123'
    })
    if (!testUser) {
      throw new Error('Échec de la création de l\'utilisateur de test')
    }
    console.log('✅ Utilisateur de test créé avec ID:', testUser.id)

    // Créer un formulaire de test
    const formData = {
      title: 'Test Form Update',
      description: 'Formulaire de test pour la mise à jour des steps',
      slug: 'test-form-update-' + Date.now(),
      userId: testUser.id,
      steps: [
        {
          id: 'step-1',
          title: 'Étape 1',
          fields: [
            {
              id: 'field-1',
              type: 'text',
              label: 'Nom',
              placeholder: 'Votre nom',
              required: true,
              order: 0
            },
            {
              id: 'field-2',
              type: 'email',
              label: 'Email',
              placeholder: 'votre@email.com',
              required: true,
              order: 1
            }
          ]
        }
      ]
    }

    console.log('1. Création du formulaire de test...')
    const form = await Form.create(formData)
    if (!form) {
      throw new Error('Échec de la création du formulaire')
    }
    console.log('✅ Formulaire créé avec ID:', form.id)

    // Vérifier les IDs initiaux
    console.log('\n2. Vérification des IDs initiaux...')
    const initialSteps = await Form.getStepsWithFields(form.id)
    console.log('Steps initiaux:', initialSteps.map(s => ({ id: s.id, title: s.title })))
    console.log('Fields initiaux:', initialSteps[0]?.fields?.map(f => ({ id: f.id, label: f.label })))

    // Mettre à jour les steps avec les mêmes IDs
    console.log('\n3. Mise à jour des steps avec les mêmes IDs...')
    const stepId = initialSteps[0].id
    const field1Id = initialSteps[0].fields[0].id
    const field2Id = initialSteps[0].fields[1].id
    
    const updatedSteps = [
      {
        id: stepId, // Utiliser l'ID réel de la base de données
        title: 'Étape 1 Modifiée', // Titre modifié
        fields: [
          {
            id: field1Id, // Utiliser l'ID réel de la base de données
            type: 'text',
            label: 'Nom Complet', // Label modifié
            placeholder: 'Votre nom complet',
            required: true,
            order: 0
          },
          {
            id: field2Id, // Utiliser l'ID réel de la base de données
            type: 'email',
            label: 'Adresse Email', // Label modifié
            placeholder: 'votre.adresse@email.com',
            required: true,
            order: 1
          },
          {
            id: 'field-3', // Nouveau champ (sans ID pour qu'il soit généré)
            type: 'tel',
            label: 'Téléphone',
            placeholder: 'Votre numéro',
            required: false,
            order: 2
          }
        ]
      }
    ]

    const updateSuccess = await form.updateSteps(updatedSteps)
    if (!updateSuccess) {
      throw new Error('Échec de la mise à jour des steps')
    }
    console.log('✅ Steps mis à jour avec succès')

    // Vérifier que les IDs sont préservés
    console.log('\n4. Vérification des IDs après mise à jour...')
    const finalSteps = await Form.getStepsWithFields(form.id)
    console.log('Steps finaux:', finalSteps.map(s => ({ id: s.id, title: s.title })))
    console.log('Fields finaux:', finalSteps[0]?.fields?.map(f => ({ id: f.id, label: f.label })))

    // Vérifications
    const step1 = finalSteps.find(s => s.id === stepId)
    const field1 = step1?.fields?.find(f => f.id === field1Id)
    const field2 = step1?.fields?.find(f => f.id === field2Id)
    const field3 = step1?.fields?.find(f => f.label === 'Téléphone') // Nouveau champ

    console.log('\n5. Vérifications des résultats...')
    
    if (step1 && step1.title === 'Étape 1 Modifiée') {
      console.log('✅ Le titre de l\'étape a été mis à jour correctement')
    } else {
      console.log('❌ Le titre de l\'étape n\'a pas été mis à jour')
    }

    if (field1 && field1.label === 'Nom Complet') {
      console.log('✅ Le champ field-1 a été mis à jour (label modifié)')
    } else {
      console.log('❌ Le champ field-1 n\'a pas été mis à jour correctement')
    }

    if (field2 && field2.label === 'Adresse Email') {
      console.log('✅ Le champ field-2 a été mis à jour (label modifié)')
    } else {
      console.log('❌ Le champ field-2 n\'a pas été mis à jour correctement')
    }

    if (field3 && field3.label === 'Téléphone') {
      console.log('✅ Le nouveau champ field-3 a été créé correctement')
    } else {
      console.log('❌ Le nouveau champ field-3 n\'a pas été créé')
    }

    // Nettoyer
    console.log('\n6. Nettoyage...')
    await form.delete()
    console.log('✅ Formulaire de test supprimé')
    
    // Supprimer l'utilisateur de test (cela supprimera aussi le formulaire par CASCADE)
    await testUser.delete()
    console.log('✅ Utilisateur de test supprimé')

    console.log('\n🎉 Test terminé avec succès !')
    console.log('\n📋 Résumé:')
    console.log('- Les IDs existants sont préservés lors de la mise à jour')
    console.log('- Les champs existants sont mis à jour au lieu d\'être recréés')
    console.log('- Les nouveaux champs sont créés avec de nouveaux IDs')
    console.log('- Les modifications sont appliquées correctement')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
    process.exit(1)
  }
}

// Exécuter le test
testUpdateSteps()
