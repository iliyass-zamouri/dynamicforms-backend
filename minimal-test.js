// Test minimal sans dépendances externes
const http = require('http');

const server = http.createServer((req, res) => {
  // Headers CORS basiques
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      message: 'Test minimal fonctionne',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
  } else if (req.url === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      message: 'Application de test minimal',
      version: '1.0.0',
      endpoints: ['/health']
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      success: false,
      message: 'Endpoint non trouvé',
      path: req.url
    }));
  }
});

// Export pour Passenger
module.exports = server;
