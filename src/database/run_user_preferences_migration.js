import { executeQuery } from './connection.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import logger from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runUserPreferencesMigration() {
  const startTime = Date.now()
  
  logger.logTrace('user_preferences_migration_start')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_user_preferences.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        logger.logTrace('user_preferences_migration_executing_statement', { 
          statement: statement.substring(0, 100) + '...' 
        })
        
        const result = await executeQuery(statement)
        
        if (!result.success) {
          throw new Error(`Migration failed: ${result.error}`)
        }
      }
    }

    const duration = Date.now() - startTime
    
    logger.logTrace('user_preferences_migration_success', { 
      duration: `${duration}ms`,
      statementsExecuted: statements.length
    })

    console.log('✅ User preferences migration completed successfully')
    console.log(`📊 Migration took ${duration}ms`)
    console.log(`🔧 Executed ${statements.length} SQL statements`)

  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.logError(error, {
      operation: 'user_preferences_migration',
      duration: `${duration}ms`
    })

    console.error('❌ User preferences migration failed:', error.message)
    throw error
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runUserPreferencesMigration()
    .then(() => {
      console.log('Migration completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export { runUserPreferencesMigration }
