# Security Policy

## API Key Management

### ⚠️ Important Security Notice

This project uses the Linkup API for web search and URL fetching capabilities. **Never commit API keys to version control.**

### Secure Configuration

1. **Environment Variables**
   - API keys are loaded from environment variables
   - Browser app: `VITE_LINKUP_API_KEY` in `.env` file
   - Node.js tests: `LINKUP_API_KEY` environment variable

2. **Protected Files**
   - `.env` - Contains actual API keys (in `.gitignore`)
   - `.env.local` - Local overrides (in `.gitignore`)
   - `test-results-*.json` - May contain API responses (in `.gitignore`)

3. **Safe Files**
   - `.env.example` - Template with placeholder values (committed to git)

### Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Add your API key to `.env`:**
   ```bash
   VITE_LINKUP_API_KEY=your_actual_api_key_here
   VITE_ENABLE_TOOLS=true
   ```

3. **Verify `.env` is in `.gitignore`:**
   ```bash
   cat .gitignore | grep .env
   ```

### For Developers

#### Before Committing

1. **Check for exposed keys:**
   ```bash
   git diff --cached | grep -i "api.*key"
   ```

2. **Verify .gitignore is working:**
   ```bash
   git status --ignored
   ```

3. **Never hardcode API keys** in source files

#### If You Accidentally Commit a Key

1. **Immediately revoke the key** at [Linkup Dashboard](https://app.linkup.so)
2. **Generate a new key**
3. **Remove the key from git history:**
   ```bash
   # Use git-filter-repo or BFG Repo-Cleaner
   # See: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
   ```
4. **Force push** (if already pushed to remote)
5. **Update all team members** to pull the cleaned history

### Running Tests Securely

#### Browser Tests
```bash
# API key loaded from .env automatically
npm run dev
# Navigate to http://localhost:5173/tests/run-scenarios.html
```

#### Command-Line Tests
```bash
# Option 1: Inline (not recommended - visible in shell history)
LINKUP_API_KEY=your_key node tests/run-smoke-test.mjs

# Option 2: Export in shell (better)
export LINKUP_API_KEY=your_key
node tests/run-smoke-test.mjs

# Option 3: Use .env file with dotenv (best for CI/CD)
# Add to package.json: "test": "dotenv -e .env -- node tests/run-smoke-test.mjs"
```

### CI/CD Configuration

For GitHub Actions, GitLab CI, or other CI/CD platforms:

1. **Add API key as a secret** in your CI/CD platform settings
2. **Reference the secret** in your workflow:

   ```yaml
   # GitHub Actions example
   - name: Run smoke tests
     env:
       LINKUP_API_KEY: ${{ secrets.LINKUP_API_KEY }}
     run: node tests/run-smoke-test.mjs
   ```

### Production Deployment

1. **Use environment variables** provided by your hosting platform:
   - Vercel: Environment Variables in project settings
   - Netlify: Environment Variables in site settings
   - AWS: Systems Manager Parameter Store or Secrets Manager
   - Docker: Pass via `-e` flag or docker-compose environment section

2. **Never include `.env` in production builds**

3. **Rotate keys regularly** (recommended: every 90 days)

### Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT open a public issue**
2. **Email the maintainers** with details
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Best Practices

✅ **DO:**
- Use environment variables for all secrets
- Keep `.env` in `.gitignore`
- Rotate API keys regularly
- Use different keys for dev/staging/production
- Review git diffs before committing
- Use secret scanning tools (e.g., git-secrets, truffleHog)

❌ **DON'T:**
- Hardcode API keys in source files
- Commit `.env` files
- Share API keys in chat/email
- Use production keys in development
- Log API keys to console in production
- Include keys in error messages

### Additional Resources

- [Linkup API Documentation](https://docs.linkup.so)
- [GitHub: Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [OWASP: Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**Last Updated:** 2025-10-13  
**Version:** 1.0.0

