// Load the ES module server
import('./src/server.js').catch(error => {
  console.error('Failed to load server module:', error);
  process.exit(1);
});
