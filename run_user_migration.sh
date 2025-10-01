#!/bin/bash

# Run the user management fields migration
echo "Running user management fields migration..."
node src/database/run_migration.js add_user_management_fields.sql

echo "Migration completed!"
