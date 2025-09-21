# Endpoint Gemini Chatbot - Guide d'utilisation

## Vue d'ensemble

L'endpoint Gemini permet de générer, modifier et analyser des formulaires dynamiques en utilisant l'intelligence artificielle de Google Gemini. Les utilisateurs peuvent décrire le formulaire souhaité en langage naturel et l'IA génère automatiquement la structure complète.

## 🚀 Démarrage rapide

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration des variables d'environnement

Copiez le fichier `env.example` vers `.env` et configurez :

```env
# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=4096
```

### 3. Démarrage du serveur

```bash
npm start
```

### 4. Test de l'endpoint

```bash
node test-gemini.js
```

## 📚 Endpoints disponibles

### POST /api/gemini/generate
Génère un nouveau formulaire basé sur une description textuelle.

**Exemple de requête :**
```bash
curl -X POST http://localhost:3000/api/gemini/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Je veux créer un formulaire de contact avec nom, email, sujet et message",
    "options": {
      "theme": "modern",
      "primaryColor": "#3b82f6",
      "includeMarketing": true,
      "language": "fr"
    }
  }'
```

### POST /api/gemini/modify
Modifie un formulaire existant basé sur des instructions textuelles.

**Exemple de requête :**
```bash
curl -X POST http://localhost:3000/api/gemini/modify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "123e4567-e89b-12d3-a456-426614174000",
    "instructions": "Ajouter un champ pour le numéro de téléphone et changer le thème en sombre",
    "options": {
      "preserveData": true,
      "language": "fr"
    }
  }'
```

### POST /api/gemini/analyze
Analyse un formulaire existant et fournit des suggestions d'amélioration.

**Exemple de requête :**
```bash
curl -X POST http://localhost:3000/api/gemini/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "123e4567-e89b-12d3-a456-426614174000",
    "analysisType": "comprehensive"
  }'
```

### GET /api/gemini/health
Vérifie l'état du service Gemini.

**Exemple de requête :**
```bash
curl -X GET http://localhost:3000/api/gemini/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎯 Exemples d'utilisation

### 1. Formulaire de contact simple

```json
{
  "description": "Je veux un formulaire de contact avec nom, email, sujet et message. Le message doit être obligatoire.",
  "options": {
    "theme": "modern",
    "primaryColor": "#2563eb"
  }
}
```

### 2. Formulaire d'inscription événement

```json
{
  "description": "Créer un formulaire d'inscription pour un événement avec nom, prénom, email, téléphone, choix du repas (végétarien/normal), allergies, et acceptation des conditions",
  "options": {
    "theme": "elegant",
    "includeMarketing": true,
    "language": "fr"
  }
}
```

### 3. Formulaire de sondage

```json
{
  "description": "Je veux un formulaire de sondage avec des questions sur la satisfaction client, des échelles de notation de 1 à 10, et des commentaires libres",
  "options": {
    "theme": "minimal",
    "primaryColor": "#10b981"
  }
}
```

## 🔧 Configuration avancée

### Thèmes disponibles
- `default` : Thème par défaut
- `modern` : Thème moderne et épuré
- `elegant` : Thème élégant et professionnel
- `minimal` : Thème minimaliste
- `dark` : Thème sombre
- `colorful` : Thème coloré et dynamique

### Types de champs supportés
- `text` : Champ de texte simple
- `email` : Champ email avec validation
- `tel` : Champ téléphone
- `number` : Champ numérique
- `textarea` : Zone de texte multiligne
- `select` : Liste déroulante
- `radio` : Boutons radio
- `checkbox` : Cases à cocher
- `file` : Upload de fichier
- `date` : Sélecteur de date
- `time` : Sélecteur d'heure
- `url` : Champ URL

### Langues supportées
- `fr` : Français (défaut)
- `en` : Anglais
- `es` : Espagnol
- `de` : Allemand
- `it` : Italien

## 🛡️ Sécurité et limitations

### Rate Limiting
- 10 requêtes par minute par utilisateur
- Gestion automatique des quotas Gemini

### Validation
- Toutes les entrées sont validées et sanitizées
- Authentification JWT requise
- Vérification des permissions utilisateur

### Gestion des erreurs
- Fallback automatique vers des formulaires par défaut
- Messages d'erreur informatifs
- Logging complet des erreurs

## 📊 Monitoring et logs

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

## 🧪 Tests

### Tests unitaires
```bash
npm test
```

### Tests d'intégration
```bash
node test-gemini.js
```

### Tests de charge
```bash
# Utiliser des outils comme Artillery ou K6
artillery run gemini-load-test.yml
```

## 🔍 Dépannage

### Problèmes courants

1. **Erreur "Service Gemini non configuré"**
   - Vérifiez que `GEMINI_API_KEY` est défini dans `.env`
   - Redémarrez le serveur après modification

2. **Erreur "Token d'authentification requis"**
   - Obtenez un token JWT valide via `/api/auth/login`
   - Incluez le token dans l'en-tête `Authorization`

3. **Erreur "Trop de requêtes"**
   - Attendez avant de faire une nouvelle requête
   - Vérifiez les limites de quota Gemini

4. **Erreur de génération**
   - Vérifiez que la description est suffisamment détaillée
   - Essayez avec des instructions plus simples

### Logs de débogage

Activez les logs de débogage :
```bash
DEBUG=gemini:* npm start
```

## 📖 Documentation API complète

Consultez la documentation Swagger complète :
- URL : http://localhost:3000/api-docs
- Section : "Gemini AI"

## 🤝 Contribution

### Ajout de nouvelles fonctionnalités

1. Créez une branche feature
2. Implémentez la fonctionnalité
3. Ajoutez les tests
4. Mettez à jour la documentation
5. Créez une pull request

### Structure des fichiers

```
src/
├── services/
│   └── geminiService.js          # Service principal Gemini
├── routes/
│   └── gemini.js                 # Routes de l'API
├── middleware/
│   └── geminiValidation.js       # Validation des requêtes
└── utils/
    └── formGenerator.js          # Utilitaires de génération
```

## 📞 Support

- Documentation : [README_GEMINI.md](./README_GEMINI.md)
- Issues : [GitHub Issues](https://github.com/your-repo/issues)
- Email : support@dynamicforms.com

---

*Dernière mise à jour : Janvier 2024*
