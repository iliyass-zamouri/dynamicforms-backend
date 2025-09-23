// Middleware to catch JSON serialization errors
export const jsonErrorHandler = (req, res, next) => {
  // Override res.json to catch serialization errors
  const originalJson = res.json
  
  res.json = function(data) {
    try {
      // Test if data can be serialized
      const serialized = JSON.stringify(data)
      
      // If serialization succeeds, send the response
      return originalJson.call(this, data)
    } catch (error) {
      console.error('=== JSON SERIALIZATION ERROR ===')
      console.error('Error message:', error.message)
      console.error('Error name:', error.name)
      console.error('Error stack:', error.stack)
      console.error('Data that failed to serialize:', data)
      console.error('Data type:', typeof data)
      console.error('Data keys:', data && typeof data === 'object' ? Object.keys(data) : 'N/A')
      
      // Try to identify which part of the data is causing the issue
      if (data && typeof data === 'object') {
        try {
          for (const key in data) {
            try {
              JSON.stringify(data[key])
              console.log(`✓ Key '${key}' serializes successfully`)
            } catch (keyError) {
              console.error(`✗ Key '${key}' failed to serialize:`, keyError.message)
              console.error(`Key '${key}' value:`, data[key])
            }
          }
        } catch (iterateError) {
          console.error('Error iterating through data keys:', iterateError)
        }
      }
      
      // Send an error response instead of crashing
      return originalJson.call(this, {
        success: false,
        message: 'Erreur de sérialisation des données',
        error: 'JSON serialization failed',
        debug: {
          originalError: error.message,
          dataType: typeof data,
          timestamp: new Date().toISOString()
        }
      })
    }
  }
  
  next()
}
