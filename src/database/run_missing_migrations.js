import { executeQuery } from './connection.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Migration configuration
const MIGRATIONS_DIR = path.join(__dirname, 'migrations')
const MIGRATION_TRACKING_TABLE = 'migration_history'

/**
 * Get all migration files from the migrations directory
 * @returns {Array} Array of migration file names sorted by name
 */
function getAllMigrationFiles() {
  try {
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort() // Sort alphabetically to maintain order
    
    console.log(`📁 Found ${files.length} migration files`)
    return files
  } catch (error) {
    console.error('❌ Error reading migrations directory:', error.message)
    return []
  }
}

/**
 * Get applied migrations from the database
 * @returns {Array} Array of applied migration names
 */
async function getAppliedMigrations() {
  try {
    // First, ensure the migration tracking table exists
    await ensureMigrationTrackingTable()
    
    const result = await executeQuery(
      `SELECT migration_name FROM ${MIGRATION_TRACKING_TABLE} WHERE status = 'success' ORDER BY applied_at`
    )
    
    if (result.success) {
      const appliedMigrations = result.data.map(row => row.migration_name)
      console.log(`📊 Found ${appliedMigrations.length} applied migrations`)
      return appliedMigrations
    } else {
      console.error('❌ Error fetching applied migrations:', result.error)
      return []
    }
  } catch (error) {
    console.error('❌ Error checking applied migrations:', error.message)
    return []
  }
}

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
 * @param {string} filePath - Path to the migration file
 * @returns {string} MD5 checksum of the file
 */
function calculateFileChecksum(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  return crypto.createHash('md5').update(content).digest('hex')
}

/**
 * Execute a single migration file
 * @param {string} migrationFile - Name of the migration file
 * @returns {Object} Result object with success status and details
 */
async function executeMigration(migrationFile) {
  const startTime = Date.now()
  const migrationPath = path.join(MIGRATIONS_DIR, migrationFile)
  const migrationName = migrationFile.replace('.sql', '')
  
  try {
    console.log(`🔄 Executing migration: ${migrationFile}`)
    
    // Check if migration was already applied
    const checkResult = await executeQuery(
      `SELECT id FROM ${MIGRATION_TRACKING_TABLE} WHERE migration_name = ? AND status = 'success'`,
      [migrationName]
    )
    
    if (checkResult.success && checkResult.data.length > 0) {
      console.log(`⏭️  Migration ${migrationFile} already applied, skipping`)
      return { success: true, skipped: true }
    }
    
    // Read migration file
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    const checksum = calculateFileChecksum(migrationPath)
    
    // Clean and split SQL statements
    const cleanedSQL = migrationSQL
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
    
    const statements = cleanedSQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)
    
    // Record migration start
    const migrationId = crypto.randomUUID()
    await executeQuery(
      `INSERT INTO ${MIGRATION_TRACKING_TABLE} (id, migration_name, migration_file, checksum, status) VALUES (?, ?, ?, ?, 'partial')`,
      [migrationId, migrationName, migrationFile, checksum]
    )
    
    // Execute each statement
    let successCount = 0
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`  📝 Executing: ${statement.substring(0, 50)}...`)
        const result = await executeQuery(statement)
        if (result.success) {
          successCount++
          console.log(`  ✓ Success`)
        } else {
          console.error(`  ✗ Error: ${result.error}`)
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
    
    console.log(`✅ Migration ${migrationFile} completed successfully (${executionTime}ms, ${successCount} statements)`)
    return { success: true, executionTime, statementsExecuted: successCount }
    
  } catch (error) {
    const executionTime = Date.now() - startTime
    
    // Update migration record as failed
    await executeQuery(
      `UPDATE ${MIGRATION_TRACKING_TABLE} SET status = 'failed', execution_time_ms = ?, error_message = ? WHERE migration_name = ?`,
      [executionTime, error.message, migrationName]
    )
    
    console.error(`❌ Migration ${migrationFile} failed:`, error.message)
    return { success: false, error: error.message, executionTime }
  }
}

/**
 * Run all missing migrations
 * @param {Object} options - Configuration options
 * @param {boolean} options.dryRun - If true, only show what would be executed
 * @param {string} options.server - Server identifier for logging
 * @returns {Object} Summary of migration results
 */
