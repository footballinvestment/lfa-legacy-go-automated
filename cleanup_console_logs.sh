#!/bin/bash

FRONTEND_DIR="frontend/src"
BACKUP_DIR="frontend/console-cleanup-backups-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "🧹 Starting safe console cleanup..."
echo "📁 Backups will be stored in: $BACKUP_DIR"

# Create master backup
cp -r "$FRONTEND_DIR" "$BACKUP_DIR/"

# Files to EXCLUDE from mass cleanup (critical error handling)
EXCLUDE_PATTERN="(errorHandler|ErrorBoundary|error\.ts|api\.ts)$"

# Find files with console logs
CONSOLE_FILES=$(find "$FRONTEND_DIR" -name "*.tsx" -o -name "*.ts" | xargs grep -l "console\." | grep -vE "$EXCLUDE_PATTERN")

echo "📊 Files targeted for cleanup:"
echo "$CONSOLE_FILES" | wc -l

# Cleanup each file safely
for file in $CONSOLE_FILES; do
    if [ -f "$file" ]; then
        BEFORE=$(grep -c "console\." "$file" 2>/dev/null || echo "0")
        
        # Remove console.log, console.warn, console.info (keep console.error for critical errors)
        sed -i '' '/console\.log\|console\.warn\|console\.info/d' "$file"
        
        AFTER=$(grep -c "console\." "$file" 2>/dev/null || echo "0")
        
        if [ "$BEFORE" != "$AFTER" ]; then
            echo "✅ $file: $BEFORE → $AFTER console statements"
        fi
    fi
done

echo "🎯 Mass cleanup completed!"
echo "📊 Final verification:"

# Final count
TOTAL_REMAINING=$(find "$FRONTEND_DIR" -name "*.tsx" -o -name "*.ts" | xargs grep -c "console\." 2>/dev/null | awk -F: '{ sum += $2 } END { print sum }')
echo "📊 Total remaining console statements: $TOTAL_REMAINING"

# Show remaining files with console statements
echo "📋 Files still containing console statements:"
find "$FRONTEND_DIR" -name "*.tsx" -o -name "*.ts" | xargs grep -c "console\." 2>/dev/null | grep -v ":0$" | head -10