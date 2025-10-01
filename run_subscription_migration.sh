#!/bin/bash

# Subscription System Migration Runner
# This script runs the subscription system migration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MIGRATION_FILE="src/database/migrations/add_subscription_system.sql"
LOG_FILE="logs/migration_subscription_$(date +%Y%m%d_%H%M%S).log"

echo -e "${BLUE}🚀 Starting Subscription System Migration${NC}"
echo -e "${BLUE}======================================${NC}"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}📁 Migration file: $MIGRATION_FILE${NC}"
echo -e "${YELLOW}📝 Log file: $LOG_FILE${NC}"

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL client not found. Please install MySQL client.${NC}"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    echo -e "${YELLOW}📋 Loading environment variables from .env${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}⚠️  No .env file found. Using default values.${NC}"
fi

# Database connection parameters
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-"dynamic_forms"}
DB_USER=${DB_USER:-"root"}
DB_PASSWORD=${DB_PASSWORD:-""}

echo -e "${YELLOW}🔗 Database: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME${NC}"

# Test database connection
echo -e "${YELLOW}🔍 Testing database connection...${NC}"
if ! mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" "$DB_NAME" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to database. Please check your credentials.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database connection successful${NC}"

# Backup existing data (optional)
echo -e "${YELLOW}💾 Creating backup of existing data...${NC}"
BACKUP_FILE="backup_before_subscription_migration_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Could not create backup (this is optional)${NC}"
}

if [ -f "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
fi

# Run the migration
echo -e "${YELLOW}🔄 Running subscription system migration...${NC}"
echo -e "${BLUE}Migration started at: $(date)${NC}" | tee "$LOG_FILE"

if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$MIGRATION_FILE" 2>&1 | tee -a "$LOG_FILE"; then
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
    echo -e "${BLUE}Migration completed at: $(date)${NC}" | tee -a "$LOG_FILE"
    
    # Verify migration
    echo -e "${YELLOW}🔍 Verifying migration...${NC}"
    
    # Check if subscription tables exist
    TABLES=("subscriptions" "subscription_history" "subscription_usage" "subscription_notifications")
    
    for table in "${TABLES[@]}"; do
        if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "DESCRIBE $DB_NAME.$table;" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Table '$table' created successfully${NC}"
        else
            echo -e "${RED}❌ Table '$table' not found${NC}"
            exit 1
        fi
    done
    
    # Check if user_preferences was updated
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SHOW COLUMNS FROM $DB_NAME.user_preferences LIKE 'subscription_id';" | grep -q "subscription_id"; then
        echo -e "${GREEN}✅ user_preferences table updated with subscription_id column${NC}"
    else
        echo -e "${RED}❌ user_preferences table not updated${NC}"
        exit 1
    fi
    
    # Check if account_types was updated
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SHOW COLUMNS FROM $DB_NAME.account_types LIKE 'currency_symbol';" | grep -q "currency_symbol"; then
        echo -e "${GREEN}✅ account_types table updated with currency_symbol column${NC}"
    else
        echo -e "${RED}❌ account_types table not updated${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}🎉 Subscription system migration completed successfully!${NC}"
    echo -e "${BLUE}📊 Summary:${NC}"
    echo -e "${BLUE}  - Created 4 new tables: subscriptions, subscription_history, subscription_usage, subscription_notifications${NC}"
    echo -e "${BLUE}  - Updated user_preferences table with subscription_id column${NC}"
    echo -e "${BLUE}  - Updated account_types table with currency_symbol column${NC}"
    echo -e "${BLUE}  - Created necessary indexes and foreign keys${NC}"
    echo -e "${BLUE}  - Log file: $LOG_FILE${NC}"
    
    if [ -f "$BACKUP_FILE" ]; then
        echo -e "${BLUE}  - Backup file: $BACKUP_FILE${NC}"
    fi
    
else
    echo -e "${RED}❌ Migration failed!${NC}"
    echo -e "${RED}Check the log file for details: $LOG_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}✨ Migration process completed!${NC}"
