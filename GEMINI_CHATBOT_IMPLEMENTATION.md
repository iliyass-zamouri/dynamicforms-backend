# Implémentation de l'Endpoint Gemini Chatbot

## Vue d'ensemble

Cet endpoint permet aux utilisateurs de décrire le formulaire qu'ils souhaitent créer ou modifier via un chatbot alimenté par Google Gemini AI. L'IA analyse la description de l'utilisateur et génère automatiquement un formulaire complet ou modifie un formulaire existant.

## Fonctionnalités

### 1. Génération de formulaires
- **Description textuelle** : L'utilisateur décrit le formulaire souhaité en langage naturel
- **Génération automatique** : L'IA génère la structure complète du formulaire (étapes, champs, validation)
- **Types de champs supportés** : text, email, tel, number, textarea, select, radio, checkbox, file, date, time, url
- **Validation intelligente** : L'IA ajoute automatiquement les règles de validation appropriées

### 2. Modification de formulaires existants
- **Référence par ID** : L'utilisateur peut spécifier l'ID d'un formulaire existant à modifier
- **Instructions de modification** : Description des changements souhaités
- **Préservation des données** : Les soumissions existantes sont préservées

### 3. Personnalisation avancée
- **Thème et couleurs** : L'IA peut suggérer des thèmes et couleurs appropriés
- **Configuration marketing** : Génération automatique de la sidebar et des éléments marketing
- **Modal de succès** : Configuration personnalisée du message de succès

## Architecture

### Structure des fichiers
```
src/
├── services/
│   └── geminiService.js          # Service principal pour l'intégration Gemini
├── routes/
│   └── gemini.js                 # Routes pour l'endpoint chatbot
├── middleware/
│   └── geminiValidation.js       # Validation des requêtes Gemini
└── utils/
    └── formGenerator.js          # Utilitaires pour la génération de formulaires
```

### Dépendances requises
- `@google/generative-ai` : SDK officiel Google Gemini
- `joi` : Validation des schémas (déjà présent)
- `express-validator` : Validation des requêtes (déjà présent)

## API Endpoints

### POST /api/gemini/generate
Génère un nouveau formulaire basé sur une description textuelle.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "description": "Je veux créer un formulaire de contact avec nom, email, sujet et message",
  "options": {
    "theme": "modern",
    "primaryColor": "#3b82f6",
    "includeMarketing": true,
    "language": "fr"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "form": {
      "id": "uuid",
      "title": "Formulaire de Contact",
      "description": "Formulaire de contact généré automatiquement",
      "steps": [...],
      "theme": "modern",
      "primaryColor": "#3b82f6",
      "marketing": {...},
      "successModal": {...}
    },
    "suggestions": [
      "Considérer ajouter un champ téléphone",
      "Le formulaire pourrait bénéficier d'une validation email renforcée"
    ]
  }
}
```

### POST /api/gemini/modify
Modifie un formulaire existant basé sur des instructions textuelles.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "formId": "uuid-du-formulaire",
  "instructions": "Ajouter un champ pour le numéro de téléphone et changer le thème en sombre",
  "options": {
    "preserveData": true,
    "language": "fr"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "form": {
      "id": "uuid-du-formulaire",
      "title": "Formulaire de Contact Modifié",
      "description": "Formulaire de contact avec téléphone",
      "steps": [...],
      "theme": "dark",
      "primaryColor": "#1f2937",
      "changes": [
        "Ajout du champ téléphone",
        "Changement du thème en sombre"
      ]
    },
    "suggestions": [
      "Considérer ajouter une validation pour le format de téléphone"
    ]
  }
}
```

