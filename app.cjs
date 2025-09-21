// Fichier de démarrage compatible avec Passenger
// Ce fichier utilise CommonJS pour être compatible avec Passenger
// et charge dynamiquement le serveur ES Module

// Fonction pour démarrer le serveur ES Module
async function startServer() {
  try {
    // Import dynamique du serveur ES Module
    const serverModule = await import('./src/server.js');
    
    // Le serveur ES Module se démarre automatiquement
    // Pas besoin de faire autre chose ici
    console.log('✅ Server ES Module loaded successfully with Passenger');
  } catch (error) {
    console.error('❌ Failed to load ES Module server:', error);
    process.exit(1);
  }
}

// Démarrer le serveur
startServer();
