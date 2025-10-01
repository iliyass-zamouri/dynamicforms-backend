#!/bin/bash

# Migration Runner Script for Dynamic Forms Backend
# This script helps run missing migrations on specific servers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SERVER_NAME=""
DRY_RUN=false
SHOW_STATUS=false
CONTINUE_ON_ERROR=false

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -s, --server NAME     Set server name for logging"
    echo "  -d, --dry-run         Show what would be executed without running"
    echo "  -c, --status          Show migration status only"
    echo "  -e, --continue-error  Continue execution even if migrations fail"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --server production --dry-run"
    echo "  $0 --server staging"
    echo "  $0 --status"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--server)
            SERVER_NAME="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -c|--status)
            SHOW_STATUS=true
            shift
            ;;
        -e|--continue-error)
            CONTINUE_ON_ERROR=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            show_usage
            exit 1
            ;;
    esac
done

# Set environment variables
if [ -n "$SERVER_NAME" ]; then
    export SERVER_NAME="$SERVER_NAME"
fi

if [ "$CONTINUE_ON_ERROR" = true ]; then
    export CONTINUE_ON_ERROR=true
fi

# Change to the script directory
cd "$(dirname "$0")"

echo -e "${BLUE}🚀 Dynamic Forms Migration Runner${NC}"
echo -e "${BLUE}================================${NC}"

if [ -n "$SERVER_NAME" ]; then
    echo -e "Server: ${YELLOW}$SERVER_NAME${NC}"
fi

echo -e "Database: ${YELLOW}${DB_NAME:-dynamic_forms}${NC}"
echo -e "Host: ${YELLOW}${DB_HOST:-localhost}${NC}"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed or not in PATH${NC}"
    exit 1
fi

# Check if the migration script exists
if [ ! -f "src/database/run_missing_migrations.js" ]; then
    echo -e "${RED}❌ Migration script not found: src/database/run_missing_migrations.js${NC}"
    exit 1
fi

# Run the appropriate command
if [ "$SHOW_STATUS" = true ]; then
    echo -e "${BLUE}📊 Checking migration status...${NC}"
    node src/database/run_missing_migrations.js status
elif [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}🔍 Running in DRY RUN mode...${NC}"
    node src/database/run_missing_migrations.js dry-run
else
    echo -e "${GREEN}🔄 Running missing migrations...${NC}"
    node src/database/run_missing_migrations.js run
fi

# Capture exit code
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Migration process completed successfully${NC}"
else
    echo -e "${RED}❌ Migration process failed with exit code $EXIT_CODE${NC}"
fi

exit $EXIT_CODE
