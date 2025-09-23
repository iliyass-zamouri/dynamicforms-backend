# Enhanced Logging System Usage Guide

## Overview

The enhanced logging system now includes comprehensive tracing, database exception logging, and stack trace capture for better debugging and monitoring.

## New Logging Methods

### 1. Trace Logging
```javascript
import logger from '../utils/logger.js'

// Log application flow traces
logger.logTrace('operation_name', { 
  userId: '123', 
  action: 'create_form',
  metadata: 'additional_info' 
})
```

### 2. Database Exception Logging
```javascript
// Automatically logs database errors with full context
logger.logDatabaseException(error, {
  operation: 'user_create',
  table: 'users',
  sql: 'INSERT INTO users...',
  params: ['email@example.com']
})
```

### 3. Database Operation Tracing
```javascript
// Logs database operations with performance metrics
logger.logDatabaseTrace('INSERT', 'users', sql, params, executionTime)
```

### 4. Performance Logging
```javascript
// Logs performance metrics with automatic level selection
logger.logPerformance('database_query', duration, { 
  table: 'users', 
  operation: 'SELECT' 
})
```

### 5. Stack Trace Logging
```javascript
// Logs full stack traces with request context
logger.logStackTrace(error, {
  method: 'POST',
  url: '/api/users',
  userId: '123'
})
```

## Automatic Logging Features

### Database Operations
All database operations are automatically logged with:
- Query execution time
- Table names
- Parameter values (truncated for security)
- Success/failure status
- Performance metrics

### Transaction Logging
Database transactions include:
- Unique transaction IDs
- Query count and table names
- Start/commit/rollback events
- Performance timing
- Error context on rollback

### Error Handling
All errors are automatically logged with:
- Full stack traces
- Request context (method, URL, IP, user agent)
- User information (if authenticated)
- Request body and parameters
- Database error details (code, errno, sqlState)

## Log File Structure

```
logs/
├── dev/
│   ├── combined-2024-01-15.log    # All logs combined
│   ├── error-2024-01-15.log       # Errors and exceptions
│   ├── warn-2024-01-15.log        # Warnings and performance issues
│   ├── info-2024-01-15.log        # General application flow
│   └── debug-2024-01-15.log       # Detailed traces and debug info
└── prod/
    ├── combined-2024-01-15.log    # Production logs
    ├── error-2024-01-15.log       # Production errors
    ├── warn-2024-01-15.log        # Production warnings
    └── info-2024-01-15.log        # Production info (no debug)
```

## Log Categories

### Application Traces
- User operations (create, update, delete)
- Authentication events
- Form operations
- Gemini AI interactions

### Database Traces
- Connection tests
- Query execution
- Transaction lifecycle
- Performance metrics

### Error Traces
- Application exceptions
- Database errors
- Authentication failures
- Validation errors

### Performance Traces
- Database query timing
- Transaction duration
- API response times
- External service calls

## Example Log Entries

### Database Operation Trace
```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "debug",
  "message": "Database Operation Trace",
  "operation": "SELECT",
  "table": "users",
  "query": "SELECT * FROM users WHERE email = ?",
  "params": ["user@example.com"],
  "executionTime": "15ms"
}
```

### Database Exception
```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "error",
  "message": "Database Exception",
  "code": "ER_DUP_ENTRY",
  "errno": 1062,
  "sqlState": "23000",
  "sqlMessage": "Duplicate entry 'user@example.com' for key 'email'",
  "stack": "Error: Duplicate entry...",
  "operation": "executeQuery",
  "table": "users"
}
```

### Application Trace
```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "debug",
  "message": "Application Trace",
  "operation": "user_create_success",
  "userId": "uuid-123",
  "email": "user@example.com",
  "duration": "45ms"
}
```

### Stack Trace
```json
{
  "timestamp": "2024-01-15 10:30:45",
  "level": "error",
  "message": "Stack Trace",
  "name": "ValidationError",
  "stack": "ValidationError: Email is required\n    at User.create...",
  "method": "POST",
  "url": "/api/users",
  "userId": "uuid-123"
}
```

## Best Practices

1. **Use Trace Logging**: Add trace points at key operation boundaries
2. **Include Context**: Always include relevant context (userId, operation, timing)
3. **Performance Monitoring**: Monitor query execution times and transaction duration
4. **Error Context**: Ensure all errors include sufficient context for debugging
5. **Security**: Sensitive data is automatically truncated in logs

## Environment Configuration

- **Development**: All log levels including debug traces
- **Production**: Info level and above, no debug traces
- **Log Retention**: 14 days with automatic cleanup
- **File Size**: Maximum 20MB per log file with rotation
