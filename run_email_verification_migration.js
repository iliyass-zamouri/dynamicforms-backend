import { executeQuery } from './src/database/connection.js'

async function runEmailVerificationMigration() {
  try {
    console.log('Starting email verification token migration...')
    
    // Check if email_verification_token column already exists
    const checkQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'email_verification_token'
    `
    
    const checkResult = await executeQuery(checkQuery)
    
    if (checkResult.success && checkResult.data.length > 0) {
      console.log('✓ email_verification_token column already exists')
    } else {
      // Add email_verification_token column
      const alterTableQuery = `
        ALTER TABLE users 
        ADD COLUMN email_verification_token VARCHAR(255) NULL
      `
      
      console.log('Adding email_verification_token column...')
      const alterResult = await executeQuery(alterTableQuery)
      
      if (!alterResult.success) {
        throw new Error('Failed to add email_verification_token column')
      }
      
      console.log('✓ email_verification_token column added successfully')
    }
    
    // Check if index already exists
    const checkIndexQuery = `
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND INDEX_NAME = 'idx_email_verification_token'
    `
    
    const checkIndexResult = await executeQuery(checkIndexQuery)
    
    if (checkIndexResult.success && checkIndexResult.data.length > 0) {
      console.log('✓ idx_email_verification_token index already exists')
    } else {
      // Add index
      const indexQuery = 'CREATE INDEX idx_email_verification_token ON users(email_verification_token)'
      
      console.log('Adding index...')
      const indexResult = await executeQuery(indexQuery)
      
      if (!indexResult.success) {
        console.warn('Warning: Failed to create index (it might already exist)')
      } else {
        console.log('✓ Index created successfully')
      }
    }
    
    // Verify migration
    console.log('Verifying migration...')
    const verifyQuery = 'DESCRIBE users'
    const verifyResult = await executeQuery(verifyQuery)
    
    if (verifyResult.success) {
      const columns = verifyResult.data.map(row => row.Field)
      const requiredColumns = ['email_verification_token', 'email_verified_at', 'blocked_at']
      
      for (const column of requiredColumns) {
        if (columns.includes(column)) {
          console.log(`✓ Column ${column} exists`)
        } else {
          console.log(`✗ Column ${column} missing`)
        }
      }
    }
    
    console.log('Migration completed successfully!')
    console.log('Email verification system is ready!')
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runEmailVerificationMigration()