import { executeQuery } from './connection.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigration() {
  try {
    console.log('Running migration: add_sidebar_is_active...')

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_sidebar_is_active.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'))

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        const result = await executeQuery(statement)
        if (result.success) {
          console.log('✓ Success')
        } else {
          console.error('✗ Error:', result.error)
        }
      }
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
}

export { runMigration }
