import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import logger from '../utils/logger.js'

dotenv.config()

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dynamic_forms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  // Removed invalid options: timeout, reconnect
}

// Create connection pool
const pool = mysql.createPool(dbConfig)

// Test database connection
export async function testConnection() {
  const startTime = Date.now()
  try {
    const connection = await pool.getConnection()
    const duration = Date.now() - startTime
    
    logger.logTrace('database_connection_test', {
      success: true,
      duration: `${duration}ms`,
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database
    })
    
    connection.release()
    return true
  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.logDatabaseException(error, {
      operation: 'connection_test',
      duration: `${duration}ms`,
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database
    })
    
    return false
  }
}

// Execute query with error handling
export async function executeQuery(sql, params = []) {
  const startTime = Date.now()
  const table = extractTableFromQuery(sql)
  const operation = sql.trim().toUpperCase().split(' ')[0]
  
  try {
    logger.logDatabaseTrace(operation, table, sql, params)
    const [rows, fields] = await pool.query(sql, params)
    const duration = Date.now() - startTime
    
    logger.logDatabaseTrace(operation, table, sql, params, duration)
    
    // Handle different query types
    let rowsAffected = 0
    if (operation === 'SELECT') {
      rowsAffected = rows.length
    } else if (operation === 'INSERT') {
      rowsAffected = rows.affectedRows || 0
    } else if (operation === 'UPDATE' || operation === 'DELETE') {
      rowsAffected = rows.affectedRows || 0
    }
    
    logger.logPerformance('database_query', duration, { 
      table, 
      operation,
      rowsAffected
    })
    
    return { success: true, data: rows }
  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.logDatabaseException(error, {
      operation: 'executeQuery',
      sql: sql.substring(0, 200),
      params,
      table,
      duration: `${duration}ms`
    })
    
    return { success: false, error: error.message }
  }
}

// Execute query without prepared statements (for complex queries)
export async function executeQueryRaw(sql, params = []) {
  const startTime = Date.now()
  const table = extractTableFromQuery(sql)
  const operation = sql.trim().toUpperCase().split(' ')[0]
  
  try {
    logger.logDatabaseTrace('RAW_QUERY', table, sql, params)
    const [rows, fields] = await pool.query(sql, params)
    const duration = Date.now() - startTime
    
    // Handle different query types
    let rowsAffected = 0
    if (operation === 'SELECT') {
      rowsAffected = rows.length
    } else if (operation === 'INSERT') {
      rowsAffected = rows.affectedRows || 0
    } else if (operation === 'UPDATE' || operation === 'DELETE') {
      rowsAffected = rows.affectedRows || 0
    }
    
    logger.logPerformance('database_raw_query', duration, { 
      table, 
      operation: 'RAW_QUERY',
      rowsAffected
    })
    
    return { success: true, data: rows }
  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.logDatabaseException(error, {
      operation: 'executeQueryRaw',
      sql: sql.substring(0, 200),
      params,
      table,
      duration: `${duration}ms`
    })
    
    return { success: false, error: error.message }
  }
}

// Execute transaction
export async function executeTransaction(queries) {
  const connection = await pool.getConnection()
  const startTime = Date.now()
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    logger.logTrace('transaction_start', {
      transactionId,
      queryCount: queries.length,
      tables: queries.map(q => extractTableFromQuery(q.sql))
    })

    await connection.beginTransaction()

    const results = []
    for (let i = 0; i < queries.length; i++) {
      const { sql, params } = queries[i]
      const table = extractTableFromQuery(sql)
      
      logger.logDatabaseTrace('TRANSACTION_QUERY', table, sql, params)
      const [rows] = await connection.execute(sql, params)
      results.push(rows)
    }

    await connection.commit()
    const duration = Date.now() - startTime
    
    logger.logTrace('transaction_commit', {
      transactionId,
      duration: `${duration}ms`,
      queryCount: queries.length,
      success: true
    })
    
    logger.logPerformance('database_transaction', duration, {
      transactionId,
      queryCount: queries.length
    })

    return { success: true, data: results }
  } catch (error) {
    await connection.rollback()
    const duration = Date.now() - startTime
    
    logger.logDatabaseException(error, {
      operation: 'executeTransaction',
      transactionId,
      duration: `${duration}ms`,
      queryCount: queries.length
    })
    
    logger.logTrace('transaction_rollback', {
      transactionId,
      duration: `${duration}ms`,
      success: false
    })

    return { success: false, error: error.message }
  } finally {
    connection.release()
  }
}

// Helper function to extract table name from SQL query
function extractTableFromQuery(sql) {
  const match = sql.match(/(?:FROM|INTO|UPDATE|DELETE FROM)\s+`?(\w+)`?/i)
  return match ? match[1] : 'unknown'
}

export default pool
