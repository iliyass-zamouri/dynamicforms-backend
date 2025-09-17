/**
 * Tests automatisés pour la documentation Swagger
 */

import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:3000'
const DOCS_URL = `${BASE_URL}/api-docs`
const JSON_URL = `${BASE_URL}/api-docs.json`

class SwaggerTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    }
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 ${name}...`)
      await testFn()
      console.log(`✅ ${name} - PASSED`)
      this.results.passed++
    } catch (error) {
      console.log(`❌ ${name} - FAILED: ${error.message}`)
      this.results.failed++
      this.results.errors.push({ test: name, error: error.message })
    }
  }

  async testServerHealth() {
    const response = await fetch(`${BASE_URL}/health`)
    const data = await response.json()
    
    if (!response.ok || !data.success) {
      throw new Error('Serveur non opérationnel')
    }
  }

  async testSwaggerUI() {
    const response = await fetch(DOCS_URL)
    
    if (!response.ok) {
      throw new Error(`Documentation UI non accessible: ${response.status}`)
    }

    const html = await response.text()
    if (!html.includes('swagger-ui') && !html.includes('Dynamic Forms API')) {
      throw new Error('Contenu de la documentation incorrect')
    }
  }

  async testSwaggerJSON() {
    const response = await fetch(JSON_URL)
    
    if (!response.ok) {
      throw new Error(`Spécification JSON non accessible: ${response.status}`)
    }

    const spec = await response.json()
    
    // Vérifications de base
    if (!spec.info || !spec.info.title) {
      throw new Error('Informations de base manquantes')
    }

    if (spec.info.title !== 'Dynamic Forms API') {
      throw new Error(`Titre incorrect: ${spec.info.title}`)
    }

    if (!spec.paths || Object.keys(spec.paths).length === 0) {
      throw new Error('Aucun endpoint défini')
    }

    // Vérifier les endpoints principaux
    const expectedEndpoints = [
      '/health',
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/profile',
      '/api/forms',
      '/api/submissions'
    ]

    for (const endpoint of expectedEndpoints) {
      if (!spec.paths[endpoint]) {
        throw new Error(`Endpoint manquant: ${endpoint}`)
      }
    }

    // Vérifier les schémas
    if (!spec.components || !spec.components.schemas) {
      throw new Error('Schémas manquants')
    }

    const requiredSchemas = ['User', 'Form', 'FormSubmission', 'Error', 'Success']
    for (const schema of requiredSchemas) {
      if (!spec.components.schemas[schema]) {
        throw new Error(`Schéma manquant: ${schema}`)
      }
    }
  }

  async testAPIEndpoints() {
    // Test de l'endpoint de base
    const response = await fetch(`${BASE_URL}/api`)
    const data = await response.json()
    
    if (!response.ok || !data.success) {
      throw new Error('Endpoint API de base non accessible')
    }

    if (!data.documentation || !data.documentation.includes('/api-docs')) {
      throw new Error('Lien vers la documentation manquant')
    }
  }

  async testCORS() {
    const response = await fetch(`${BASE_URL}/api`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
      }
    })

    if (!response.headers.get('access-control-allow-origin')) {
      throw new Error('Headers CORS manquants')
    }
  }

  async testRateLimiting() {
    // Test de limitation de débit (faire plusieurs requêtes rapides)
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(fetch(`${BASE_URL}/api`))
    }

    const responses = await Promise.all(promises)
    const rateLimited = responses.some(r => r.status === 429)
    
    if (!rateLimited) {
      console.log('⚠️  Limitation de débit non détectée (peut être normal)')
    }
  }

  async testErrorHandling() {
    // Test d'un endpoint inexistant
    const response = await fetch(`${BASE_URL}/api/nonexistent`)
    const data = await response.json()
    
    if (response.status !== 404 || data.success !== false) {
      throw new Error('Gestion d\'erreur 404 incorrecte')
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.passed + this.results.failed,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: `${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`
      },
      errors: this.results.errors
    }

    // Sauvegarder le rapport
    const reportPath = path.join(process.cwd(), 'swagger-test-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`\n📊 Rapport de test sauvegardé: ${reportPath}`)
    return report
  }

  async runAllTests() {
    console.log('🚀 Démarrage des tests de documentation Swagger\n')

    await this.test('Santé du serveur', () => this.testServerHealth())
    await this.test('Interface Swagger UI', () => this.testSwaggerUI())
    await this.test('Spécification JSON', () => this.testSwaggerJSON())
    await this.test('Endpoints API', () => this.testAPIEndpoints())
    await this.test('Configuration CORS', () => this.testCORS())
    await this.test('Gestion des erreurs', () => this.testErrorHandling())
    await this.test('Limitation de débit', () => this.testRateLimiting())

    console.log('\n📈 Résultats des tests:')
    console.log(`✅ Tests réussis: ${this.results.passed}`)
    console.log(`❌ Tests échoués: ${this.results.failed}`)
    console.log(`📊 Taux de réussite: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`)

    if (this.results.failed > 0) {
      console.log('\n❌ Erreurs détectées:')
      this.results.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`)
      })
    }

    const report = await this.generateReport()
    
    if (this.results.failed === 0) {
      console.log('\n🎉 Tous les tests sont passés ! La documentation Swagger est opérationnelle.')
      process.exit(0)
    } else {
      console.log('\n⚠️  Certains tests ont échoué. Vérifiez la configuration.')
      process.exit(1)
    }
  }
}

// Exécuter les tests
const tester = new SwaggerTester()
tester.runAllTests().catch(console.error)

