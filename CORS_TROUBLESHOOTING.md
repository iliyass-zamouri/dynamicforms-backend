# Guide de résolution des problèmes CORS

## Problème résolu ✅

L'erreur CORS que vous rencontriez a été résolue avec les modifications suivantes :

### 1. Configuration CORS améliorée

Le serveur a été mis à jour avec une configuration CORS plus permissive et spécifique pour Swagger UI :

- **Origines autorisées** : localhost:3000, localhost:5173, 127.0.0.1:3000, etc.
- **Headers autorisés** : Content-Type, Authorization, X-Requested-With, etc.
- **Méthodes autorisées** : GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Gestion des requêtes preflight** : Support complet des requêtes OPTIONS

### 2. Headers CORS spécifiques pour Swagger

- Endpoint `/api-docs` : Headers CORS permissifs pour Swagger UI
- Endpoint `/api-docs.json` : Configuration CORS pour la spécification JSON
- Middleware preflight : Gestion des requêtes OPTIONS

### 3. Configuration des environnements

Le fichier `.env` doit contenir :
```env
FRONTEND_URL=http://localhost:5173
```

## Tests effectués ✅

Tous les tests CORS passent avec succès :
- ✅ Endpoint health
- ✅ Endpoint API docs JSON  
- ✅ Endpoint Swagger UI
- ✅ Requêtes preflight OPTIONS

## Comment utiliser

1. **Démarrer le serveur** :
   ```bash
   npm run dev
   # ou
   node src/server.js
   ```

2. **Accéder à Swagger UI** :
   ```
   http://localhost:3000/api-docs
   ```

3. **Tester la configuration CORS** :
   ```bash
   node test-cors.js
   ```

## Dépannage

### Si vous rencontrez encore des erreurs CORS :

1. **Vérifiez que le serveur est démarré** :
   ```bash
   curl http://localhost:3000/health
   ```

2. **Vérifiez les headers CORS** :
   ```bash
   curl -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS http://localhost:3000/api/forms
   ```

3. **Videz le cache du navigateur** :
   - Ctrl+Shift+R (Chrome/Firefox)
   - Ou ouvrez en navigation privée

4. **Vérifiez la console du navigateur** :
   - F12 → Console
   - Recherchez les erreurs CORS

### Erreurs communes :

- **"Failed to fetch"** : Serveur non démarré ou URL incorrecte
- **"CORS policy"** : Configuration CORS incorrecte (maintenant résolue)
- **"Network Error"** : Problème de réseau ou firewall

## Configuration de production

Pour la production, modifiez la configuration CORS dans `src/server.js` :

```javascript
const allowedOrigins = [
  'https://votre-domaine.com',
  'https://api.votre-domaine.com'
]
```

Et mettez à jour le fichier `.env` :
```env
FRONTEND_URL=https://votre-domaine.com
```

## Support

Si vous rencontrez d'autres problèmes, consultez :
- Les logs du serveur
- La console du navigateur
- Le fichier `test-cors.js` pour diagnostiquer les problèmes