async function runMissingMigrations(options = {}) {
  const { dryRun = false, server = 'unknown' } = options
  
  console.log(`🚀 Starting migration process for server: ${server}`)
  console.log(`📋 Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`)
  
  try {
    // Get all migration files and applied migrations
    const allMigrations = getAllMigrationFiles()
    const appliedMigrations = await getAppliedMigrations()
    
    // Find missing migrations
    const missingMigrations = allMigrations.filter(file => {
      const migrationName = file.replace('.sql', '')
      return !appliedMigrations.includes(migrationName)
    })
    
    console.log(`\n📊 Migration Status:`)
    console.log(`  Total migrations: ${allMigrations.length}`)
    console.log(`  Applied migrations: ${appliedMigrations.length}`)
    console.log(`  Missing migrations: ${missingMigrations.length}`)
    
    if (missingMigrations.length === 0) {
      console.log(`\n🎉 All migrations are up to date!`)
      return { success: true, applied: 0, skipped: 0, failed: 0 }
    }
    
    console.log(`\n📝 Missing migrations to execute:`)
    missingMigrations.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`)
    })
    
    if (dryRun) {
      console.log(`\n🔍 DRY RUN: No migrations were executed`)
      return { success: true, applied: 0, skipped: 0, failed: 0, dryRun: true }
    }
    
    // Execute missing migrations
    console.log(`\n🔄 Executing missing migrations...`)
    let applied = 0
    let skipped = 0
    let failed = 0
    
    for (const migrationFile of missingMigrations) {
      const result = await executeMigration(migrationFile)
      
      if (result.success) {
        if (result.skipped) {
          skipped++
        } else {
          applied++
        }
      } else {
        failed++
        console.error(`❌ Failed to execute ${migrationFile}: ${result.error}`)
        
        // Ask if user wants to continue with remaining migrations
        if (process.env.CONTINUE_ON_ERROR !== 'true') {
          console.log(`\n🛑 Stopping execution due to migration failure. Set CONTINUE_ON_ERROR=true to continue.`)
          break
        }
      }
    }
    
    console.log(`\n📊 Migration Summary:`)
    console.log(`  Applied: ${applied}`)
    console.log(`  Skipped: ${skipped}`)
    console.log(`  Failed: ${failed}`)
    
    return { 
      success: failed === 0, 
      applied, 
      skipped, 
      failed,
      server,
      executedMigrations: missingMigrations.slice(0, applied + failed)
    }
    
  } catch (error) {
    console.error('❌ Migration process failed:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Show migration status without executing
 */
async function showMigrationStatus() {
  console.log(`📊 Migration Status Report`)
  console.log(`Database: ${process.env.DB_NAME || 'dynamic_forms'}`)
  console.log(`Server: ${process.env.SERVER_NAME || 'unknown'}`)
  
  try {
    const allMigrations = getAllMigrationFiles()
    const appliedMigrations = await getAppliedMigrations()
    
    console.log(`\n📁 All Migration Files:`)
    allMigrations.forEach((file, index) => {
      const migrationName = file.replace('.sql', '')
      const isApplied = appliedMigrations.includes(migrationName)
      const status = isApplied ? '✅ Applied' : '⏳ Pending'
      console.log(`  ${index + 1}. ${file} - ${status}`)
    })
    
    const missingCount = allMigrations.length - appliedMigrations.length
    console.log(`\n📊 Summary:`)
    console.log(`  Total: ${allMigrations.length}`)
    console.log(`  Applied: ${appliedMigrations.length}`)
    console.log(`  Missing: ${missingCount}`)
    
    if (missingCount > 0) {
      console.log(`\n💡 To run missing migrations, use: node run_missing_migrations.js`)
    }
    
  } catch (error) {
    console.error('❌ Error checking migration status:', error.message)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'run'
  const serverName = process.env.SERVER_NAME || process.env.DB_HOST || 'unknown'
  
  switch (command) {
    case 'status':
      await showMigrationStatus()
      break
      
    case 'dry-run':
      await runMissingMigrations({ dryRun: true, server: serverName })
      break
      
    case 'run':
    default:
      await runMissingMigrations({ dryRun: false, server: serverName })
      break
  }
}

// Export functions for use in other modules
export { 
  runMissingMigrations, 
  showMigrationStatus, 
  executeMigration,
  getAllMigrationFiles,
  getAppliedMigrations 
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}
