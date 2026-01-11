# Quick Start Guide

## 🚀 For First-Time Setup

1. **Read the security situation**: See `SECURITY_CLEANUP.md` - you have exposed API keys in git history

2. **Choose your approach**:
   - **Public sharing**: Rotate keys + start fresh repo (recommended)
   - **Private sharing**: Clean git history or keep repo private

3. **Follow the setup**: See `SETUP.md` for local development setup

4. **Push to GitHub**: See `GITHUB_SETUP.md` for detailed GitHub instructions

## 📝 Summary of Changes Made

### Security Fixes Applied

1. **Updated `.gitignore`**:
   - Now excludes `.env` files
   - Excludes `backend/venv/` and `__pycache__/`
   - Excludes `backend/uploads/` directory

2. **Moved hardcoded secrets to environment variables**:
   - `src/lib/supabase.ts` now reads from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - No more hardcoded API keys in source code

3. **Created environment templates**:
   - `.env.example` - Frontend environment template
   - `backend/.env.example` - Backend environment template

4. **Created local `.env` file**:
   - Contains your current Supabase credentials
   - Will NOT be committed to git (protected by `.gitignore`)

### Documentation Created

- `SETUP.md` - How to set up the project locally
- `GITHUB_SETUP.md` - How to safely push to GitHub
- `SECURITY_CLEANUP.md` - Critical security issues and how to fix them
- `QUICK_START.md` - This file

## ⚠️ Before You Push to GitHub

**CRITICAL**: You have sensitive information in your git history. You MUST either:

1. **Rotate all API keys** and start a fresh repository, OR
2. **Clean your git history** using BFG Repo-Cleaner

See `SECURITY_CLEANUP.md` for detailed instructions.

## 🔍 Verify Your Setup

Run these commands to verify everything is secure:

```bash
# Check what will be committed
git status

# Verify .env files are NOT listed
# They should show as "Untracked files" or not appear at all

# Check .gitignore is working
git check-ignore .env backend/.env
# Should output: .env and backend/.env

# Verify no secrets in staged files
git diff --cached | grep -i "api.key\|secret"
# Should return nothing
```

## 🎯 Next Steps

1. Read `SECURITY_CLEANUP.md` carefully
2. Decide: Public or private repository?
3. Rotate API keys if going public
4. Follow `GITHUB_SETUP.md` to push to GitHub
5. Share `SETUP.md` with collaborators

## 💡 Tips

- Always run `git status` before committing
- Never commit `.env` files
- Use `.env.example` to document required variables
- Rotate keys periodically
- Enable Supabase Row Level Security (RLS)

## 🆘 Need Help?

If you're unsure about any security steps:
1. Keep the repository private for now
2. Ask for help from someone experienced with git security
3. Don't rush - it's better to be safe than sorry

