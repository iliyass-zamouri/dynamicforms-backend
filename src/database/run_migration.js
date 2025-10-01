import { executeQuery } from './connection.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MIGRATION_TRACKING_TABLE = 'migration_history'

/**
 * Ensure the migration tracking table exists
 */
async function ensureMigrationTrackingTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TRACKING_TABLE} (
      id VARCHAR(36) PRIMARY KEY,
      migration_name VARCHAR(255) UNIQUE NOT NULL,
      migration_file VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      applied_by VARCHAR(255) DEFAULT 'system',
      checksum VARCHAR(64),
      execution_time_ms INT,
      status ENUM('success', 'failed', 'partial') DEFAULT 'success',
      error_message TEXT NULL,
      
      INDEX idx_migration_name (migration_name),
      INDEX idx_applied_at (applied_at),
      INDEX idx_status (status)
    )
  `
  
  await executeQuery(createTableSQL)
}

/**
 * Calculate checksum for a migration file
 */
function calculateFileChecksum(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  return crypto.createHash('md5').update(content).digest('hex')
}

async function runMigration() {
  const startTime = Date.now()
  
  try {
    const migrationArg = process.argv[2]
    const migrationFile = migrationArg && migrationArg.trim().length > 0
      ? migrationArg.trim()
      : 'remove_success_modal_index.sql'

    console.log(`🔄 Running migration: ${migrationFile}...`)

    // Ensure migration tracking table exists
    await ensureMigrationTrackingTable()

    // Check if migration was already applied
    const migrationName = migrationFile.replace('.sql', '')
    const checkResult = await executeQuery(
      `SELECT id FROM ${MIGRATION_TRACKING_TABLE} WHERE migration_name = ? AND status = 'success'`,
      [migrationName]
    )
    
    if (checkResult.success && checkResult.data.length > 0) {
      console.log(`⏭️  Migration ${migrationFile} already applied, skipping`)
      return
    }

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', migrationFile)
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    const checksum = calculateFileChecksum(migrationPath)

    // Record migration start
    const migrationId = crypto.randomUUID()
    await executeQuery(
      `INSERT INTO ${MIGRATION_TRACKING_TABLE} (id, migration_name, migration_file, checksum, status) VALUES (?, ?, ?, ?, 'partial')`,
      [migrationId, migrationName, migrationFile, checksum]
    )

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
    let successCount = 0
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`📝 Executing: ${statement.substring(0, 50)}...`)
        const result = await executeQuery(statement)
        if (result.success) {
          console.log('✓ Success')
          successCount++
        } else {
          console.error('✗ Error:', result.error)
          throw new Error(`Statement failed: ${result.error}`)
        }
      }
    }

    const executionTime = Date.now() - startTime

    // Update migration record as successful
    await executeQuery(
      `UPDATE ${MIGRATION_TRACKING_TABLE} SET status = 'success', execution_time_ms = ?, applied_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [executionTime, migrationId]
    )

    console.log(`✅ Migration ${migrationFile} completed successfully! (${executionTime}ms, ${successCount} statements)`)
  } catch (error) {
    const executionTime = Date.now() - startTime
    
    // Update migration record as failed
    const migrationName = (process.argv[2] || 'remove_success_modal_index.sql').replace('.sql', '')
    await executeQuery(
      `UPDATE ${MIGRATION_TRACKING_TABLE} SET status = 'failed', execution_time_ms = ?, error_message = ? WHERE migration_name = ?`,
      [executionTime, error.message, migrationName]
    )
    
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
}

export { runMigration }
