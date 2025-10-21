#!/bin/bash

echo "🚀 Setting up RunwayML Video Generator..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your RunwayML API key!"
    echo "   Get your API key from: https://runwayml.com"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  1. Edit .env and add your RUNWAYML_API_SECRET"
echo "  2. Run: npm run server (in one terminal)"
echo "  3. Run: npm run dev (in another terminal)"
echo ""
