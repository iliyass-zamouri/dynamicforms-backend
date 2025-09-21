# Documentation d'intégration du Chatbot AI Gemini - Frontend

## Vue d'ensemble

Cette documentation explique comment intégrer le système de chatbot AI Gemini dans le frontend de l'application Dynamic Forms. Le système permet aux utilisateurs d'interagir avec l'IA pour générer, modifier et analyser des formulaires, avec sauvegarde automatique de toutes les conversations.

## Table des matières

1. [Architecture du système](#architecture-du-système)
2. [Authentification](#authentification)
3. [Endpoints API](#endpoints-api)
4. [Intégration Frontend](#intégration-frontend)
5. [Gestion des conversations](#gestion-des-conversations)
6. [Exemples d'implémentation](#exemples-dimplémentation)
7. [Gestion des erreurs](#gestion-des-erreurs)
8. [Bonnes pratiques](#bonnes-pratiques)

## Architecture du système

```
Frontend (React/Vue/Angular)
    ↓
API Backend (Node.js/Express)
    ↓
Service Gemini AI
    ↓
Base de données (MySQL)
    ├── gemini_conversations
    ├── gemini_sessions
    └── forms
```

## Authentification

Tous les endpoints nécessitent une authentification JWT. Incluez le token dans l'en-tête `Authorization`.

```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## Endpoints API

### 1. Génération de formulaire

**Endpoint:** `POST /api/gemini/generate`

**Description:** Génère un nouveau formulaire basé sur une description textuelle.

**Paramètres:**
- `description` (string, requis) : Description du formulaire souhaité
- `options` (object, optionnel) : Options de génération
- `formId` (string, optionnel) : ID du formulaire existant à modifier
- `sessionId` (string, optionnel) : ID de la session de conversation

**Exemple cURL:**
```bash
curl -X POST http://localhost:3000/api/gemini/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Créer un formulaire de contact avec nom, email, téléphone et message",
    "options": {
      "theme": "modern",
      "primaryColor": "#3b82f6",
      "includeMarketing": true
    }
  }'
```

**Réponse de succès (200):**
```json
{
  "success": true,
  "data": {
    "form": {
      "id": "uuid-form-id",
      "title": "Formulaire de contact",
      "description": "Contactez-nous via ce formulaire",
      "steps": [...],
      "theme": "modern",
      "primaryColor": "#3b82f6"
    },
    "suggestions": ["Suggestion 1", "Suggestion 2"],
    "generatedBy": "gemini",
    "sessionId": "uuid-session-id",
    "conversationId": "uuid-conversation-id",
    "isNewForm": true
  },
  "message": "Formulaire généré avec succès"
}
```

**Réponses d'erreur:**

**400 - Erreur de validation:**
```json
{
  "success": false,
  "message": "Échec de la validation",
  "errors": [
    {
      "field": "description",
      "message": "La description doit contenir entre 10 et 2000 caractères",
      "value": "test"
    }
  ]
}
```

**401 - Non autorisé:**
```json
{
  "success": false,
  "message": "Token d'authentification requis"
}
```

**403 - Accès refusé:**
```json
{
  "success": false,
  "message": "Vous n'avez pas les permissions pour effectuer cette action"
}
```

**429 - Trop de requêtes:**
```json
{
  "success": false,
  "message": "Trop de requêtes Gemini, veuillez attendre avant de réessayer"
}
```

**500 - Erreur serveur:**
```json
{
  "success": false,
  "message": "Erreur lors de la génération du formulaire",
  "error": "Erreur de génération: Service Gemini indisponible"
}
```

**503 - Service indisponible:**
```json
{
  "success": false,
  "message": "Service Gemini temporairement indisponible",
  "retryAfter": 30
}
```

### 2. Modification de formulaire

**Endpoint:** `POST /api/gemini/modify`

**Description:** Modifie un formulaire existant basé sur des instructions.

**Paramètres:**
- `formId` (string, requis) : ID du formulaire à modifier
- `instructions` (string, requis) : Instructions de modification
- `options` (object, optionnel) : Options de modification
- `sessionId` (string, optionnel) : ID de la session de conversation

**Exemple cURL:**
```bash
curl -X POST http://localhost:3000/api/gemini/modify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "uuid-form-id",
    "instructions": "Ajouter un champ téléphone et changer le thème en dark",
    "options": {
      "preserveData": true
    },
    "sessionId": "uuid-session-id"
  }'
```

**Réponse de succès (200):**
```json
{
  "success": true,
  "data": {
    "form": {
      "id": "uuid-form-id",
      "title": "Formulaire de contact modifié",
      "steps": [...]
    },
    "suggestions": ["Suggestion 1"],
    "changes": ["Ajout du champ téléphone", "Changement de thème"],
    "generatedBy": "gemini",
    "sessionId": "uuid-session-id"
  },
  "message": "Formulaire modifié avec succès"
}
```

**Réponses d'erreur:**

**400 - Erreur de validation:**
```json
{
  "success": false,
  "message": "Échec de la validation",
  "errors": [
    {
      "field": "instructions",
      "message": "Les instructions sont requises",
      "value": ""
    },
    {
      "field": "formId",
      "message": "L'ID du formulaire est requis",
      "value": ""
    }
  ]
}
```

**401 - Non autorisé:**
```json
{
  "success": false,
  "message": "Token d'authentification requis"
}
```

**403 - Accès refusé:**
```json
{
  "success": false,
  "message": "Vous n'avez pas les permissions pour modifier ce formulaire"
}
```

**404 - Formulaire non trouvé:**
```json
{
  "success": false,
  "message": "Formulaire non trouvé"
}
```

**429 - Trop de requêtes:**
```json
{
  "success": false,
  "message": "Trop de requêtes Gemini, veuillez attendre avant de réessayer"
}
```

**500 - Erreur serveur:**
```json
{
  "success": false,
  "message": "Erreur lors de la modification du formulaire",
  "error": "Erreur de modification: Service Gemini indisponible"
}
```

### 3. Analyse de formulaire

**Endpoint:** `POST /api/gemini/analyze`

**Description:** Analyse un formulaire et fournit des suggestions d'amélioration.

**Paramètres:**
- `formId` (string, requis) : ID du formulaire à analyser
- `analysisType` (string, requis) : Type d'analyse (comprehensive, accessibility, ux, conversion, seo)
- `sessionId` (string, optionnel) : ID de la session de conversation

**Exemple cURL:**
```bash
curl -X POST http://localhost:3000/api/gemini/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "uuid-form-id",
    "analysisType": "comprehensive",
    "sessionId": "uuid-session-id"
  }'
```

**Réponse de succès (200):**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "accessibility": "Score: 8/10 - Description...",
      "ux": "Score: 7/10 - Description...",
      "conversion": "Score: 9/10 - Description...",
      "seo": "Score: 6/10 - Description..."
    },
    "recommendations": ["Recommandation 1", "Recommandation 2"],
    "suggestedImprovements": [
      {
        "type": "field",
        "suggestion": "Ajouter un champ téléphone",
        "priority": "high",
        "impact": "Améliore l'expérience utilisateur"
      }
    ],
    "sessionId": "uuid-session-id"
  },
  "message": "Analyse terminée avec succès"
}
```

**Réponses d'erreur:**

**400 - Erreur de validation:**
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    "Type d'analyse invalide. Valeurs autorisées: comprehensive, accessibility, ux, conversion, seo"
  ]
}
```

**401 - Non autorisé:**
```json
{
  "success": false,
  "message": "Token d'authentification requis"
}
```

**403 - Accès refusé:**
```json
{
  "success": false,
  "message": "Vous n'avez pas les permissions pour analyser ce formulaire"
}
```

**404 - Formulaire non trouvé:**
```json
{
  "success": false,
  "message": "Formulaire non trouvé"
}
```

**429 - Trop de requêtes:**
```json
{
  "success": false,
  "message": "Trop de requêtes Gemini, veuillez attendre avant de réessayer"
}
```

**500 - Erreur serveur:**
```json
{
  "success": false,
  "message": "Erreur lors de l'analyse du formulaire",
  "error": "Erreur d'analyse: Service Gemini indisponible"
}
```

### 4. Santé du service

**Endpoint:** `GET /api/gemini/health`

**Description:** Vérifie l'état du service Gemini.

**Exemple cURL:**
```bash
curl -X GET http://localhost:3000/api/gemini/health
```

**Réponse de succès (200):**
```json
{
  "success": true,
  "message": "Service Gemini opérationnel",
  "status": "healthy",
  "timestamp": "2025-09-21T02:00:00.000Z",
  "response": "OK"
}
```

**Réponses d'erreur:**

**500 - Service indisponible:**
```json
{
  "success": false,
  "message": "Service Gemini indisponible",
  "status": "unhealthy",
  "timestamp": "2025-09-21T02:00:00.000Z",
  "error": "Erreur de connexion à l'API Gemini"
}
```

**503 - Service temporairement indisponible:**
```json
{
  "success": false,
  "message": "Service Gemini temporairement indisponible",
  "status": "maintenance",
  "timestamp": "2025-09-21T02:00:00.000Z",
  "retryAfter": 300
}
```

## Gestion des conversations

### 1. Récupérer toutes les conversations

**Endpoint:** `GET /api/conversations`

**Paramètres de requête:**
- `limit` (number, optionnel) : Nombre d'éléments par page (défaut: 50)
- `offset` (number, optionnel) : Décalage de pagination (défaut: 0)
- `type` (string, optionnel) : Filtrer par type (generate, modify, analyze, chat)
- `formId` (string, optionnel) : Filtrer par ID de formulaire

**Exemple cURL:**
```bash
curl -X GET "http://localhost:3000/api/conversations?limit=20&type=generate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Réponse de succès (200):**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "uuid-conversation-id",
        "userId": "uuid-user-id",
        "sessionId": "uuid-session-id",
        "conversationType": "generate",
        "formId": "uuid-form-id",
        "userMessage": "Créer un formulaire de contact",
        "geminiResponse": "Réponse de Gemini...",
        "promptUsed": "Prompt technique...",
        "responseMetadata": {...},
        "tokensUsed": 150,
        "processingTimeMs": 1200,
        "createdAt": "2025-09-21T02:00:00.000Z",
        "updatedAt": "2025-09-21T02:00:00.000Z"
      }
    ]
  }
}
```

**Réponses d'erreur:**

**400 - Paramètres invalides:**
```json
{
  "success": false,
  "message": "Paramètres de requête invalides",
  "errors": [
    {
      "field": "limit",
      "message": "La limite doit être entre 1 et 100",
      "value": "150"
    }
  ]
}
```

**401 - Non autorisé:**
```json
{
  "success": false,
  "message": "Token d'authentification requis"
}
```

**500 - Erreur serveur:**
```json
{
  "success": false,
  "message": "Erreur interne du serveur"
}
```

### 2. Récupérer les sessions de conversation

**Endpoint:** `GET /api/conversations/sessions`

**Exemple cURL:**
```bash
curl -X GET "http://localhost:3000/api/conversations/sessions?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Réponse de succès (200):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid-session-id",
        "userId": "uuid-user-id",
        "title": "Génération: Formulaire de contact",
        "description": "Session de génération de formulaire...",
        "isActive": true,
        "createdAt": "2025-09-21T02:00:00.000Z",
        "updatedAt": "2025-09-21T02:00:00.000Z"
      }
    ]
  }
}
```

**Réponses d'erreur:**

**400 - Paramètres invalides:**
```json
{
  "success": false,
  "message": "Paramètres de requête invalides",
  "errors": [
    {
      "field": "limit",
      "message": "La limite doit être entre 1 et 100",
      "value": "150"
    }
  ]
}
```

**401 - Non autorisé:**
```json
{
  "success": false,
  "message": "Token d'authentification requis"
}
```

**500 - Erreur serveur:**
```json
{
  "success": false,
  "message": "Erreur interne du serveur"
}
```

### 3. Récupérer les conversations d'une session

**Endpoint:** `GET /api/conversations/sessions/:sessionId`

**Exemple cURL:**
```bash
curl -X GET "http://localhost:3000/api/conversations/sessions/uuid-session-id" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Réponse de succès (200):**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid-session-id",
      "userId": "uuid-user-id",
      "title": "Génération: Formulaire de contact",
      "description": "Session de génération de formulaire...",
      "isActive": true,
      "createdAt": "2025-09-21T02:00:00.000Z",
      "updatedAt": "2025-09-21T02:00:00.000Z"
    },
    "conversations": [
      {
        "id": "uuid-conversation-id",
        "userId": "uuid-user-id",
        "sessionId": "uuid-session-id",
        "conversationType": "generate",
        "formId": "uuid-form-id",
        "userMessage": "Créer un formulaire de contact",
        "geminiResponse": "Réponse de Gemini...",
        "createdAt": "2025-09-21T02:00:00.000Z"
      }
    ]
  }
}
```

**Réponses d'erreur:**

**400 - Paramètres invalides:**
```json
{
  "success": false,
  "message": "Paramètres de requête invalides",
  "errors": [
    {
      "field": "sessionId",
      "message": "L'ID de session doit être un UUID valide",
      "value": "invalid-id"
    }
  ]
}
```

**401 - Non autorisé:**
```json
{
  "success": false,
  "message": "Token d'authentification requis"
}
```

**404 - Session non trouvée:**
```json
{
  "success": false,
  "message": "Session non trouvée"
}
```

**500 - Erreur serveur:**
```json
{
  "success": false,
  "message": "Erreur interne du serveur"
}
```

### 4. Statistiques des conversations

**Endpoint:** `GET /api/conversations/stats`

**Exemple cURL:**
```bash
curl -X GET http://localhost:3000/api/conversations/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Réponse de succès (200):**
```json
{
  "success": true,
  "data": {
    "stats": [
      {
        "conversation_type": "generate",
        "total_conversations": 15,
        "total_tokens": "2500",
        "avg_processing_time": "1200.50",
        "last_conversation": "2025-09-21T02:00:00.000Z"
      }
    ]
  }
}
```

