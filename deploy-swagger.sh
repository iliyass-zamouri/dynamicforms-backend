#!/bin/bash

# Script de déploiement pour la documentation Swagger
# Usage: ./deploy-swagger.sh [environment]

set -e

ENVIRONMENT=${1:-development}
echo "🚀 Déploiement de la documentation Swagger pour l'environnement: $ENVIRONMENT"

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Vérifier que les dépendances Swagger sont installées
if ! npm list swagger-jsdoc swagger-ui-express &> /dev/null; then
    echo "📦 Installation des dépendances Swagger..."
    npm install swagger-jsdoc swagger-ui-express
fi

# Tester la configuration
echo "🧪 Test de la configuration..."
if ! node test-swagger.js; then
    echo "❌ Les tests Swagger ont échoué"
    exit 1
fi

# Tester la configuration CORS
echo "🌐 Test de la configuration CORS..."
if ! node test-cors.js; then
    echo "⚠️  Problème avec la configuration CORS détecté"
    echo "   Mais le serveur peut quand même fonctionner"
fi

# Démarrage du serveur selon l'environnement
case $ENVIRONMENT in
    development)
        echo "🔧 Démarrage en mode développement..."
        NODE_ENV=development npm run dev
        ;;
    production)
        echo "🏭 Démarrage en mode production..."
        NODE_ENV=production npm start
        ;;
    staging)
        echo "🧪 Démarrage en mode staging..."
        NODE_ENV=staging npm start
        ;;
    *)
        echo "❌ Environnement non reconnu: $ENVIRONMENT"
        echo "Environnements supportés: development, staging, production"
        exit 1
        ;;
esac

