# Exemple d'utilisation du Modal de Succès

## Endpoint de mise à jour

### PATCH /api/forms/{id}/success-modal

Mettre à jour les paramètres du modal de succès pour un formulaire.

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Exemple de requête

```bash
curl -X PATCH "http://localhost:3000/api/forms/123e4567-e89b-12d3-a456-426614174000/success-modal" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "successModal": {
      "title": "Félicitations !",
      "description": "Votre formulaire a été soumis avec succès. Nous vous recontacterons dans les plus brefs délais.",
      "actions": [
        {
          "name": "Voir les résultats",
          "url": "https://example.com/results"
        },
        {
          "name": "Télécharger PDF",
          "url": "https://example.com/download"
        }
      ],
      "closeEnabled": true,
      "returnHomeEnabled": true,
      "resubmitEnabled": false
    }
  }'
```

#### Exemple de réponse

```json
{
  "success": true,
  "message": "Modal de succès mis à jour avec succès",
  "data": {
    "form": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Formulaire de contact",
      "description": "Formulaire pour nous contacter",
      "slug": "formulaire-contact-abc123",
      "status": "active",
      "successModal": {
        "title": "Félicitations !",
        "description": "Votre formulaire a été soumis avec succès. Nous vous recontacterons dans les plus brefs délais.",
        "actions": [
          {
            "name": "Voir les résultats",
            "url": "https://example.com/results"
          },
          {
            "name": "Télécharger PDF",
            "url": "https://example.com/download"
          }
        ],
        "closeEnabled": true,
        "returnHomeEnabled": true,
        "resubmitEnabled": false
      },
      "steps": [...],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

## Structure des données

### SuccessModalSettings

```typescript
interface SuccessModalSettings {
  title: string;                    // Titre du modal (requis, 1-100 caractères)
  description?: string;             // Description du modal (optionnel, max 500 caractères)
  actions?: SuccessModalAction[];   // Actions personnalisées (optionnel)
  closeEnabled?: boolean;           // Permettre la fermeture (défaut: true)
  returnHomeEnabled?: boolean;      // Bouton retour accueil (défaut: true)
  resubmitEnabled?: boolean;        // Permettre resoumission (défaut: false)
}
```

### SuccessModalAction

```typescript
interface SuccessModalAction {
  name: string;     // Nom du bouton (requis, 1-50 caractères)
  url?: string;     // URL de destination (optionnel, doit être valide)
}
```

## Exemples de configurations

### Modal simple
```json
{
  "successModal": {
    "title": "Merci !",
    "description": "Votre message a été envoyé avec succès.",
    "closeEnabled": true,
    "returnHomeEnabled": true,
    "resubmitEnabled": false
  }
}
```

### Modal avec actions personnalisées
```json
{
  "successModal": {
    "title": "Inscription réussie !",
    "description": "Votre compte a été créé avec succès. Vous pouvez maintenant accéder à votre espace personnel.",
    "actions": [
      {
        "name": "Se connecter",
        "url": "https://example.com/login"
      },
      {
        "name": "Voir le profil",
        "url": "https://example.com/profile"
      }
    ],
    "closeEnabled": true,
    "returnHomeEnabled": false,
    "resubmitEnabled": false
  }
}
```

### Modal pour formulaire de sondage
```json
{
  "successModal": {
    "title": "Sondage terminé !",
    "description": "Merci d'avoir participé à notre sondage. Vos réponses nous aideront à améliorer nos services.",
    "actions": [
      {
        "name": "Voir les statistiques",
        "url": "https://example.com/survey/stats"
      }
    ],
    "closeEnabled": true,
    "returnHomeEnabled": true,
    "resubmitEnabled": true
  }
}
```

## Codes d'erreur

- **400** : Données de validation invalides
- **401** : Token d'authentification invalide
- **403** : Accès refusé (pas le propriétaire du formulaire)
- **404** : Formulaire non trouvé
- **500** : Erreur serveur

## Validation

- Le titre est requis et doit contenir entre 1 et 100 caractères
- La description est optionnelle et ne peut pas dépasser 500 caractères
- Les actions sont optionnelles et chaque action doit avoir un nom valide
- Les URLs des actions doivent être des URLs valides (http ou https)
- Tous les champs booléens sont optionnels et par défaut à `true` pour `closeEnabled` et `returnHomeEnabled`, `false` pour `resubmitEnabled`
