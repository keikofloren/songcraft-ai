# GitHub Repository Setup Guide

Follow these steps to safely share your repository on GitHub without exposing sensitive information.

## ✅ Security Checklist Completed

The following security measures have been implemented:

1. ✅ Updated `.gitignore` to exclude:
   - `.env` files (both root and backend)
   - `backend/venv/` and `__pycache__/`
   - `backend/uploads/` (user-generated content)

2. ✅ Moved hardcoded API keys to environment variables:
   - `src/lib/supabase.ts` now reads from environment variables
   - Keys are no longer in source code

3. ✅ Created example environment files:
   - `.env.example` - Frontend template
   - `backend/.env.example` - Backend template
   - These show what variables are needed without exposing actual keys

4. ✅ Created `SETUP.md` with setup instructions for collaborators

## Steps to Push to GitHub

### 1. Initialize Git (if not already done)

```bash
cd /Users/kohrandall/UROP/human-ai-songwriter
git init
```

### 2. Verify Sensitive Files are Ignored

Run this command to check what will be committed:

```bash
git status
```

**IMPORTANT**: Verify that the following files are NOT listed:
- ❌ `.env`
- ❌ `backend/.env`
- ❌ `backend/venv/`
- ❌ `backend/__pycache__/`
- ❌ `backend/uploads/` (optional - contains test uploads)

If any of these appear, **DO NOT COMMIT** and double-check your `.gitignore`.

### 3. Check for Accidentally Committed Secrets

If you previously committed secrets, check with:

```bash
git log --all --full-history --source -- ".env"
git log --all --full-history --source -- "backend/.env"
```

If secrets were committed, you'll need to remove them from history (see section below).

### 4. Create a GitHub Repository

1. Go to [github.com](https://github.com) and log in
2. Click the "+" icon in the top right
3. Select "New repository"
4. Name it (e.g., `human-ai-songwriter`)
5. Choose visibility:
   - **Private**: Only you and collaborators can see it
   - **Public**: Anyone can see it (but not your .env files!)
6. **DO NOT** initialize with README (you already have one)
7. Click "Create repository"

### 5. Add and Commit Your Code

```bash
# Stage all files (respecting .gitignore)
git add .

# Create your first commit
git commit -m "Initial commit - Human-AI Songwriter application"
```

### 6. Connect to GitHub and Push

Replace `YOUR_USERNAME` and `REPO_NAME` with your actual values:

```bash
# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 7. Verify on GitHub

1. Go to your repository on GitHub
2. Check the file list - `.env` should NOT be visible
3. Check that `.env.example` IS visible
4. Verify `SETUP.md` is there for collaborators

## If You Accidentally Committed Secrets

If you've already committed sensitive files in the past, you need to remove them from Git history:

### Option 1: Using BFG Repo-Cleaner (Recommended)

```bash
# Install BFG (on macOS with Homebrew)
brew install bfg

# Remove .env files from entire history
bfg --delete-files .env

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push to GitHub (WARNING: This rewrites history)
git push origin main --force
```

### Option 2: Using git-filter-repo

```bash
# Install git-filter-repo
brew install git-filter-repo

# Remove .env from history
git filter-repo --path .env --invert-paths
git filter-repo --path backend/.env --invert-paths

# Force push
git push origin main --force
```

⚠️ **WARNING**: Force pushing rewrites history. If others have cloned your repo, they'll need to re-clone it.

## Sharing with Collaborators

When someone clones your repository, they should:

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/REPO_NAME.git
   cd REPO_NAME
   ```

2. Follow instructions in `SETUP.md` to:
   - Copy `.env.example` to `.env`
   - Add their own API keys
   - Install dependencies
   - Run the application

## Best Practices Going Forward

1. **Never commit `.env` files**: They're in `.gitignore`, but always double-check with `git status`

2. **Use environment variables for all secrets**:
   - API keys
   - Database passwords
   - Service tokens
   - Private URLs

3. **Update `.env.example` when adding new variables**: This helps collaborators know what to configure

4. **Review before committing**: Always run `git diff --cached` before committing to review changes

5. **Use GitHub Secrets for CI/CD**: If you set up automated deployments, use GitHub's Secrets feature

## Additional Security Tips

### For Production Deployments

- Use separate API keys for development and production
- Rotate keys periodically
- Use environment-specific configurations
- Never log sensitive information

### Supabase Specific

- The **anon key** is safe to expose in frontend code (it has Row Level Security)
- The **service_role key** should ONLY be in backend code and NEVER committed
- Enable Row Level Security (RLS) on all tables
- Regularly review API usage and access logs

## Questions?

If you're unsure about any step, **stop and ask** before pushing to GitHub. It's much easier to prevent secrets from being committed than to remove them later.

