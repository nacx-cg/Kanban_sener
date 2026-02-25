#!/bin/bash

# Database Backup Script for Kanban Sener
# Usage: ./scripts/backup-db.sh [backup-name]

set -e

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "   Please set it: export DATABASE_URL='your-database-url'"
    exit 1
fi

# Generate backup filename
if [ -z "$1" ]; then
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S).sql"
else
    BACKUP_NAME="backup_$1_$(date +%Y%m%d_%H%M%S).sql"
fi

BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

echo "🔄 Creating database backup..."
echo "   Database: $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/')"
echo "   Backup file: $BACKUP_PATH"

# Create backup
pg_dump "$DATABASE_URL" > "$BACKUP_PATH"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    echo "✅ Backup created successfully!"
    echo "   Size: $BACKUP_SIZE"
    echo "   Location: $BACKUP_PATH"
    
    # Keep only last 10 backups
    echo "🧹 Cleaning old backups (keeping last 10)..."
    ls -t "$BACKUP_DIR"/backup_*.sql 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    
    echo "✨ Done!"
else
    echo "❌ Backup failed!"
    rm -f "$BACKUP_PATH"
    exit 1
fi

