# 🚨 URGENT: DO NOT PUSH TO GITHUB YET! 🚨

## ❌ Current Status: NOT SAFE TO PUSH

Your repository **STILL HAS SECRETS** in the current commit (HEAD). If you push now, all these secrets will be publicly visible.

## What's Currently Exposed in Your Git Commit:

### 1. File: `backend/.env` (TRACKED IN GIT)
Contains:
- ✅ SUNO_API_KEY (full key)
- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY (CRITICAL!)
- ✅ GUEST_USER_ID
- ✅ PUBLIC_BASE_URL

### 2. File: `.env.production` (TRACKED IN GIT)
Contains:
- ✅ VITE_API_URL (your EC2 server address)

### 3. File: `src/lib/supabase.ts` (IN CURRENT COMMIT)
Contains:
- ✅ Hardcoded Supabase URL
- ✅ Hardcoded Supabase anon key

## Why This Is Dangerous:

1. **Service Role Key = Full Database Access**: Bypasses ALL security rules
2. **Suno API Key = Unauthorized API Usage**: Could rack up charges on your account
3. **All History Is Public**: Even old commits are visible on GitHub

## ✅ What Needs to Happen BEFORE Pushing:

You have THREE options:

### OPTION 1: Quick Fix - Remove Files & Commit (Minimum Required)

This removes secrets from future commits but they remain in history:

```bash
cd /Users/kohrandall/UROP/human-ai-songwriter

# Remove from git tracking
git rm --cached .env.production backend/.env

# Commit all the security fixes
git add .gitignore src/lib/supabase.ts
git add .env.example backend/.env.example
git add *.md cleanup-for-github.sh
git commit -m "Security: Move secrets to environment variables and add documentation"

# Push
git push origin main
```

⚠️ **BUT**: Secrets are still in git history. Only use this if:
- The repository will be **PRIVATE**
- You trust all collaborators
- You understand secrets remain in history

### OPTION 2: Clean History - Remove All Secrets (Recommended)

Use the provided cleanup script:

```bash
cd /Users/kohrandall/UROP/human-ai-songwriter

# First, rotate your API keys!
# Then run:
./cleanup-for-github.sh
```

This will:
1. Remove tracked .env files
2. Clean all secrets from git history
3. Commit the fixes
4. (Optionally) force push

### OPTION 3: Start Completely Fresh (Safest for Public)

```bash
cd /Users/kohrandall/UROP/human-ai-songwriter

# Rotate ALL your API keys first!

# Remove all git history
rm -rf .git

# Start fresh
git init
git add .
git commit -m "Initial commit - Human-AI Songwriter"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

## 🎯 Recommended Action Plan:

1. **Decide**: Public or private repository?

2. **If Private Repository:**
   - Use OPTION 1 (quick fix)
   - Invite only trusted collaborators
   - Consider rotating keys anyway for safety

3. **If Public Repository:**
   - **FIRST**: Rotate ALL API keys
   - **THEN**: Use OPTION 2 or OPTION 3
   - **VERIFY**: No secrets remain before pushing

## 🔐 How to Rotate Your API Keys:

### Supabase:
1. Go to https://supabase.com/dashboard
2. Select your project (lzmnhbyzzfuuewmrhasv)
3. Settings → API
4. Click "Generate new keys" or "Reset" buttons
5. Update your local `.env` and `backend/.env` files
6. Update Vercel/AWS deployment environment variables

### Suno API:
1. Log into your Suno API account
2. Navigate to API keys section
3. Revoke the old key: `4f1535b5ae80535cfb9e502f1b25fda4`
4. Generate a new key
5. Update your local `backend/.env` file
6. Update deployment environment variables

## ✅ Verification Before Pushing:

Run these commands to verify safety:

```bash
# Check what's being committed
git status

# Verify .env files are NOT tracked
git ls-tree -r HEAD | grep "\.env"
# Should return nothing after cleanup

# Check for secrets in staged changes
git diff --cached | grep -i "4f1535b5ae80535cfb9e502f1b25fda4"
# Should return nothing

# Verify working version of supabase.ts is safe
grep -i "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" src/lib/supabase.ts
# Should return nothing
```

## 📞 Need Help?

If you're unsure:
1. **Keep the repository private** on GitHub
2. You can always clean it up later
3. Ask someone experienced with git security for help

## 🔑 Remember:

**It's ALWAYS better to be safe than sorry with API keys!**

Once secrets are pushed to a public repository, you must assume they are compromised, even if you clean them later. Bots scan GitHub constantly for exposed secrets.

---

**Next Step**: Choose an option above and execute it carefully.

