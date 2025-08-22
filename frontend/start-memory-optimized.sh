#!/bin/bash

# LFA Legacy GO Frontend - Memory Optimized Startup Script
# This script starts the frontend with aggressive memory optimizations

echo "🚀 Starting LFA Legacy GO Frontend with Memory Optimizations..."
echo "💾 Memory optimizations enabled:"
echo "   - TypeScript checker disabled"
echo "   - Source maps disabled" 
echo "   - Hot reload disabled"
echo "   - Fast refresh disabled"
echo "   - Node.js heap: 12GB with size optimization"
echo ""

# Clear any previous builds/cache
echo "🧹 Clearing cache and temporary files..."
rm -rf node_modules/.cache
rm -rf .cache
rm -rf build

# Set aggressive memory optimization environment variables
export NODE_OPTIONS="--max-old-space-size=12288 --optimize-for-size --gc-interval=100"
export GENERATE_SOURCEMAP=false
export DISABLE_ESLINT_PLUGIN=true
export TSC_COMPILE_ON_ERROR=true
export SKIP_PREFLIGHT_CHECK=true
export FAST_REFRESH=false
export WDS_SOCKET_PORT=0
export HOT=false

# Start with ultralow memory profile
echo "▶️  Starting development server with ultralow memory profile..."
npm run start:ultralow