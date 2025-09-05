#!/bin/bash
# LFA Legacy GO - Git Repository Status Checker

echo "🔍 LFA Legacy GO - Git Repository Status"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check current directory
echo "📂 Current directory: $(pwd)"
echo "📂 Directory name: $(basename $(pwd))"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Not in a git repository root${NC}"
    echo -e "${YELLOW}💡 Navigate to the project root directory first${NC}"
    
    # Try to find git repos in current directory
    echo ""
    echo "🔍 Looking for git repositories in current directory..."
    find . -maxdepth 2 -name ".git" -type d 2>/dev/null | while read git_dir; do
        repo_dir=$(dirname "$git_dir")
        echo -e "${BLUE}  Found git repo: $repo_dir${NC}"
    done
    
    exit 1
fi

# Show basic git info
echo ""
echo -e "${GREEN}✅ Git repository found${NC}"

# Show git remotes
echo ""
echo "🌐 Git Remotes:"
echo "--------------"
if git remote -v | grep -q .; then
    git remote -v
else
    echo -e "${YELLOW}⚠️  No remotes configured${NC}"
fi

# Show current branch
echo ""
echo "🌿 Current Branch:"
echo "-----------------"
current_branch=$(git branch --show-current)
echo -e "${BLUE}$current_branch${NC}"

# Show all branches
echo ""
echo "🌿 All Branches:"
echo "---------------"
git branch -a

# Show recent commits
echo ""
echo "📝 Recent Commits (last 5):"
echo "---------------------------"
git log --oneline -5 --decorate

# Check for uncommitted changes
echo ""
echo "📊 Working Directory Status:"
echo "---------------------------"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes:${NC}"
    git status --short
    echo ""
    echo -e "${YELLOW}💡 Commit changes before deploying:${NC}"
    echo "   git add ."
    echo "   git commit -m 'Pre-deploy commit'"
    echo "   git push origin $current_branch"
else
    echo -e "${GREEN}✅ Working directory is clean${NC}"
fi

# Show project structure
echo ""
echo "📁 Project Structure:"
echo "--------------------"
ls -la | grep -E "(backend|frontend|\.git|\.env|package\.json|requirements\.txt|docker|\.yml|\.yaml)" || echo "Basic files:"
ls -la | head -10

# Check for key files
echo ""
echo "🔍 Key Files Check:"
echo "------------------"
key_files=("backend/requirements.txt" "frontend/package.json" "docker-compose.yml" "netlify.toml" ".env.example")

for file in "${key_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file${NC}"
    fi
done

# Show git config
echo ""
echo "⚙️  Git Configuration:"
echo "---------------------"
echo "User: $(git config user.name) <$(git config user.email)>"

# Check for multiple origins or upstream issues
echo ""
echo "🔍 Repository Analysis:"
echo "----------------------"

# Count commits
commit_count=$(git rev-list --all --count)
echo "Total commits: $commit_count"

# Check repository size
repo_size=$(du -sh .git 2>/dev/null | cut -f1)
echo "Repository size: $repo_size"

# Check for large files
echo ""
echo "📦 Large files (>1MB):"
find . -type f -size +1M -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./venv/*" 2>/dev/null | head -5

echo ""
echo -e "${GREEN}✅ Git status check complete${NC}"
echo ""
echo -e "${YELLOW}🚀 Ready to deploy?${NC}"
echo "1. Run: ./google-cloud-deploy.sh"
echo "2. Check logs: ./check-backend-logs.sh"