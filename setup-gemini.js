#!/usr/bin/env node

/**
 * Script de configuration automatique pour l'endpoint Gemini
 * Ce script aide à configurer l'environnement pour utiliser l'endpoint Gemini
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

console.log('🚀 Configuration de l\'endpoint Gemini\n')

// Vérifier les prérequis
function checkPrerequisites() {
  console.log('📋 Vérification des prérequis...')
  
  // Vérifier Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim()
    console.log(`✅ Node.js: ${nodeVersion}`)
  } catch (error) {
    console.log('❌ Node.js non installé')
    process.exit(1)
  }
  
  // Vérifier npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
    console.log(`✅ npm: ${npmVersion}`)
  } catch (error) {
    console.log('❌ npm non installé')
    process.exit(1)
  }
  
  // Vérifier les fichiers requis
  const requiredFiles = [
    'src/services/geminiService.js',
    'src/routes/gemini.js',
    'src/middleware/geminiValidation.js',
    'src/utils/formGenerator.js',
    'package.json'
  ]
  
  let allFilesExist = true
  requiredFiles.forEach(file => {
    if (existsSync(file)) {
      console.log(`✅ ${file}`)
    } else {
      console.log(`❌ ${file} - MANQUANT`)
      allFilesExist = false
    }
  })
  
  if (!allFilesExist) {
    console.log('❌ Fichiers requis manquants')
    process.exit(1)
  }
  
  console.log('✅ Tous les prérequis sont satisfaits\n')
}

// Vérifier les dépendances
function checkDependencies() {
  console.log('📦 Vérification des dépendances...')
  
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
    const dependencies = packageJson.dependencies || {}
    
    // Vérifier les dépendances critiques
    const criticalDeps = [
      '@google/generative-ai',
      'express',
      'joi',
      'mysql2',
      'jsonwebtoken'
    ]
    
    let allDepsInstalled = true
    criticalDeps.forEach(dep => {
      if (dependencies[dep]) {
        console.log(`✅ ${dep}: ${dependencies[dep]}`)
      } else {
        console.log(`❌ ${dep} - MANQUANT`)
        allDepsInstalled = false
      }
    })
    
    if (!allDepsInstalled) {
      console.log('\n🔧 Installation des dépendances manquantes...')
      execSync('npm install', { stdio: 'inherit' })
      console.log('✅ Dépendances installées\n')
    } else {
      console.log('✅ Toutes les dépendances sont installées\n')
    }
  } catch (error) {
    console.log(`❌ Erreur lors de la vérification des dépendances: ${error.message}`)
    process.exit(1)
  }
}

// Configurer le fichier .env
function setupEnvironment() {
  console.log('⚙️  Configuration de l\'environnement...')
  
  const envFile = '.env'
  const envExample = 'env.example'
  
  if (!existsSync(envFile)) {
    if (existsSync(envExample)) {
      console.log('📋 Création du fichier .env à partir de env.example...')
      const envContent = readFileSync(envExample, 'utf8')
      writeFileSync(envFile, envContent)
      console.log('✅ Fichier .env créé')
    } else {
      console.log('❌ Fichier env.example manquant')
      process.exit(1)
    }
  } else {
    console.log('✅ Fichier .env existe déjà')
  }
  
  // Vérifier les variables critiques
  const envContent = readFileSync(envFile, 'utf8')
  const requiredVars = [
    'GEMINI_API_KEY',
    'JWT_SECRET',
    'DB_HOST',
    'DB_NAME'
  ]
  
  let missingVars = []
  requiredVars.forEach(varName => {
    if (!envContent.includes(varName) || envContent.includes(`${varName}=your_`)) {
      missingVars.push(varName)
    }
  })
  
  if (missingVars.length > 0) {
    console.log('⚠️  Variables d\'environnement à configurer:')
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`)
    })
    console.log('\n📝 Éditez le fichier .env avec vos valeurs')
  } else {
    console.log('✅ Variables d\'environnement configurées')
  }
  
  console.log('')
}

// Tester la configuration
function testConfiguration() {
  console.log('🧪 Test de la configuration...')
  
  try {
    // Test de syntaxe des fichiers
    const filesToTest = [
      'src/services/geminiService.js',
      'src/routes/gemini.js',
      'src/middleware/geminiValidation.js',
      'src/utils/formGenerator.js'
    ]
    
    filesToTest.forEach(file => {
      try {
        execSync(`node -c ${file}`, { stdio: 'pipe' })
        console.log(`✅ ${file} - Syntaxe OK`)
      } catch (error) {
        console.log(`❌ ${file} - Erreur de syntaxe`)
        throw error
      }
    })
    
    // Test des utilitaires
    console.log('🔧 Test des utilitaires...')
    execSync('node test-gemini-standalone.js', { stdio: 'pipe' })
    console.log('✅ Utilitaires fonctionnent')
    
    console.log('✅ Configuration testée avec succès\n')
  } catch (error) {
    console.log(`❌ Erreur lors du test: ${error.message}`)
    console.log('Vérifiez la configuration et réessayez\n')
  }
}

// Afficher les instructions finales
function showFinalInstructions() {
  console.log('🎉 Configuration terminée!\n')
  
  console.log('📝 Prochaines étapes:')
  console.log('1. Configurez votre base de données MySQL')
  console.log('2. Obtenez une clé API Gemini: https://makersuite.google.com/app/apikey')
  console.log('3. Éditez le fichier .env avec vos valeurs')
  console.log('4. Exécutez les migrations: npm run migrate')
  console.log('5. Démarrez le serveur: npm start')
  console.log('6. Testez l\'endpoint: node test-gemini.js')
  
  console.log('\n📚 Documentation:')
  console.log('- Guide d\'utilisation: README_GEMINI.md')
  console.log('- Configuration DB: SETUP_DATABASE.md')
  console.log('- API Swagger: http://localhost:3000/api-docs')
  
  console.log('\n🚀 L\'endpoint Gemini est prêt à être utilisé!')
  console.log('Vous pourrez décrire des formulaires en langage naturel et l\'IA les générera automatiquement.')
}

// Fonction principale
function main() {
  try {
    checkPrerequisites()
    checkDependencies()
    setupEnvironment()
    testConfiguration()
    showFinalInstructions()
  } catch (error) {
    console.error(`❌ Erreur lors de la configuration: ${error.message}`)
    process.exit(1)
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main }
