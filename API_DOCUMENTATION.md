# Documentation API Dynamic Forms

## Vue d'ensemble

Cette API permet de gérer des formulaires dynamiques avec authentification et soumissions. Elle est documentée avec Swagger/OpenAPI 3.0.

## Accès à la documentation

### Interface Swagger UI
- **URL de développement** : http://localhost:3000/api-docs
- **URL de production** : https://api.dynamicforms.com/api-docs

### Documentation JSON
- **URL de développement** : http://localhost:3000/api-docs.json
- **URL de production** : https://api.dynamicforms.com/api-docs.json

## Démarrage rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration de l'environnement
Copiez le fichier `env.example` vers `.env` et configurez vos variables :
```bash
cp env.example .env
```

### 3. Démarrage du serveur
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

### 4. Accès à la documentation
Ouvrez votre navigateur et allez sur : http://localhost:3000/api-docs

## Authentification

L'API utilise l'authentification JWT (JSON Web Token). Pour utiliser les endpoints protégés :

1. **Inscription** : `POST /api/auth/register`
2. **Connexion** : `POST /api/auth/login`
3. **Utilisation du token** : Ajoutez l'en-tête `Authorization: Bearer <votre_token>`

## Endpoints principaux

### Authentification (`/api/auth`)
- `POST /register` - Enregistrer un nouvel utilisateur
- `POST /login` - Connexion utilisateur
- `GET /profile` - Obtenir le profil utilisateur
- `PUT /profile` - Mettre à jour le profil
- `PUT /change-password` - Changer le mot de passe
- `GET /users` - Lister tous les utilisateurs (admin)
- `DELETE /users/:id` - Supprimer un utilisateur (admin)

### Formulaires (`/api/forms`)
- `GET /` - Lister tous les formulaires
- `GET /:id` - Obtenir un formulaire par ID
- `GET /slug/:slug` - Obtenir un formulaire par slug (public)
- `POST /` - Créer un nouveau formulaire
- `PUT /:id` - Mettre à jour un formulaire
- `PUT /:id/steps` - Mettre à jour les étapes d'un formulaire
- `PUT /:id/marketing` - Mettre à jour les paramètres marketing
- `DELETE /:id` - Supprimer un formulaire
- `GET /:id/submissions` - Obtenir les soumissions d'un formulaire
- `GET /:id/stats` - Obtenir les statistiques d'un formulaire

### Soumissions (`/api/submissions`)
- `POST /` - Soumettre un formulaire
- `GET /` - Lister toutes les soumissions (admin)
- `GET /:id` - Obtenir une soumission par ID
- `GET /user/my-submissions` - Obtenir les soumissions de l'utilisateur
- `GET /stats/overview` - Statistiques générales (admin)
- `GET /stats/date-range` - Soumissions par plage de dates (admin)
- `DELETE /:id` - Supprimer une soumission (admin)

### Santé du serveur (`/health`)
- `GET /health` - Vérifier l'état du serveur

## Modèles de données

### User
```json
{
  "id": 1,
  "name": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "role": "user",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Form
```json
{
  "id": 1,
  "title": "Formulaire de contact",
  "description": "Formulaire pour nous contacter",
  "slug": "formulaire-contact-abc123",
  "steps": [...],
  "isActive": true,
  "requireAuthentication": false,
  "allowMultipleSubmissions": true,
  "userId": 1,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### FormSubmission
```json
{
  "id": 1,
  "formId": 1,
  "userId": 1,
  "data": {
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "message": "Bonjour"
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

## Codes de statut HTTP

- `200` - Succès
- `201` - Créé avec succès
- `400` - Requête invalide
- `401` - Non autorisé
- `403` - Accès refusé
- `404` - Non trouvé
- `409` - Conflit
- `500` - Erreur serveur

## Limitation de débit

L'API implémente une limitation de débit pour éviter les abus :
- **Général** : 100 requêtes par 15 minutes
- **Authentification** : 5 tentatives par 15 minutes
- **Soumissions** : 10 soumissions par 15 minutes
- **API** : 1000 requêtes par 15 minutes

## Gestion des erreurs

Toutes les réponses d'erreur suivent ce format :
```json
{
  "success": false,
  "message": "Description de l'erreur"
}
```

## Exemples d'utilisation

### 1. Inscription d'un utilisateur
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "password": "motdepasse123"
  }'
```

### 2. Connexion
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean.dupont@example.com",
    "password": "motdepasse123"
  }'
```

### 3. Création d'un formulaire
```bash
curl -X POST http://localhost:3000/api/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <votre_token>" \
  -d '{
    "title": "Formulaire de contact",
    "description": "Formulaire pour nous contacter",
    "steps": [
      {
        "id": "step1",
        "title": "Informations personnelles",
        "fields": [
          {
            "id": "name",
            "type": "text",
            "label": "Nom",
            "required": true
          },
          {
            "id": "email",
            "type": "email",
            "label": "Email",
            "required": true
          }
        ]
      }
    ]
  }'
```

### 4. Soumission d'un formulaire
```bash
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "formulaire-contact-abc123",
    "data": {
      "name": "Jean Dupont",
      "email": "jean.dupont@example.com",
      "message": "Bonjour, je souhaite vous contacter"
    }
  }'
```

## Support

Pour toute question ou problème, contactez l'équipe de développement à : support@dynamicforms.com