**Réponses d'erreur:**

**401 - Non autorisé:**
```json
{
  "success": false,
  "message": "Token d'authentification requis"
}
```

**500 - Erreur serveur:**
```json
{
  "success": false,
  "message": "Erreur interne du serveur"
}
```

## Intégration Frontend

### 1. Service API (JavaScript/TypeScript)

```javascript
class GeminiAIService {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async generateForm(description, options = {}, formId = null, sessionId = null) {
    const response = await fetch(`${this.baseURL}/api/gemini/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description,
        options,
        formId,
        sessionId
      })
    });

    return await response.json();
  }

  async modifyForm(formId, instructions, options = {}, sessionId = null) {
    const response = await fetch(`${this.baseURL}/api/gemini/modify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        formId,
        instructions,
        options,
        sessionId
      })
    });

    return await response.json();
  }

  async analyzeForm(formId, analysisType = 'comprehensive', sessionId = null) {
    const response = await fetch(`${this.baseURL}/api/gemini/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        formId,
        analysisType,
        sessionId
      })
    });

    return await response.json();
  }

  async getConversations(limit = 50, offset = 0, type = null, formId = null) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (type) params.append('type', type);
    if (formId) params.append('formId', formId);

    const response = await fetch(`${this.baseURL}/api/conversations?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    return await response.json();
  }

  async getSessions(limit = 50, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    const response = await fetch(`${this.baseURL}/api/conversations/sessions?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    return await response.json();
  }

  async getSessionConversations(sessionId, limit = 50, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    const response = await fetch(`${this.baseURL}/api/conversations/sessions/${sessionId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    return await response.json();
  }

  async getStats() {
    const response = await fetch(`${this.baseURL}/api/conversations/stats`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    return await response.json();
  }
}
```

### 2. Hook React personnalisé

```javascript
import { useState, useCallback } from 'react';

export const useGeminiAI = (token) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);

  const geminiService = new GeminiAIService(process.env.REACT_APP_API_URL, token);

  const generateForm = useCallback(async (description, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await geminiService.generateForm(description, options, null, currentSession);
      
      if (result.success) {
        setCurrentSession(result.data.sessionId);
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [geminiService, currentSession]);

  const modifyForm = useCallback(async (formId, instructions, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await geminiService.modifyForm(formId, instructions, options, currentSession);
      
      if (result.success) {
        setCurrentSession(result.data.sessionId);
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [geminiService, currentSession]);

  const analyzeForm = useCallback(async (formId, analysisType = 'comprehensive') => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await geminiService.analyzeForm(formId, analysisType, currentSession);
      
      if (result.success) {
        setCurrentSession(result.data.sessionId);
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [geminiService, currentSession]);

  return {
    loading,
    error,
    currentSession,
    generateForm,
    modifyForm,
    analyzeForm,
    setCurrentSession
  };
};
```

### 3. Composant React de chat

```jsx
import React, { useState, useEffect } from 'react';
import { useGeminiAI } from './hooks/useGeminiAI';

const GeminiChatbot = ({ formId, token }) => {
  const { loading, error, currentSession, generateForm, modifyForm, analyzeForm } = useGeminiAI(token);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/conversations?formId=${formId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.data.conversations);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des conversations:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      let result;
      
      if (inputMessage.toLowerCase().includes('générer') || inputMessage.toLowerCase().includes('créer')) {
        result = await generateForm(inputMessage);
      } else if (inputMessage.toLowerCase().includes('modifier') || inputMessage.toLowerCase().includes('changer')) {
        result = await modifyForm(formId, inputMessage);
      } else if (inputMessage.toLowerCase().includes('analyser') || inputMessage.toLowerCase().includes('améliorer')) {
        result = await analyzeForm(formId);
      } else {
        // Par défaut, traiter comme une modification
        result = await modifyForm(formId, inputMessage);
      }

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: result.form ? 'Formulaire mis à jour avec succès!' : 'Analyse terminée!',
        timestamp: new Date(),
        data: result
      };

      setMessages(prev => [...prev, aiMessage]);
      loadConversations(); // Recharger les conversations
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: `Erreur: ${err.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div className="gemini-chatbot">
      <div className="chat-header">
        <h3>Assistant IA Gemini</h3>
        <div className="session-info">
          Session: {currentSession ? currentSession.substring(0, 8) + '...' : 'Nouvelle'}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              {message.content}
            </div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
            {message.data && (
              <div className="message-data">
                <pre>{JSON.stringify(message.data, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="message ai loading">
            <div className="message-content">
              L'IA réfléchit...
            </div>
          </div>
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Décrivez ce que vous voulez faire avec le formulaire..."
          disabled={loading}
        />
        <button onClick={handleSendMessage} disabled={loading || !inputMessage.trim()}>
          Envoyer
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="conversation-history">
        <h4>Historique des conversations</h4>
        {conversations.map(conv => (
          <div key={conv.id} className="conversation-item">
            <div className="conv-type">{conv.conversationType}</div>
            <div className="conv-message">{conv.userMessage}</div>
            <div className="conv-timestamp">
              {new Date(conv.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeminiChatbot;
```

### 4. Styles CSS

```css
.gemini-chatbot {
  display: flex;
  flex-direction: column;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.session-info {
  font-size: 12px;
  color: #666;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
  max-width: 80%;
}

.message.user {
  background: #e3f2fd;
  margin-left: auto;
}

.message.ai {
  background: #f1f8e9;
}

.message.error {
  background: #ffebee;
  color: #c62828;
}

.message.loading {
  opacity: 0.7;
}

.message-content {
  margin-bottom: 4px;
}

.message-timestamp {
  font-size: 12px;
  color: #666;
}

.message-data {
  margin-top: 8px;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.chat-input {
  display: flex;
  padding: 16px;
  border-top: 1px solid #ddd;
}

.chat-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 8px;
}

.chat-input button {
  padding: 8px 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.chat-input button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  padding: 8px 16px;
  background: #ffebee;
  color: #c62828;
  border-top: 1px solid #ffcdd2;
}

.conversation-history {
  max-height: 200px;
  overflow-y: auto;
  padding: 16px;
  border-top: 1px solid #ddd;
  background: #f9f9f9;
}

.conversation-item {
  padding: 8px;
  margin-bottom: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #eee;
}

.conv-type {
  font-size: 12px;
  color: #2196f3;
  font-weight: bold;
}

.conv-message {
  margin: 4px 0;
  font-size: 14px;
}

.conv-timestamp {
  font-size: 12px;
  color: #666;
}
```

## Gestion des erreurs

### Codes d'erreur complets

#### Codes d'erreur HTTP

| Code | Description | Cause | Action recommandée |
|------|-------------|-------|-------------------|
| **200** | Succès | Requête traitée avec succès | - |
| **400** | Requête invalide | Données de validation invalides | Vérifier les paramètres |
| **401** | Non autorisé | Token manquant ou invalide | Rediriger vers login |
| **403** | Accès refusé | Permissions insuffisantes | Vérifier les droits |
| **404** | Non trouvé | Ressource inexistante | Vérifier l'ID |
| **409** | Conflit | Ressource déjà existante | Gérer le conflit |
| **422** | Entité non traitable | Données malformées | Corriger les données |
| **429** | Trop de requêtes | Rate limiting | Attendre et réessayer |
| **500** | Erreur serveur | Erreur interne | Contacter le support |
| **502** | Bad Gateway | Problème de communication | Réessayer plus tard |
| **503** | Service indisponible | Service en maintenance | Attendre la réparation |
| **504** | Gateway Timeout | Timeout de requête | Réessayer plus tard |

#### Erreurs spécifiques aux endpoints Gemini

**Génération de formulaire (`POST /api/gemini/generate`):**
- `400`: Description trop courte/longue, options invalides
- `401`: Token d'authentification manquant
- `403`: Permissions insuffisantes
- `429`: Limite de requêtes Gemini atteinte
- `500`: Erreur de génération, service Gemini indisponible
- `503`: Service Gemini en maintenance

**Modification de formulaire (`POST /api/gemini/modify`):**
- `400`: Instructions manquantes, formId invalide
- `401`: Token d'authentification manquant
- `403`: Pas de permission pour modifier ce formulaire
- `404`: Formulaire non trouvé
- `429`: Limite de requêtes Gemini atteinte
- `500`: Erreur de modification, service Gemini indisponible

**Analyse de formulaire (`POST /api/gemini/analyze`):**
- `400`: Type d'analyse invalide
- `401`: Token d'authentification manquant
- `403`: Pas de permission pour analyser ce formulaire
- `404`: Formulaire non trouvé
- `429`: Limite de requêtes Gemini atteinte
- `500`: Erreur d'analyse, service Gemini indisponible

**Santé du service (`GET /api/gemini/health`):**
- `500`: Service Gemini indisponible
- `503`: Service en maintenance

**Conversations (`GET /api/conversations`):**
- `400`: Paramètres de pagination invalides
- `401`: Token d'authentification manquant
- `500`: Erreur de base de données

**Sessions (`GET /api/conversations/sessions`):**
- `400`: Paramètres de pagination invalides
- `401`: Token d'authentification manquant
- `500`: Erreur de base de données

**Sessions spécifiques (`GET /api/conversations/sessions/:id`):**
- `400`: ID de session invalide
- `401`: Token d'authentification manquant
- `404`: Session non trouvée
- `500`: Erreur de base de données

**Statistiques (`GET /api/conversations/stats`):**
- `401`: Token d'authentification manquant
- `500`: Erreur de base de données

### Gestion des erreurs dans le frontend

```javascript
class ErrorHandler {
  static handleApiError(error, response) {
    const status = response?.status;
    const data = response?.data;

    switch (status) {
      case 400:
        this.handleValidationError(data);
        break;
      case 401:
        this.handleUnauthorizedError();
        break;
      case 403:
        this.handleForbiddenError(data);
        break;
      case 404:
        this.handleNotFoundError(data);
        break;
      case 409:
        this.handleConflictError(data);
        break;
      case 422:
        this.handleUnprocessableEntityError(data);
        break;
      case 429:
        this.handleRateLimitError(data);
        break;
      case 500:
        this.handleServerError(data);
        break;
      case 502:
        this.handleBadGatewayError();
        break;
      case 503:
        this.handleServiceUnavailableError(data);
        break;
      case 504:
        this.handleTimeoutError();
        break;
      default:
        this.handleGenericError(error, data);
    }
  }

  static handleValidationError(data) {
    if (data?.errors && Array.isArray(data.errors)) {
      const errorMessages = data.errors.map(err => 
        `${err.field}: ${err.message}`
      ).join(', ');
      showNotification(`Erreur de validation: ${errorMessages}`, 'error');
    } else {
      showNotification(data?.message || 'Données invalides', 'error');
    }
  }

  static handleUnauthorizedError() {
    showNotification('Session expirée, veuillez vous reconnecter', 'warning');
    // Rediriger vers la page de connexion
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  }

  static handleForbiddenError(data) {
    showNotification(
      data?.message || 'Vous n\'avez pas les permissions nécessaires', 
      'error'
    );
  }

  static handleNotFoundError(data) {
    showNotification(
      data?.message || 'Ressource non trouvée', 
      'warning'
    );
  }

  static handleConflictError(data) {
    showNotification(
      data?.message || 'Conflit détecté, veuillez réessayer', 
      'warning'
    );
  }

  static handleUnprocessableEntityError(data) {
    showNotification(
      data?.message || 'Données malformées', 
      'error'
    );
  }

  static handleRateLimitError(data) {
    const retryAfter = data?.retryAfter || 60;
    showNotification(
      `Trop de requêtes, veuillez attendre ${retryAfter} secondes`, 
      'warning'
    );
    // Désactiver les boutons pendant le délai
    this.disableButtonsFor(retryAfter * 1000);
  }

  static handleServerError(data) {
    showNotification(
      'Erreur serveur, veuillez réessayer plus tard', 
      'error'
    );
    // Logger l'erreur pour le support
    console.error('Server Error:', data);
  }

  static handleBadGatewayError() {
    showNotification(
      'Problème de communication avec le serveur', 
      'error'
    );
  }

  static handleServiceUnavailableError(data) {
    const retryAfter = data?.retryAfter || 300;
    showNotification(
      `Service temporairement indisponible, retry dans ${retryAfter}s`, 
      'warning'
    );
  }

  static handleTimeoutError() {
    showNotification(
      'La requête a expiré, veuillez réessayer', 
      'warning'
    );
  }

  static handleGenericError(error, data) {
    showNotification(
      data?.message || error?.message || 'Une erreur inattendue est survenue', 
      'error'
    );
  }

  static disableButtonsFor(duration) {
    const buttons = document.querySelectorAll('button[type="submit"]');
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.textContent = 'Attendez...';
    });

    setTimeout(() => {
      buttons.forEach(btn => {
        btn.disabled = false;
        btn.textContent = 'Envoyer';
      });
    }, duration);
  }
}

// Utilisation dans les composants
const handleApiCall = async (apiCall) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    ErrorHandler.handleApiError(error, error.response);
    throw error;
  }
};
```

### Gestion des erreurs spécifiques Gemini

```javascript
class GeminiErrorHandler {
  static handleGeminiError(error, context) {
    const { response } = error;
    const status = response?.status;
    const data = response?.data;

    switch (context) {
      case 'generate':
        this.handleGenerateError(status, data);
        break;
      case 'modify':
        this.handleModifyError(status, data);
        break;
      case 'analyze':
        this.handleAnalyzeError(status, data);
        break;
      default:
        ErrorHandler.handleApiError(error, response);
    }
  }

  static handleGenerateError(status, data) {
    switch (status) {
      case 400:
        if (data?.errors?.some(e => e.field === 'description')) {
          showNotification('Veuillez fournir une description plus détaillée du formulaire', 'warning');
        } else {
          ErrorHandler.handleValidationError(data);
        }
        break;
      case 429:
        showNotification('Limite de génération atteinte, veuillez attendre avant de créer un nouveau formulaire', 'warning');
        break;
      case 500:
        if (data?.error?.includes('Service Gemini indisponible')) {
          showNotification('Service IA temporairement indisponible, veuillez réessayer plus tard', 'error');
        } else {
          ErrorHandler.handleServerError(data);
        }
        break;
      default:
        ErrorHandler.handleApiError({ response: { status, data } });
    }
  }

  static handleModifyError(status, data) {
    switch (status) {
      case 400:
        if (data?.errors?.some(e => e.field === 'instructions')) {
          showNotification('Veuillez fournir des instructions plus précises pour la modification', 'warning');
        } else {
          ErrorHandler.handleValidationError(data);
        }
        break;
      case 404:
        showNotification('Formulaire non trouvé, veuillez actualiser la page', 'error');
        break;
      case 403:
        showNotification('Vous ne pouvez pas modifier ce formulaire', 'error');
        break;
      default:
        ErrorHandler.handleApiError({ response: { status, data } });
    }
  }

  static handleAnalyzeError(status, data) {
    switch (status) {
      case 400:
        if (data?.errors?.includes('Type d\'analyse invalide')) {
          showNotification('Type d\'analyse non supporté, veuillez choisir un type valide', 'warning');
        } else {
          ErrorHandler.handleValidationError(data);
        }
        break;
      case 404:
        showNotification('Formulaire non trouvé pour l\'analyse', 'error');
        break;
      default:
        ErrorHandler.handleApiError({ response: { status, data } });
    }
  }
}
```

### Retry automatique

```javascript
class RetryManager {
  static async retryWithBackoff(apiCall, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        const status = error.response?.status;
        
        // Ne pas retry pour certaines erreurs
        if ([400, 401, 403, 404, 422].includes(status)) {
          throw error;
        }

        if (attempt === maxRetries) {
          throw error;
        }

        // Calculer le délai avec backoff exponentiel
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Tentative ${attempt} échouée, retry dans ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

// Utilisation
const generateFormWithRetry = async (description, options) => {
  return await RetryManager.retryWithBackoff(
    () => geminiService.generateForm(description, options)
  );
};
```

## Bonnes pratiques

### 1. Gestion des sessions
- Maintenez une session active pour regrouper les conversations
- Permettez à l'utilisateur de créer de nouvelles sessions
- Affichez l'historique des sessions

### 2. UX/UI
- Affichez un indicateur de chargement pendant les requêtes
- Montrez des suggestions de commandes courantes
- Permettez l'annulation des requêtes en cours

### 3. Performance
- Implémentez la pagination pour les conversations
- Mettez en cache les réponses fréquentes
- Utilisez la déconnexion automatique pour les requêtes longues

### 4. Sécurité
- Validez toutes les entrées utilisateur
- Ne stockez jamais le token JWT dans le localStorage
- Implémentez la rotation des tokens

### 5. Monitoring
- Loggez les erreurs côté client
- Surveillez les métriques d'utilisation
- Implémentez des alertes pour les erreurs critiques

## Exemple d'utilisation complète

```jsx
import React from 'react';
import GeminiChatbot from './components/GeminiChatbot';

const FormEditor = () => {
  const [formId, setFormId] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  return (
    <div className="form-editor">
      <div className="form-preview">
        {/* Aperçu du formulaire */}
      </div>
      
      <div className="ai-assistant">
        <GeminiChatbot 
          formId={formId} 
          token={token}
          onFormUpdate={(updatedForm) => {
            // Mettre à jour l'aperçu du formulaire
            setFormId(updatedForm.id);
          }}
        />
      </div>
    </div>
  );
};

export default FormEditor;
```

## Tests et débogage

### Tests unitaires

```javascript
// Test du service Gemini
describe('GeminiAIService', () => {
  let service;
  let mockFetch;

  beforeEach(() => {
    service = new GeminiAIService('http://localhost:3000', 'test-token');
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  describe('generateForm', () => {
    it('devrait générer un formulaire avec succès', async () => {
      const mockResponse = {
        success: true,
        data: {
          form: { id: 'test-id', title: 'Test Form' },
          sessionId: 'session-id'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.generateForm('Test description');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/gemini/generate',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            description: 'Test description',
            options: {},
            formId: null,
            sessionId: null
          })
        })
      );
    });

    it('devrait gérer les erreurs de validation', async () => {
      const mockError = {
        success: false,
        message: 'Échec de la validation',
        errors: [
          {
            field: 'description',
            message: 'La description est requise',
            value: ''
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockError)
      });

      await expect(service.generateForm('')).rejects.toThrow();
    });
  });
});
```

### Tests d'intégration

```javascript
// Test d'intégration complet
describe('Intégration Gemini Chatbot', () => {
  let container;
  let chatbot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('devrait afficher les messages de conversation', async () => {
    // Mock des réponses API
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { conversations: [] }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            form: { id: 'test-form', title: 'Test Form' },
            sessionId: 'test-session'
          }
        })
      });

    // Rendre le composant
    chatbot = ReactDOM.render(
      <GeminiChatbot formId="test-form" token="test-token" />,
      container
    );

    // Simuler l'envoi d'un message
    const input = container.querySelector('input[type="text"]');
    const button = container.querySelector('button');

    input.value = 'Créer un formulaire de test';
    button.click();

    // Vérifier que le message utilisateur apparaît
    await waitFor(() => {
      const messages = container.querySelectorAll('.message');
      expect(messages.length).toBeGreaterThan(0);
    });
  });
});
```

### Outils de débogage

```javascript
// Logger pour le débogage
class GeminiDebugger {
  static logRequest(endpoint, data) {
    console.group(`🚀 Gemini API Request: ${endpoint}`);
    console.log('Data:', data);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  static logResponse(endpoint, response, duration) {
    console.group(`✅ Gemini API Response: ${endpoint}`);
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.log('Duration:', `${duration}ms`);
    console.groupEnd();
  }

  static logError(endpoint, error, duration) {
    console.group(`❌ Gemini API Error: ${endpoint}`);
    console.error('Error:', error);
    console.log('Duration:', `${duration}ms`);
    console.groupEnd();
  }

  static logConversation(conversation) {
    console.group(`💬 Conversation: ${conversation.conversationType}`);
    console.log('User Message:', conversation.userMessage);
    console.log('AI Response:', conversation.geminiResponse);
    console.log('Tokens Used:', conversation.tokensUsed);
    console.log('Processing Time:', `${conversation.processingTimeMs}ms`);
    console.groupEnd();
  }
}

// Wrapper pour les appels API avec logging
class DebuggedGeminiService extends GeminiAIService {
  async generateForm(description, options = {}, formId = null, sessionId = null) {
    const startTime = Date.now();
    const data = { description, options, formId, sessionId };
    
    GeminiDebugger.logRequest('POST /api/gemini/generate', data);
    
    try {
      const response = await super.generateForm(description, options, formId, sessionId);
      const duration = Date.now() - startTime;
      
      GeminiDebugger.logResponse('POST /api/gemini/generate', response, duration);
      
      if (response.data?.conversationId) {
        GeminiDebugger.logConversation({
          conversationType: 'generate',
          userMessage: description,
          geminiResponse: response.data.form?.title || 'Form generated',
          tokensUsed: response.data.tokensUsed || 0,
          processingTimeMs: duration
        });
      }
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      GeminiDebugger.logError('POST /api/gemini/generate', error, duration);
      throw error;
    }
  }
}
```

### Monitoring et métriques

```javascript
// Collecteur de métriques
class MetricsCollector {
  static collectApiMetrics(endpoint, success, duration, tokensUsed = 0) {
    const metrics = {
      endpoint,
      success,
      duration,
      tokensUsed,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Envoyer vers un service de monitoring (ex: Google Analytics, Mixpanel)
    this.sendToAnalytics(metrics);
    
    // Stocker localement pour debug
    this.storeLocally(metrics);
  }

  static sendToAnalytics(metrics) {
    // Exemple avec Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'gemini_api_call', {
        event_category: 'api',
        event_label: metrics.endpoint,
        value: metrics.duration,
        custom_parameter_1: metrics.success ? 'success' : 'error',
        custom_parameter_2: metrics.tokensUsed
      });
    }
  }

  static storeLocally(metrics) {
    const key = `gemini_metrics_${new Date().toISOString().split('T')[0]}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(metrics);
    
    // Garder seulement les 100 dernières entrées par jour
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }
    
    localStorage.setItem(key, JSON.stringify(existing));
  }

  static getDailyMetrics() {
    const key = `gemini_metrics_${new Date().toISOString().split('T')[0]}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
}
```

### Configuration de développement

```javascript
// Configuration pour différents environnements
const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    debug: true,
    logLevel: 'debug',
    retryAttempts: 3,
    timeout: 30000
  },
  staging: {
    apiUrl: 'https://staging-api.example.com',
    debug: true,
    logLevel: 'info',
    retryAttempts: 2,
    timeout: 20000
  },
  production: {
    apiUrl: 'https://api.example.com',
    debug: false,
    logLevel: 'error',
    retryAttempts: 1,
    timeout: 15000
  }
};

const currentConfig = config[process.env.NODE_ENV] || config.development;

// Service configuré
const geminiService = new GeminiAIService(
  currentConfig.apiUrl,
  getAuthToken(),
  currentConfig
);
```

### Checklist de déploiement

```markdown
## Checklist de déploiement

### Avant le déploiement
- [ ] Tests unitaires passent
- [ ] Tests d'intégration passent
- [ ] Gestion d'erreurs testée
- [ ] Performance testée (chargement < 3s)
- [ ] Compatibilité navigateurs testée
- [ ] Accessibilité vérifiée
- [ ] Sécurité vérifiée (pas de tokens exposés)

### Configuration
- [ ] Variables d'environnement configurées
- [ ] URLs d'API correctes
- [ ] Clés d'authentification configurées
- [ ] Monitoring configuré
- [ ] Logging configuré

### Post-déploiement
- [ ] Santé de l'API vérifiée
- [ ] Première requête testée
- [ ] Monitoring actif
- [ ] Alertes configurées
- [ ] Documentation mise à jour
```

Cette documentation complète fournit tout ce qui est nécessaire pour intégrer le chatbot AI Gemini dans votre frontend, incluant tous les cas d'erreur possibles, les exemples de code, les tests, et les bonnes pratiques de déploiement.
