#!/bin/bash

# Dynamic Forms Backend Startup Script

echo "🚀 Starting Dynamic Forms Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if MySQL is running
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL 8.0+ first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your database credentials and other settings."
    echo "   Then run this script again."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run database migration
echo "🗄️  Running database migration..."
npm run migrate

# Start the server
echo "🎯 Starting server..."
if [ "$1" = "dev" ]; then
    npm run dev
else
    npm start
fi
