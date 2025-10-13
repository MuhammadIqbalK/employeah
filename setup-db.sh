#!/bin/bash

echo "🚀 Setting up Employeah Database..."

# Check if .env file exists
if [ ! -f "apps/api/.env" ]; then
    echo "❌ .env file not found in apps/api/"
    echo "📝 Please create apps/api/.env with the following content:"
    echo ""
    echo "DATABASE_URL=postgresql://username:password@localhost:5432/employeah"
    echo "REDIS_HOST=localhost"
    echo "REDIS_PORT=6379"
    echo "REDIS_PASSWORD="
    echo "PORT=3000"
    echo ""
    echo "Replace username, password, and database name with your PostgreSQL credentials."
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=" apps/api/.env; then
    echo "❌ DATABASE_URL not found in .env file"
    exit 1
fi

echo "✅ .env file found"

# Generate migrations
echo "📦 Generating database migrations..."
bun run db:generate

if [ $? -eq 0 ]; then
    echo "✅ Migrations generated successfully"
else
    echo "❌ Failed to generate migrations"
    exit 1
fi

# Run migrations
echo "🗄️ Running database migrations..."
bun run db:migrate

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully"
    echo ""
    echo "🎉 Setup complete! You can now run:"
    echo "  bun run dev          # Start both API and frontend"
    echo "  bun run api:dev      # Start only API"
    echo "  bun run web:dev      # Start only frontend"
else
    echo "❌ Database migration failed"
    echo "Please check your DATABASE_URL and ensure PostgreSQL is running"
    exit 1
fi
