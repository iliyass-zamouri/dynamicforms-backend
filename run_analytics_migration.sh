#!/bin/bash

# Form Analytics Tracking System Migration Script
# This script runs the database migration to add analytics tracking tables

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-dynamic_forms}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}

# Migration file
MIGRATION_FILE="src/database/migrations/add_form_analytics_tracking.sql"

echo -e "${YELLOW}Starting Form Analytics Tracking System Migration...${NC}"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}Error: Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

# Check if MySQL client is available
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}Error: MySQL client not found. Please install MySQL client.${NC}"
    exit 1
fi

# Create backup before migration
BACKUP_FILE="backup_before_analytics_migration_$(date +%Y%m%d_%H%M%S).sql"
echo -e "${YELLOW}Creating backup: $BACKUP_FILE${NC}"

mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Backup created successfully: $BACKUP_FILE${NC}"
else
    echo -e "${RED}Error: Failed to create backup${NC}"
    exit 1
fi

# Run migration
echo -e "${YELLOW}Running migration...${NC}"

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Migration completed successfully!${NC}"
    echo -e "${GREEN}Form Analytics Tracking System is now ready to use.${NC}"
else
    echo -e "${RED}Error: Migration failed${NC}"
    echo -e "${YELLOW}You can restore from backup: $BACKUP_FILE${NC}"
    exit 1
fi

# Verify migration
echo -e "${YELLOW}Verifying migration...${NC}"

# Check if new tables exist
TABLES=(
    "form_visits"
    "form_step_tracking"
    "form_field_interactions"
    "form_submission_sessions"
)

for table in "${TABLES[@]}"; do
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE $table;" &> /dev/null; then
        echo -e "${GREEN}✓ Table $table created successfully${NC}"
    else
        echo -e "${RED}✗ Table $table not found${NC}"
        exit 1
    fi
done

# Check if views exist
VIEWS=(
    "form_analytics_overview"
    "form_step_analytics_overview"
)

for view in "${VIEWS[@]}"; do
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW CREATE VIEW $view;" &> /dev/null; then
        echo -e "${GREEN}✓ View $view created successfully${NC}"
    else
        echo -e "${RED}✗ View $view not found${NC}"
        exit 1
    fi
done

echo -e "${GREEN}Migration verification completed successfully!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Update your frontend to use the new analytics tracking APIs"
echo -e "2. Refer to FORM_ANALYTICS_INTEGRATION_GUIDE.md for implementation details"
echo -e "3. Test the analytics tracking with a sample form"
echo -e "4. Monitor the analytics data in your dashboard"

echo -e "${GREEN}Form Analytics Tracking System is ready!${NC}"
