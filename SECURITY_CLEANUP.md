# Security Cleanup Required

## ⚠️ CRITICAL: Secrets Found in Git History

Your repository has **committed sensitive information** that needs to be removed before sharing publicly. Here's what was found:

### 1. Supabase Keys in Git History
- **File**: `src/lib/supabase.ts`
- **Exposed**: Supabase URL and anon key
- **Status**: ✅ Fixed in working directory, ❌ Still in git history

### 2. Suno API Key in Git History
- **Found**: `SUNO_API_KEY="4f1535b5ae80535cfb9e502f1b25fda4"`
- **Status**: ❌ Still in git history

### 3. Environment Files Committed
- `.env.production` - Committed in git
- `backend/.env` - Committed in git
- **Status**: ❌ Need to be removed from git tracking and history

## 🔧 Required Actions

### OPTION 1: Start Fresh (Recommended for Public Sharing)

If you want to share this publicly, the safest approach is to:

1. **Rotate ALL API keys** (get new ones):
   - Generate new Supabase keys (or use RLS properly)
   - Get a new Suno API key
   - This invalidates the exposed keys

2. **Create a new repository**:
   ```bash
   # Remove git history
   cd /Users/kohrandall/UROP/human-ai-songwriter
   rm -rf .git
   
   # Initialize fresh git repo
   git init
   git add .
   git commit -m "Initial commit - Human-AI Songwriter"
   
   # Push to new GitHub repo
   git remote add origin https://github.com/YOUR_USERNAME/NEW_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

### OPTION 2: Clean Git History (For Private Sharing)

If you're only sharing privately with trusted collaborators, you can clean the history:

#### Step 1: Install BFG Repo-Cleaner

```bash
brew install bfg
```

#### Step 2: Remove Sensitive Files from History

```bash
cd /Users/kohrandall/UROP/human-ai-songwriter

# Remove .env files from entire history
bfg --delete-files .env
bfg --delete-files .env.production

# Remove specific text patterns (API keys)
echo "4f1535b5ae80535cfb9e502f1b25fda4" > secrets.txt
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bW5oYnl6emZ1dWV3bXJoYXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MzU2MDQsImV4cCI6MjA3MzMxMTYwNH0.dRErXkP0lhOtENEuRajZ20eY3dxljta4igzMaJLMYZA" >> secrets.txt
bfg --replace-text secrets.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Remove secrets file
rm secrets.txt
```

#### Step 3: Remove Files from Git Tracking

```bash
# Remove from git but keep local files
git rm --cached .env.production
git rm --cached backend/.env

# Commit the removal
git commit -m "Remove sensitive files from tracking"
```

#### Step 4: Force Push (⚠️ Rewrites History)

```bash
# This will overwrite the remote repository
git push origin main --force
```

⚠️ **WARNING**: Anyone who has cloned your repository will need to re-clone it after this.

## 🔐 What to Do About Exposed Keys

### Supabase Keys

The **anon key** you exposed is actually designed to be public-facing, so this is less critical. However:

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Consider rotating the keys if you're concerned
4. **Most Important**: Ensure Row Level Security (RLS) is enabled on all tables

### Suno API Key

The exposed key `4f1535b5ae80535cfb9e502f1b25fda4` should be rotated:

1. Log into your Suno API account
2. Revoke the old key
3. Generate a new key
4. Update your local `backend/.env` file with the new key

## ✅ What's Already Fixed

1. ✅ `.gitignore` updated to exclude `.env` files
2. ✅ `src/lib/supabase.ts` now uses environment variables
3. ✅ Created `.env.example` files as templates
4. ✅ Created setup documentation
5. ✅ Local `.env` file created (not tracked by git)

## 📋 Pre-Push Checklist

Before pushing to GitHub, verify:

- [ ] All API keys have been rotated
- [ ] Git history has been cleaned OR you're starting fresh
- [ ] `.env` files are NOT in `git status`
- [ ] `.env.example` files ARE in `git status`
- [ ] Run `git log -p | grep -i "api.key"` returns no results
- [ ] `SETUP.md` and `GITHUB_SETUP.md` are included

## 🤔 Still Unsure?

If you're not comfortable with these steps:

1. **Keep the repository private** for now
2. Ask for help from someone experienced with git security
3. Consider using GitHub's private repositories (free for personal accounts)
4. Only share with trusted collaborators who understand the security situation

## 📚 Additional Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

