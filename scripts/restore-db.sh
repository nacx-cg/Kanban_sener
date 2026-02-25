#!/bin/bash

# Database Restore Script for Kanban Sener
# Usage: ./scripts/restore-db.sh <backup-file.sql>

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Please provide a backup file"
    echo "   Usage: ./scripts/restore-db.sh <backup-file.sql>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "   Please set it: export DATABASE_URL='your-database-url'"
    exit 1
fi

echo "⚠️  WARNING: This will restore the database from backup"
echo "   Database: $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/')"
echo "   Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 1
fi

echo "🔄 Restoring database from backup..."
psql "$DATABASE_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
else
    echo "❌ Restore failed!"
    exit 1
fi

