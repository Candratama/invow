# Pre-Commit Security Checklist

## ✅ Files Safe to Commit

### Source Code
- ✅ All `.ts` and `.tsx` files (no hardcoded credentials)
- ✅ All test files (use dummy credentials only)
- ✅ Configuration files (`next.config.js`, `tsconfig.json`)
- ✅ Package files (`package.json`, `package-lock.json`)

### Documentation
- ✅ `README.md`
- ✅ `SECURITY.md`
- ✅ `PRE_COMMIT_CHECKLIST.md` (this file)
- ✅ `lib/stores/README.md`

### Tests
- ✅ All files in `tests/` directory
- ✅ Test utilities and helpers

### Migrations
- ✅ Supabase migration files (no sensitive data)

### Specs
- ✅ `.kiro/specs/` directory (project specifications)

## ❌ Files NEVER to Commit

### Environment Files
- ❌ `.env.local` - Contains actual API keys
- ❌ `.env` - Contains actual secrets
- ❌ `.env.development` - May contain dev credentials
- ❌ `.env.production` - Contains production secrets

### Credentials
- ❌ `*-credentials.json` - Service account credentials
- ❌ `*-secrets.json` - Secret configurations
- ❌ `mcp.json` - MCP server configurations (may contain paths)

### IDE Settings
- ❌ `.kiro/settings/` - Personal IDE settings
- ❌ `.vscode/settings.json` - Personal VS Code settings

### Build Artifacts
- ❌ `.next/` - Next.js build output
- ❌ `node_modules/` - Dependencies
- ❌ `out/` - Static export output

## 🔍 Pre-Commit Verification

Run these commands before committing:

### 1. Check for Hardcoded Secrets
```bash
# Should return no results
grep -r "sk_live\|pk_live\|api_key.*=.*['\"]" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .
```

### 2. Verify .env Files are Ignored
```bash
# Should output: .env.local
git check-ignore .env.local
```

### 3. Check Git Status
```bash
# Review files to be committed
git status
```

### 4. Review Staged Changes
```bash
# Review actual changes
git diff --staged
```

### 5. Run Tests
```bash
# All tests should pass
npm test
```

### 6. Check for Sensitive Data in Logs
```bash
# Should use safeLog utility
grep -r "console.log.*process.env" --include="*.ts" --exclude-dir=node_modules .
```

## 📋 Current .gitignore Status

### Protected Files
```
.env*.local
.env
.env.development
.env.production
mcp.json
*-credentials.json
*-secrets.json
.kiro/settings/
```

### Allowed Files
```
tests/
.kiro/specs/
AGENTS.md
```

## 🚨 If You Accidentally Committed Secrets

### 1. Remove from Git History
```bash
# Remove file from git but keep locally
git rm --cached .env.local

# Commit the removal
git commit -m "Remove accidentally committed secrets"
```

### 2. Rotate All Exposed Credentials
- Generate new API keys
- Update environment variables
- Revoke old credentials

### 3. Force Push (if not yet pushed to remote)
```bash
# Only if you haven't pushed yet
git reset --soft HEAD~1
```

## ✅ Final Checklist Before Push

- [ ] No `.env*` files in git status
- [ ] All tests passing (`npm test`)
- [ ] No hardcoded API keys or secrets
- [ ] All sensitive data uses `process.env`
- [ ] Logs use `safeLog` utility
- [ ] Debug endpoints disabled in production
- [ ] `.gitignore` is up to date
- [ ] Reviewed all staged changes
- [ ] No personal information in commits
- [ ] Commit messages are descriptive

## 📝 Safe Commit Example

```bash
# 1. Check status
git status

# 2. Review changes
git diff

# 3. Stage files (never use git add .)
git add src/
git add tests/
git add README.md

# 4. Verify staged files
git status

# 5. Commit with descriptive message
git commit -m "feat: implement payment verification with Zustand"

# 6. Push to remote
git push origin main
```

## 🔐 Environment Variables Template

Create `.env.example` with placeholder values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Mayar Payment Gateway
MAYAR_API_KEY=your_mayar_api_key_here
MAYAR_API_URL=https://api.mayar.id
MAYAR_WEBHOOK_SECRET=your_webhook_secret_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📞 Contact

If you discover accidentally committed secrets:
1. **Do not** create a public issue
2. Contact the team lead immediately
3. Follow the secret rotation procedure
4. Document the incident (privately)
