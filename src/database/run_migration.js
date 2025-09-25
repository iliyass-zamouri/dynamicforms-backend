import { executeQuery } from './connection.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigration() {
  try {
    const migrationArg = process.argv[2]
    const migrationFile = migrationArg && migrationArg.trim().length > 0
      ? migrationArg.trim()
      : 'remove_success_modal_index.sql'

    console.log(`Running migration: ${migrationFile}...`)

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', migrationFile)
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Remove comment lines and split into individual statements
    const cleanedSQL = migrationSQL
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')

    const statements = cleanedSQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)

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
