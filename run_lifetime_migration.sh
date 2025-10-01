#!/bin/bash

# Script to run the lifetime plan support migration
# This adds the plan_type column to the subscriptions table

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Running Lifetime Plan Support Migration${NC}"
echo -e "${BLUE}===========================================${NC}"

# Change to the script directory
cd "$(dirname "$0")"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed or not in PATH${NC}"
    exit 1
fi

# Check if the migration script exists
if [ ! -f "src/database/run_migration.js" ]; then
    echo -e "${RED}❌ Migration script not found: src/database/run_migration.js${NC}"
    exit 1
fi

# Check if the migration file exists
if [ ! -f "src/database/migrations/add_lifetime_plan_support.sql" ]; then
    echo -e "${RED}❌ Migration file not found: src/database/migrations/add_lifetime_plan_support.sql${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Migration Details:${NC}"
echo -e "  File: add_lifetime_plan_support.sql"
echo -e "  Purpose: Add plan_type column to subscriptions table"
echo -e "  Database: ${DB_NAME:-dynamic_forms}"
echo -e "  Host: ${DB_HOST:-localhost}"
echo ""

# Run the migration
echo -e "${GREEN}🔄 Executing migration...${NC}"
node src/database/run_migration.js add_lifetime_plan_support.sql

# Capture exit code
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Lifetime plan support migration completed successfully${NC}"
    echo -e "${GREEN}✅ The plan_type column has been added to the subscriptions table${NC}"
else
    echo -e "${RED}❌ Migration failed with exit code $EXIT_CODE${NC}"
fi

exit $EXIT_CODE
