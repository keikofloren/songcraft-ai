#!/bin/bash
# Script to help clean up the repository for GitHub sharing
# Run this AFTER rotating your API keys

set -e  # Exit on error

echo "🔐 GitHub Repository Cleanup Script"
echo "===================================="
echo ""
echo "⚠️  WARNING: This script will modify your git history!"
echo "⚠️  Make sure you have:"
echo "   1. Rotated ALL your API keys (Supabase + Suno)"
echo "   2. Backed up your repository"
echo "   3. Read SECURITY_CLEANUP.md"
echo ""
read -p "Have you completed all the above? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborting. Please complete the requirements first."
    exit 1
fi

echo ""
echo "📋 Step 1: Checking for BFG Repo-Cleaner..."
if ! command -v bfg &> /dev/null; then
    echo "❌ BFG not found. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install bfg
    else
        echo "❌ Homebrew not found. Please install BFG manually:"
        echo "   https://rtyley.github.io/bfg-repo-cleaner/"
        exit 1
    fi
fi
echo "✅ BFG is installed"

echo ""
echo "📋 Step 2: Removing tracked .env files..."
git rm --cached .env.production 2>/dev/null || echo "  .env.production not tracked"
git rm --cached backend/.env 2>/dev/null || echo "  backend/.env not tracked"
git rm --cached .env 2>/dev/null || echo "  .env not tracked"

echo ""
echo "📋 Step 3: Creating secrets file for BFG..."
cat > secrets.txt << 'EOF'
4f1535b5ae80535cfb9e502f1b25fda4
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bW5oYnl6emZ1dWV3bXJoYXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MzU2MDQsImV4cCI6MjA3MzMxMTYwNH0.dRErXkP0lhOtENEuRajZ20eY3dxljta4igzMaJLMYZA
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bW5oYnl6emZ1dWV3bXJoYXN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzczNTYwNCwiZXhwIjoyMDczMzExNjA0fQ.s2wF_YJs6xBD9aSuY69xe-Jdb6xblYd5GVvt1Vcb1GA
lzmnhbyzzfuuewmrhasv.supabase.co
4301f75a-003a-4d00-90f6-a357da6528c1
EOF

echo ""
echo "📋 Step 4: Running BFG to remove .env files from history..."
bfg --delete-files .env
bfg --delete-files .env.production

echo ""
echo "📋 Step 5: Replacing secrets in history..."
bfg --replace-text secrets.txt

echo ""
echo "📋 Step 6: Cleaning up git repository..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "📋 Step 7: Removing secrets file..."
rm secrets.txt

echo ""
echo "📋 Step 8: Committing changes..."
git add .gitignore
git add .env.example backend/.env.example 2>/dev/null || true
git add SETUP.md GITHUB_SETUP.md SECURITY_CLEANUP.md QUICK_START.md README_FIRST.md 2>/dev/null || true
git add src/lib/supabase.ts 2>/dev/null || true
git commit -m "Security: Remove sensitive files and move to environment variables" || echo "Nothing to commit"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review changes: git log --oneline -5"
echo "2. Verify no secrets: git log -p | grep -i 'api.key'"
echo "3. Force push to GitHub: git push origin main --force"
echo ""
echo "⚠️  Remember: Anyone who has cloned your repo will need to re-clone after force push"
echo ""
read -p "Do you want to force push now? (yes/no): " push_confirm

if [ "$push_confirm" == "yes" ]; then
    echo "🚀 Force pushing to GitHub..."
    git push origin main --force
    echo "✅ Done! Your repository is now clean."
else
    echo "⏸️  Skipped push. Run 'git push origin main --force' when ready."
fi

echo ""
echo "🎉 All done! Your repository is ready to share."

