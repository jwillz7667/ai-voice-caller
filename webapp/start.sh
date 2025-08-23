#!/bin/bash

# Start the Next.js development server with proper database connection
echo "Starting AI Voice Caller frontend..."
echo "Server will be available at http://localhost:3000"
echo ""
echo "Login credentials:"
echo "  Email: demo@example.com"
echo "  Password: demo123"
echo ""

# Ensure DATABASE_URL is set
export DATABASE_URL=postgresql://willz@localhost:5432/ai_voice_caller

# Start the development server
npm run dev