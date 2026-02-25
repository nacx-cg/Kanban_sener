#!/bin/bash

# Setup script for Kanban Sener - Using existing PostgreSQL credentials
set -e

echo "🚀 Setting up Kanban Sener with your PostgreSQL credentials..."

# Your database configuration
DB_NAME="kanban_sener"
DB_USER="nacx"
DB_PASSWORD="Actoenter22+"
DB_HOST="localhost"
DB_PORT="5432"

# Generate AUTH_SECRET
AUTH_SECRET=$(openssl rand -base64 32)

echo "📝 Step 1: Creating .env file..."
cat > .env <<EOF
# Database
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# NextAuth
AUTH_SECRET="${AUTH_SECRET}"

# NextAuth URL
NEXTAUTH_URL="http://localhost:3000"
EOF

echo "✅ .env file created!"

echo ""
echo "📦 Step 2: Creating database (if it doesn't exist)..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL doesn't seem to be running. Starting it..."
    brew services start postgresql@15 || pg_ctl -D /usr/local/var/postgres start
    sleep 2
fi

# Create database if it doesn't exist
psql -U ${DB_USER} -h ${DB_HOST} -d postgres <<SQLEOF 2>/dev/null
SELECT 'CREATE DATABASE ${DB_NAME}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
SQLEOF

if [ $? -eq 0 ]; then
    echo "✅ Database '${DB_NAME}' is ready!"
else
    echo "⚠️  Database might already exist or couldn't be created. Continuing..."
fi

echo ""
echo "📦 Step 3: Installing dependencies..."
npm install

echo ""
echo "🔧 Step 4: Generating Prisma client..."
npx prisma generate

echo ""
echo "🗃️  Step 5: Running database migrations..."
npx prisma migrate dev --name init

echo ""
echo "✨ Setup complete!"
echo ""
echo "🎉 You can now start the development server:"
echo "   npm run dev"
echo ""
echo "📱 The app will be available at: http://localhost:3000"
echo "   (redirects to http://localhost:3000/es/login)"
echo ""

