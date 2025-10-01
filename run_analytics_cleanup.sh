#!/bin/bash

# Remove Unused Analytics Summary Tables Script
# This script removes the unused summary tables that were never populated or used

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
MIGRATION_FILE="src/database/migrations/remove_unused_analytics_summary_tables.sql"

echo -e "${YELLOW}Starting cleanup of unused analytics summary tables...${NC}"

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

# Create backup before cleanup
BACKUP_FILE="backup_before_analytics_cleanup_$(date +%Y%m%d_%H%M%S).sql"
echo -e "${YELLOW}Creating backup: $BACKUP_FILE${NC}"

mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Backup created successfully: $BACKUP_FILE${NC}"
else
    echo -e "${RED}Error: Failed to create backup${NC}"
    exit 1
fi

# Run cleanup migration
echo -e "${YELLOW}Running cleanup migration...${NC}"

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Cleanup migration completed successfully!${NC}"
else
    echo -e "${RED}Error: Cleanup migration failed${NC}"
    echo -e "${YELLOW}You can restore from backup: $BACKUP_FILE${NC}"
    exit 1
fi

# Verify cleanup
echo -e "${YELLOW}Verifying cleanup...${NC}"

# Check if summary tables are removed
SUMMARY_TABLES=(
    "form_analytics_summary"
    "form_step_analytics_summary"
    "form_field_analytics_summary"
)

for table in "${SUMMARY_TABLES[@]}"; do
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE $table;" &> /dev/null; then
        echo -e "${RED}✗ Table $table still exists (should be removed)${NC}"
        exit 1
    else
        echo -e "${GREEN}✓ Table $table successfully removed${NC}"
    fi
done

# Verify essential tables still exist
ESSENTIAL_TABLES=(
    "form_visits"
    "form_step_tracking"
    "form_field_interactions"
    "form_submission_sessions"
)

for table in "${ESSENTIAL_TABLES[@]}"; do
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE $table;" &> /dev/null; then
        echo -e "${GREEN}✓ Essential table $table still exists${NC}"
    else
        echo -e "${RED}✗ Essential table $table not found${NC}"
        exit 1
    fi
done

# Verify views still exist
VIEWS=(
    "form_analytics_overview"
    "form_step_analytics_overview"
)

for view in "${VIEWS[@]}"; do
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW CREATE VIEW $view;" &> /dev/null; then
        echo -e "${GREEN}✓ View $view still exists${NC}"
    else
        echo -e "${RED}✗ View $view not found${NC}"
        exit 1
    fi
done

echo -e "${GREEN}Cleanup verification completed successfully!${NC}"
echo -e "${YELLOW}Summary:${NC}"
echo -e "✓ Removed unused summary tables (form_analytics_summary, form_step_analytics_summary, form_field_analytics_summary)"
echo -e "✓ Preserved essential analytics tables (form_visits, form_step_tracking, form_field_interactions, form_submission_sessions)"
echo -e "✓ Preserved analytics views (form_analytics_overview, form_step_analytics_overview)"
echo -e "✓ Database is now cleaner and more efficient"

echo -e "${GREEN}Analytics cleanup completed successfully!${NC}"
