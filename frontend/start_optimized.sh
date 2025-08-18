#!/bin/bash
# LFA Legacy GO - Optimized Frontend Start
export NODE_OPTIONS="--max-old-space-size=20480"
export TS_NODE_MAX_OLD_SPACE_SIZE=10240
export GENERATE_SOURCEMAP=false
export SKIP_PREFLIGHT_CHECK=true

echo "🚀 Starting frontend with memory optimization..."
echo "💾 Node memory limit: 20GB"
echo "🔧 TypeScript memory limit: 10GB"

npm start
