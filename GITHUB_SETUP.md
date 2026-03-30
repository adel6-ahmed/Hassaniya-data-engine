# GitHub Repository Checklist

This document helps ensure the repository is production-ready before pushing to GitHub.

## ✅ PRE-PUSH CHECKLIST

### Repository Setup
- [ ] Repository created on GitHub
- [ ] Branch protection rules configured (require PR reviews)
- [ ] Auto-merge disabled
- [ ] Dismiss stale PR approvals enabled
- [ ] Require status checks to pass before merging

### Code Quality
- [ ] `npm run build` passes without errors
- [ ] `npm run lint` has acceptable warning count
- [ ] TypeScript `strict` mode enabled
- [ ] No TODO/FIXME comments in production code
- [ ] No console.log in production code (or wrapped in debug checks)

### Security
- [ ] `.env.local` is in `.gitignore` ✓
- [ ] No secrets hardcoded in code
- [ ] No API keys in comments
- [ ] Service role key is NOT prefixed with `NEXT_PUBLIC_`
- [ ] CORS is properly configured
- [ ] SQL injection protection verified (Prisma parameterized queries)

### Documentation
- [ ] README.md is comprehensive and up-to-date ✓
- [ ] DEPLOYMENT.md provides clear instructions ✓
- [ ] .env.example includes all required variables ✓
- [ ] API endpoints are documented
- [ ] Architecture diagram is present

### Testing
- [ ] Development environment tested manually
- [ ] Auth flow tested (login, logout, OAuth)
- [ ] CRUD operations tested
- [ ] Error handling verified
- [ ] Edge cases considered

### Database
- [ ] Migrations are reversible
- [ ] Schema is normalized (no N+1 queries)
- [ ] Indexes are defined for frequently queried columns
- [ ] Foreign key constraints are set
- [ ] RLS policies defined (if using Supabase)

### Dependencies
- [ ] `npm audit` passes or known vulnerabilities accepted
- [ ] No unused dependencies
- [ ] All TypeScript dependencies have @types versions

### Files & .gitignore
- [ ] `.env*` files are ignored
- [ ] `/node_modules` is ignored
- [ ] `/.next` is ignored
- [ ] `/out` is ignored
- [ ] `.DS_Store` is ignored (macOS)
- [ ] `*.pem` is ignored (certificates)

---

## ✅ GITHUB REPOSITORY SETUP

1. **Create Repository**
   ```bash
   # Initialize and push
   git remote add origin https://github.com/your-username/hassaniya-dataset-platform.git
   git branch -M main
   git push -u origin main
   ```

2. **Configure Repository Settings**
   - Add description: "Research-grade platform for Hassaniya Arabic linguistic data"
   - Add topic tags: `arabic`, `nlp`, `linguistics`, `dataset`, `open-source`, `next-js`
   - Enable Discussions (for community Q&A)
   - Enable Issues (for bug reports)
   - Disable Wikis (not needed)
   - Enable GitHub Pages (optional)

3. **Branch Protection Rules** (Settings → Branches)
   - Pattern: `main`
   - Require pull request reviews: 1 approval
   - Dismiss stale PR approvals: ✓
   - Require status checks: ✓
   - Require branches to be up to date: ✓

4. **Secrets & Variables** (Settings → Secrets & Variables)
   - For CI/CD: Add deployment secrets if using GitHub Actions
   - Do NOT store database credentials here (use Actions secrets only)

---

## ✅ GITHUB ACTIONS (OPTIONAL)

Create `.github/workflows/test.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Build project
        run: npm run build
```

---

## ✅ RELEASE PLANNING

### Version Numbering (Semantic Versioning)
- `MAJOR.MINOR.PATCH`
- Example: `v1.0.0`, `v1.1.0`, `v1.1.1`

### First Release: `v1.0.0`
Pre-release versions use `-beta.N`:
- `v1.0.0-beta.1` – Initial beta
- `v1.0.0-beta.2` – Bug fixes
- `v1.0.0` – Stable release

### Creating a Release
```bash
# Create a Git tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# On GitHub: Releases → Draft a new release
# - Tag: v1.0.0
# - Title: Release 1.0.0
# - Description: List major features, bug fixes, breaking changes
- [x] Feature A
- [x] Bug fix B
- [x] Documentation improvements
```

---

## ✅ COMMUNITY & CONTRIBUTION

### Contributing Guidelines
Create `CONTRIBUTING.md`:

```markdown
# Contributing

Thank you for your interest in contributing!

## How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes
4. Commit: `git commit -m "Add feature: my feature"`
5. Push: `git push origin feature/my-feature`
6. Open a Pull Request

## Code Style

- Follow ESLint rules: `npm run lint`
- Use TypeScript strict mode
- Write clear commit messages
- Add comments for complex logic

## Reporting Issues

- Search existing issues first
- Include reproduction steps
- Attach error logs and screenshots if relevant

## Questions?

Open a Discussion or contact the maintainers.
```

### Code of Conduct
Create `CODE_OF_CONDUCT.md` (can use GitHub template)

### License
Choose and document your license in `LICENSE` file:
- MIT (permissive, popular for open source)
- Apache 2.0 (includes patent clause)
- GPL (copyleft, requires derivative works to be open)

---

## ✅ OPTIONAL: GITHUB PAGES DOCUMENTATION

Create `docs/` folder for detailed documentation:

```
docs/
├── README.md
├── getting-started.md
├── api-reference.md
├── architecture.md
└── contributing.md
```

Enable GitHub Pages in Settings → Pages → Source: `main` branch `/docs` folder.

---

## ✅ FINAL VERIFICATION

Before pushing:

```bash
# Clean build
rm -rf .next node_modules
npm install
npm run build
npm run lint

# Check git status
git status
# Should show only files you want to commit

# Verify .gitignore
cat .gitignore | grep -E "\.env|node_modules|\.next"

# Create initial commit
git add .
git commit -m "Initial commit: Hassaniya Dataset Platform"

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 📋 Checklist Summary

- [ ] All code quality checks pass
- [ ] Security audit complete
- [ ] Documentation complete
- [ ] Repository configured on GitHub
- [ ] Branch protection rules enabled
- [ ] First release tagged and documented
- [ ] Community guidelines published
- [ ] Ready to onboard contributors! 🎉
