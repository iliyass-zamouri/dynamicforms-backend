# Configuration Swagger pour Dynamic Forms API

## 🎯 Vue d'ensemble

Cette documentation décrit la configuration complète de Swagger/OpenAPI 3.0 pour l'API Dynamic Forms, similaire à ce qui est disponible en PHP avec des packages comme `swagger-php` ou `zircote/swagger-php`.

## 📦 Packages installés

```json
{
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^5.0.0"
}
```

## 🏗️ Structure des fichiers

```
src/
├── config/
│   ├── swagger.js          # Configuration principale Swagger
│   └── environments.js     # Configuration des environnements
├── routes/
│   ├── auth.js            # Routes d'authentification avec annotations
│   ├── forms.js           # Routes de formulaires avec annotations
│   └── submissions.js     # Routes de soumissions avec annotations
└── server.js              # Serveur avec intégration Swagger UI

examples/
└── api-examples.md        # Exemples d'utilisation de l'API

test-swagger.js            # Tests basiques de Swagger
test-docs.js              # Tests complets de la documentation
deploy-swagger.sh         # Script de déploiement
docker-compose.swagger.yml # Configuration Docker
nginx.conf                # Configuration Nginx
```

## 🚀 Démarrage rapide

### 1. Installation
```bash
npm install
```

### 2. Démarrage du serveur
```bash
# Mode développement
npm run dev

# Mode production
npm start

# Avec documentation
npm run docs
```

### 3. Accès à la documentation
- **Interface Swagger UI** : http://localhost:3000/api-docs
- **Spécification JSON** : http://localhost:3000/api-docs.json
- **API de base** : http://localhost:3000/api

## 🧪 Tests

### Tests basiques
```bash
npm run test:swagger
```

### Tests complets
```bash
npm run test:docs
```

### Tests avec rapport
Les tests génèrent automatiquement un rapport JSON dans `swagger-test-report.json`.

## 🐳 Déploiement Docker

### Avec Docker Compose
```bash
npm run docker:swagger
```

### Configuration Docker
- `Dockerfile.swagger` : Image Docker optimisée
- `docker-compose.swagger.yml` : Services complets (API + MySQL + Nginx)
- `nginx.conf` : Configuration Nginx avec rate limiting

## 🌍 Environnements

### Développement
```bash
NODE_ENV=development npm start
```

### Staging
```bash
NODE_ENV=staging npm start
```

### Production
```bash
NODE_ENV=production npm start
```

## 📚 Fonctionnalités de la documentation

### 1. Interface Swagger UI
- Interface interactive similaire à Swagger Editor
- Test des endpoints directement depuis l'interface
- Authentification JWT intégrée
- Exemples de requêtes et réponses

### 2. Spécification OpenAPI 3.0
- Schémas de données complets
- Endpoints documentés avec annotations JSDoc
- Codes de statut HTTP détaillés
- Validation des paramètres

### 3. Authentification
- Support JWT Bearer Token
- Bouton "Authorize" dans l'interface
- Sécurité par endpoint

### 4. Exemples
- Exemples de requêtes pour chaque endpoint
- Exemples de réponses de succès et d'erreur
- Données de test réalistes

## 🔧 Configuration avancée

### Personnalisation de l'interface
```javascript
// Dans src/server.js
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Dynamic Forms API Documentation',
  customfavIcon: '/favicon.ico'
}))
```

### Ajout d'annotations Swagger
```javascript
/**
 * @swagger
 * /api/endpoint:
 *   get:
 *     summary: Description de l'endpoint
 *     tags: [Tag]
 *     parameters:
 *       - in: query
 *         name: param
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Succès
 */
```

### Schémas personnalisés
```javascript
// Dans src/config/swagger.js
schemas: {
  CustomModel: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' }
    }
  }
}
```

## 📊 Monitoring et logs

### Health Check
- Endpoint : `GET /health`
- Vérification de l'état du serveur
- Temps de fonctionnement

### Logs
- Logs d'accès Nginx
- Logs d'erreur de l'application
- Métriques de performance

## 🔒 Sécurité

### Rate Limiting
- Limitation par IP
- Limitation par endpoint
- Configuration Nginx

### Headers de sécurité
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

### CORS
- Configuration par environnement
- Headers appropriés
- Validation des origines

## 🚀 Déploiement en production

### 1. Configuration des variables d'environnement
```bash
cp env.example .env
# Modifier les valeurs pour la production
```

### 2. Build et déploiement
```bash
# Avec Docker
docker-compose -f docker-compose.swagger.yml up -d

# Avec PM2
pm2 start src/server.js --name "dynamic-forms-api"

# Avec systemd
sudo systemctl start dynamic-forms-api
```

### 3. Configuration Nginx
- SSL/TLS avec Let's Encrypt
- Redirection HTTP vers HTTPS
- Cache des ressources statiques

## 📈 Métriques et monitoring

### Endpoints de monitoring
- `/health` : État du serveur
- `/api-docs` : Documentation
- `/api-docs.json` : Spécification

### Intégration avec des outils
- Prometheus pour les métriques
- Grafana pour les tableaux de bord
- ELK Stack pour les logs

## 🔄 Maintenance

### Mise à jour de la documentation
1. Modifier les annotations dans les fichiers de routes
2. Redémarrer le serveur
3. Vérifier avec les tests automatisés

### Ajout de nouveaux endpoints
1. Créer la route dans le fichier approprié
2. Ajouter les annotations Swagger
3. Tester avec l'interface Swagger UI
4. Mettre à jour les exemples

### Gestion des versions
- Versioning de l'API dans la configuration Swagger
- Documentation des changements
- Rétrocompatibilité

## 🆘 Dépannage

### Problèmes courants

1. **Documentation non accessible**
   - Vérifier que le serveur est démarré
   - Vérifier les logs d'erreur
   - Tester avec `npm run test:swagger`

2. **Erreurs de validation**
   - Vérifier la syntaxe des annotations Swagger
   - Utiliser un validateur OpenAPI
   - Consulter les logs du serveur

3. **Problèmes d'authentification**
   - Vérifier la configuration JWT
   - Tester avec un token valide
   - Vérifier les headers de requête

### Support
- Documentation : `API_DOCUMENTATION.md`
- Exemples : `examples/api-examples.md`
- Tests : `test-docs.js`
- Logs : Fichiers de log de l'application

## 🎉 Résultat final

La documentation Swagger est maintenant complètement intégrée et fonctionnelle, offrant :

- ✅ Interface interactive similaire à Swagger Editor
- ✅ Documentation complète de tous les endpoints
- ✅ Tests automatisés de la documentation
- ✅ Support multi-environnements
- ✅ Déploiement Docker prêt
- ✅ Configuration Nginx optimisée
- ✅ Exemples d'utilisation complets
- ✅ Monitoring et health checks

L'API Dynamic Forms dispose maintenant d'une documentation professionnelle et interactive, comparable aux meilleures implémentations Swagger en PHP !

