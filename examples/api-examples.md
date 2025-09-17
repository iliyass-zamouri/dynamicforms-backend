# Exemples d'utilisation de l'API Dynamic Forms

## Authentification

### 1. Inscription d'un utilisateur

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "password": "motdepasse123",
    "role": "user"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "data": {
    "user": {
      "id": 1,
      "name": "Jean Dupont",
      "email": "jean.dupont@example.com",
      "role": "user",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
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

**Réponse :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": 1,
      "name": "Jean Dupont",
      "email": "jean.dupont@example.com",
      "role": "user",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Gestion des formulaires

### 3. Créer un formulaire

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
        "description": "Veuillez remplir vos informations",
        "fields": [
          {
            "id": "name",
            "type": "text",
            "label": "Nom complet",
            "placeholder": "Votre nom complet",
            "required": true,
            "validation": {
              "minLength": 2,
              "maxLength": 100
            }
          },
          {
            "id": "email",
            "type": "email",
            "label": "Adresse email",
            "placeholder": "votre@email.com",
            "required": true
          },
          {
            "id": "phone",
            "type": "text",
            "label": "Téléphone",
            "placeholder": "+33 1 23 45 67 89",
            "required": false
          }
        ]
      },
      {
        "id": "step2",
        "title": "Message",
        "description": "Décrivez votre demande",
        "fields": [
          {
            "id": "subject",
            "type": "select",
            "label": "Sujet",
            "required": true,
            "options": [
              "Question générale",
              "Support technique",
              "Demande de devis",
              "Autre"
            ]
          },
          {
            "id": "message",
            "type": "textarea",
            "label": "Message",
            "placeholder": "Décrivez votre demande en détail...",
            "required": true,
            "validation": {
              "minLength": 10,
              "maxLength": 1000
            }
          }
        ]
      }
    ],
    "isActive": true,
    "requireAuthentication": false,
    "allowMultipleSubmissions": true
  }'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Formulaire créé avec succès",
  "data": {
    "form": {
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
  }
}
```

### 4. Obtenir un formulaire par slug (public)

```bash
curl -X GET http://localhost:3000/api/forms/slug/formulaire-contact-abc123
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "form": {
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
  }
}
```

## Soumission de formulaires

### 5. Soumettre un formulaire

```bash
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "formulaire-contact-abc123",
    "data": {
      "name": "Marie Martin",
      "email": "marie.martin@example.com",
      "phone": "+33 1 23 45 67 89",
      "subject": "Question générale",
      "message": "Bonjour, j'aimerais avoir des informations sur vos services. Pouvez-vous me contacter ?"
    }
  }'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Formulaire soumis avec succès",
  "data": {
    "submission": {
      "id": 1,
      "formId": 1,
      "userId": null,
      "data": {
        "name": "Marie Martin",
        "email": "marie.martin@example.com",
        "phone": "+33 1 23 45 67 89",
        "subject": "Question générale",
        "message": "Bonjour, j'aimerais avoir des informations sur vos services. Pouvez-vous me contacter ?"
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 6. Obtenir les soumissions d'un formulaire

```bash
curl -X GET http://localhost:3000/api/forms/1/submissions \
  -H "Authorization: Bearer <votre_token>"
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "submissions": [
      {
        "id": 1,
        "formId": 1,
        "userId": null,
        "data": {
          "name": "Marie Martin",
          "email": "marie.martin@example.com",
          "phone": "+33 1 23 45 67 89",
          "subject": "Question générale",
          "message": "Bonjour, j'aimerais avoir des informations sur vos services. Pouvez-vous me contacter ?"
        },
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

## Gestion des utilisateurs (Admin)

### 7. Lister tous les utilisateurs

```bash
curl -X GET http://localhost:3000/api/auth/users \
  -H "Authorization: Bearer <token_admin>"
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Jean Dupont",
        "email": "jean.dupont@example.com",
        "role": "user",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

## Statistiques

### 8. Obtenir les statistiques d'un formulaire

```bash
curl -X GET http://localhost:3000/api/forms/1/stats \
  -H "Authorization: Bearer <votre_token>"
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalSubmissions": 1,
      "submissionsToday": 1,
      "submissionsThisWeek": 1,
      "submissionsThisMonth": 1,
      "averageSubmissionsPerDay": 1,
      "conversionRate": 100
    }
  }
}
```

## Gestion des erreurs

### Exemple d'erreur d'authentification

```bash
curl -X GET http://localhost:3000/api/forms \
  -H "Authorization: Bearer token_invalide"
```

**Réponse :**
```json
{
  "success": false,
  "message": "Token d'authentification invalide"
}
```

### Exemple d'erreur de validation

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "email_invalide",
    "password": "123"
  }'
```

**Réponse :**
```json
{
  "success": false,
  "message": "Email invalide"
}
```

## Notes importantes

1. **Authentification** : La plupart des endpoints nécessitent un token JWT valide dans l'en-tête `Authorization: Bearer <token>`

2. **Rate Limiting** : L'API implémente une limitation de débit pour éviter les abus

3. **Validation** : Tous les champs sont validés côté serveur avant traitement

4. **Pagination** : Les endpoints de liste supportent la pagination avec les paramètres `limit` et `offset`

5. **Environnements** : L'API s'adapte automatiquement à l'environnement (développement, staging, production)

