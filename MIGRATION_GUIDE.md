# Migration System for Dynamic Forms Backend

This document explains how to run only missing migrations on specific servers using the enhanced migration tracking system.

## Overview

The migration system now includes:
- **Migration tracking table** to record applied migrations
- **Automatic detection** of missing migrations
- **Server-specific execution** with logging
- **Dry-run capability** to preview changes
- **Error handling** with rollback support

## Quick Start

### 1. Check Migration Status
```bash
# Show current migration status
./run_missing_migrations.sh --status

# Or using Node.js directly
node src/database/run_missing_migrations.js status
```

### 2. Preview Missing Migrations (Dry Run)
```bash
# Preview what would be executed
./run_missing_migrations.sh --server production --dry-run
```

### 3. Run Missing Migrations
```bash
# Run all missing migrations
./run_missing_migrations.sh --server production

# Continue even if some migrations fail
./run_missing_migrations.sh --server staging --continue-error
```

## Available Commands

### Shell Script (`run_missing_migrations.sh`)
```bash
./run_missing_migrations.sh [OPTIONS]

Options:
  -s, --server NAME     Set server name for logging
  -d, --dry-run         Show what would be executed without running
  -c, --status          Show migration status only
  -e, --continue-error   Continue execution even if migrations fail
  -h, --help            Show this help message
```

### Node.js Script (`run_missing_migrations.js`)
```bash
node src/database/run_missing_migrations.js [COMMAND]

Commands:
  status      Show migration status
  dry-run     Preview missing migrations
  run         Execute missing migrations (default)
```

## Examples

### Production Server Migration
```bash
# 1. Check status first
./run_missing_migrations.sh --server production --status

# 2. Preview changes
./run_missing_migrations.sh --server production --dry-run

# 3. Execute migrations
./run_missing_migrations.sh --server production
```

### Staging Server with Error Continuation
```bash
# Run migrations, continue even if some fail
./run_missing_migrations.sh --server staging --continue-error
```

### Development Environment
```bash
# Simple execution for development
node src/database/run_missing_migrations.js run
```

## Migration Tracking

The system automatically creates a `migration_history` table to track:
- Migration name and file
- Execution timestamp
- Server/execution context
- Execution time
- Success/failure status
- Error messages (if any)
- File checksums for integrity

## Environment Variables

Set these environment variables for server-specific configuration:

```bash
# Database configuration
export DB_NAME="your_database_name"
export DB_HOST="your_database_host"
export DB_USER="your_database_user"
export DB_PASSWORD="your_database_password"

# Server identification
export SERVER_NAME="production"
export CONTINUE_ON_ERROR=true  # Optional: continue on migration failures
```

## Migration Files

All migration files are stored in `src/database/migrations/` and should:
- Have `.sql` extension
- Be named descriptively (e.g., `add_user_preferences.sql`)
- Include comments explaining the migration purpose
- Be idempotent (safe to run multiple times)

## Error Handling

### Migration Failures
- Failed migrations are recorded in `migration_history` with error details
- By default, execution stops on first failure
- Use `--continue-error` flag to continue with remaining migrations

### Rollback
- The system doesn't automatically rollback failed migrations
- Manual intervention may be required for complex migrations
- Check `migration_history` table for failed migration details

## Best Practices

### Before Running Migrations
1. **Backup your database** - Always backup before running migrations
2. **Test in staging** - Run migrations in staging environment first
3. **Check status** - Use `--status` to see current state
4. **Preview changes** - Use `--dry-run` to see what will be executed

### Server-Specific Execution
1. **Set server name** - Use `--server` flag for proper logging
2. **Environment variables** - Set appropriate DB_* variables
3. **Monitor execution** - Watch logs for any issues

### Migration Development
1. **Descriptive names** - Use clear, descriptive migration file names
2. **Comments** - Include comments explaining the migration purpose
3. **Idempotent** - Ensure migrations can be run multiple times safely
4. **Test thoroughly** - Test migrations in development first

## Troubleshooting

### Common Issues

#### "Migration already applied" message
- This is normal - the system skips already applied migrations
- Check `migration_history` table to see applied migrations

#### Database connection errors
- Verify `DB_*` environment variables are set correctly
- Ensure database server is accessible
- Check database credentials

#### Migration execution failures
- Check `migration_history` table for error details
- Verify migration SQL syntax
- Test migration manually if needed

### Debugging Commands
```bash
# Check migration history
mysql -u $DB_USER -p$DB_PASSWORD -h $DB_HOST $DB_NAME -e "SELECT * FROM migration_history ORDER BY applied_at DESC;"

# Check specific migration status
mysql -u $DB_USER -p$DB_PASSWORD -h $DB_HOST $DB_NAME -e "SELECT * FROM migration_history WHERE migration_name='your_migration_name';"
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run Database Migrations
  run: |
    export DB_NAME="${{ secrets.DB_NAME }}"
    export DB_HOST="${{ secrets.DB_HOST }}"
    export DB_USER="${{ secrets.DB_USER }}"
    export DB_PASSWORD="${{ secrets.DB_PASSWORD }}"
    export SERVER_NAME="${{ github.ref_name }}"
    
    ./run_missing_migrations.sh --server $SERVER_NAME
```

### Docker Example
```dockerfile
# In your Dockerfile
COPY run_missing_migrations.sh /app/
RUN chmod +x /app/run_missing_migrations.sh

# In your startup script
/app/run_missing_migrations.sh --server $SERVER_NAME
```

## Support

For issues or questions about the migration system:
1. Check the `migration_history` table for execution details
2. Review error messages in the console output
3. Verify environment variables are set correctly
4. Test migrations in a development environment first
