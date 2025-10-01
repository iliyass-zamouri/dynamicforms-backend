#!/bin/bash

# Email Verification Fields Migration Script
# This script adds email verification fields to the users table

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
MIGRATION_FILE="src/database/migrations/add_email_verification_fields.sql"

echo -e "${YELLOW}Starting Email Verification Fields Migration...${NC}"

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
BACKUP_FILE="backup_before_email_verification_migration_$(date +%Y%m%d_%H%M%S).sql"
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
    echo -e "${GREEN}Email verification fields have been added to the users table.${NC}"
else
    echo -e "${RED}Error: Migration failed${NC}"
    echo -e "${YELLOW}You can restore from backup: $BACKUP_FILE${NC}"
    exit 1
fi

# Verify migration
echo -e "${YELLOW}Verifying migration...${NC}"

# Check if new columns exist
COLUMNS=(
    "email_verification_token"
    "email_verified_at"
    "blocked_at"
)

for column in "${COLUMNS[@]}"; do
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE users;" | grep -q "$column"; then
        echo -e "${GREEN}✓ Column $column added successfully${NC}"
    else
        echo -e "${RED}✗ Column $column not found${NC}"
        exit 1
    fi
done

# Check if indexes exist
INDEXES=(
    "idx_email_verification_token"
    "idx_email_verified_at"
    "idx_blocked_at"
)

for index in "${INDEXES[@]}"; do
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW INDEX FROM users WHERE Key_name = '$index';" | grep -q "$index"; then
        echo -e "${GREEN}✓ Index $index created successfully${NC}"
    else
        echo -e "${RED}✗ Index $index not found${NC}"
        exit 1
    fi
done

echo -e "${GREEN}Migration verification completed successfully!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Restart your application server"
echo -e "2. Test email verification functionality"
echo -e "3. Configure SMTP settings in your environment variables"

echo -e "${GREEN}Email verification system is ready!${NC}"