### POST /api/gemini/analyze
Analyse un formulaire existant et fournit des suggestions d'amélioration.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "formId": "uuid-du-formulaire",
  "analysisType": "comprehensive"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "accessibility": "Score: 8/10 - Bonne structure, considérer ajouter des labels ARIA",
      "ux": "Score: 7/10 - Interface claire, améliorer la progression visuelle",
      "conversion": "Score: 6/10 - Considérer réduire le nombre d'étapes",
      "seo": "Score: 9/10 - Excellente structure sémantique"
    },
    "recommendations": [
      "Ajouter des indicateurs de progression",
      "Implémenter la validation en temps réel",
      "Considérer l'ajout d'un champ de consentement RGPD"
    ],
    "suggestedImprovements": [
      {
        "type": "field",
        "suggestion": "Ajouter un champ 'Entreprise' pour segmenter les prospects",
        "priority": "medium"
      }
    ]
  }
}
```

## Configuration Gemini

### Variables d'environnement
```env
# Configuration Gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=4096
```

### Prompts système
Le service utilise des prompts système spécialisés pour :
- Génération de formulaires
- Modification de formulaires
- Analyse et suggestions
- Traduction et localisation

## Validation et Sécurité

### Validation des entrées
- **Description** : 10-2000 caractères, texte valide
- **Instructions** : 10-1000 caractères, texte valide
- **Options** : Objet JSON valide avec champs autorisés
- **FormId** : UUID valide pour les modifications

### Sécurité
- **Rate limiting** : 10 requêtes par minute par utilisateur
- **Authentification** : Token JWT requis
- **Validation** : Toutes les entrées sont validées et sanitizées
- **Logging** : Toutes les requêtes sont loggées pour audit

### Gestion des erreurs
- **Erreurs Gemini** : Gestion des timeouts et erreurs API
- **Erreurs de validation** : Messages d'erreur clairs
- **Erreurs de base de données** : Rollback automatique des transactions
- **Fallback** : Retour à des formulaires par défaut en cas d'échec

## Exemples d'utilisation

### Exemple 1 : Formulaire de contact simple
```bash
curl -X POST http://localhost:3000/api/gemini/generate \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Je veux un formulaire de contact avec nom, email, sujet et message. Le message doit être obligatoire.",
    "options": {
      "theme": "modern",
      "primaryColor": "#2563eb"
    }
  }'
```

### Exemple 2 : Formulaire d'inscription événement
```bash
curl -X POST http://localhost:3000/api/gemini/generate \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Créer un formulaire d'inscription pour un événement avec nom, prénom, email, téléphone, choix du repas (végétarien/normal), allergies, et acceptation des conditions",
    "options": {
      "theme": "elegant",
      "includeMarketing": true,
      "language": "fr"
    }
  }'
```

### Exemple 3 : Modification de formulaire
```bash
curl -X POST http://localhost:3000/api/gemini/modify \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "123e4567-e89b-12d3-a456-426614174000",
    "instructions": "Ajouter un champ pour le numéro de téléphone et changer la couleur principale en vert",
    "options": {
      "preserveData": true
    }
  }'
```

## Tests

### Tests unitaires
- Tests du service Gemini
- Tests de validation
- Tests de génération de formulaires
- Tests de modification de formulaires

### Tests d'intégration
- Tests des endpoints complets
- Tests avec différents types de descriptions
- Tests de gestion d'erreurs
- Tests de performance

### Tests de charge
- Tests avec de nombreuses requêtes simultanées
- Tests de limites de rate limiting
- Tests de gestion des timeouts Gemini

## Monitoring et Logs

### Métriques importantes
- Nombre de formulaires générés par jour
- Taux de succès des générations
- Temps de réponse moyen
- Erreurs par type

### Logs structurés
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "service": "gemini",
  "action": "generate_form",
  "userId": "user123",
  "descriptionLength": 150,
  "responseTime": 2.5,
  "success": true
}
```

## Déploiement

### Prérequis
- Node.js 18+
- Base de données MySQL
- Clé API Gemini valide
- Variables d'environnement configurées

### Étapes de déploiement
1. Installer les dépendances : `npm install`
2. Configurer les variables d'environnement
3. Exécuter les migrations de base de données
4. Démarrer le serveur : `npm start`

### Configuration de production
- Utiliser un modèle Gemini plus puissant (gemini-1.5-pro)
- Configurer le rate limiting approprié
- Mettre en place la surveillance et les alertes
- Configurer les sauvegardes de base de données

## Roadmap

### Phase 1 (Actuelle)
- [x] Documentation complète
- [ ] Implémentation du service Gemini
- [ ] Création des endpoints
- [ ] Tests de base

### Phase 2
- [ ] Interface utilisateur pour le chatbot
- [ ] Support multilingue avancé
- [ ] Templates de formulaires prédéfinis
- [ ] Intégration avec d'autres IA

### Phase 3
- [ ] Apprentissage automatique des préférences utilisateur
- [ ] Génération de formulaires basée sur des images
- [ ] Intégration avec des outils de design
- [ ] API publique pour développeurs tiers

## Support et Maintenance

### Documentation
- Guide d'utilisation détaillé
- Exemples de code
- FAQ technique
- Changelog des versions

### Support technique
- Tickets de support
- Chat en direct
- Documentation communautaire
- Forums d'entraide

---

*Cette documentation sera mise à jour au fur et à mesure du développement de la fonctionnalité.*
