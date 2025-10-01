import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
}

// Get database name from environment
const dbName = process.env.DB_NAME || 'dynamic_forms'

async function runMigration() {
  let connection

  try {
    console.log('🔄 Starting database migration...')

    // Connect to MySQL server (without specifying database)
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Connected to MySQL server')

    // Create database first
    console.log('📄 Creating database...')
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await connection.query(`USE \`${dbName}\``)
    console.log(`✅ Database '${dbName}' created successfully`)

    // Read and execute schema file (skip the CREATE DATABASE and USE statements)
    const schemaPath = path.join(__dirname, 'schema.sql')
    let schema = fs.readFileSync(schemaPath, 'utf8')

    // Remove CREATE DATABASE and USE statements (commented out in schema.sql)
    schema = schema.replace(/-- CREATE DATABASE IF NOT EXISTS .*;\s*/, '')
    schema = schema.replace(/-- USE .*;\s*/, '')

    console.log('📄 Executing schema...')
    await connection.query(schema)
    console.log('✅ Database schema created successfully')

    // Create default admin user
    console.log('👤 Creating default admin user...')
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.default.hash('admin123', 10)

    const adminUser = {
      id: 'admin-user-001',
      email: 'admin@dynamicforms.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'admin',
    }

    await connection.query(
      'INSERT IGNORE INTO users (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)',
      [adminUser.id, adminUser.email, adminUser.name, adminUser.password, adminUser.role],
    )

    console.log('✅ Default admin user created')
    console.log('📧 Email: admin@dynamicforms.com')
    console.log('🔑 Password: admin123')

    console.log('🎉 Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
}

export default runMigration
