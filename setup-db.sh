#!/bin/bash

# Setup script for Kanban Sener PostgreSQL database
# This script creates a database and user for the application

set -e

echo "🚀 Setting up PostgreSQL database for Kanban Sener..."

# Database configuration
DB_NAME="kanban_sener"
DB_USER="kanban_user"
DB_PASSWORD="kanban_password_$(openssl rand -hex 4)"

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL doesn't seem to be running on localhost:5432"
    echo "   Please start PostgreSQL first:"
    echo "   - macOS (Homebrew): brew services start postgresql@15"
    echo "   - Or: pg_ctl -D /usr/local/var/postgres start"
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to exit..."
fi

# Connect to PostgreSQL and create database/user
echo "📦 Creating database and user..."

# Create user and database
psql -h localhost -U postgres -d postgres <<EOF 2>/dev/null || psql -h localhost -U $(whoami) -d postgres <<EOF
-- Create user if it doesn't exist
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database and user created successfully!"
    echo ""
    echo "📝 Database Configuration:"
    echo "   Database Name: $DB_NAME"
    echo "   Username: $DB_USER"
    echo "   Password: $DB_PASSWORD"
    echo ""
    echo "🔗 Connection String:"
    echo "   DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public\""
    echo ""
    
    # Create .env file
    if [ ! -f .env ]; then
        echo "📄 Creating .env file..."
        cat > .env <<ENVEOF
# Database
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"

# NextAuth
AUTH_SECRET="$(openssl rand -base64 32)"

# NextAuth URL
NEXTAUTH_URL="http://localhost:3000"
ENVEOF
        echo "✅ .env file created!"
    else
        echo "⚠️  .env file already exists. Please update it with:"
        echo "   DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public\""
    fi
    
    echo ""
    echo "✨ Setup complete! Next steps:"
    echo "   1. Run: npx prisma migrate dev"
    echo "   2. Run: npx prisma generate"
    echo "   3. Run: npm run dev"
else
    echo "❌ Failed to create database. You may need to:"
    echo "   1. Run as postgres user: sudo -u postgres psql"
    echo "   2. Or use your system user: psql -U $(whoami) -d postgres"
    echo "   3. Then manually run the SQL commands"
fi

