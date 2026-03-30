# Contributing to Hassaniya Dataset Platform

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL or Supabase account
- Git

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/hassaniya-dataset-platform.git
   cd hassaniya-dataset-platform
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/original-owner/hassaniya-dataset-platform.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database and auth credentials
   ```

6. **Run database migrations**
   ```bash
   npx prisma migrate deploy
   ```

7. **Start development server**
   ```bash
   npm run dev
   # Visit http://localhost:3000
   ```

## Development Workflow

### Creating a Feature Branch

```bash
# Update your local main branch
git fetch upstream
git checkout main
git merge upstream/main

# Create a feature branch
git checkout -b feature/descriptive-name
# or
git checkout -b fix/issue-description
```

### Making Changes

1. **Follow code style**
   ```bash
   npm run lint --fix     # Auto-fix linting issues
   npm run build          # Verify build succeeds
   ```

2. **Write meaningful commits**
   ```bash
   git commit -m "feat: add parallel sentence deduplication"
   git commit -m "fix: resolve auth token expiration issue"
   git commit -m "docs: update README with API examples"
   ```

   Use conventional commit types:
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation
   - `style:` code style (not visual)
   - `refactor:` code restructuring
   - `test:` testing
   - `chore:` build/dependency updates

3. **Test your changes**
   ```bash
   npm run test           # Run tests (if configured)
   npm run lint           # Check code quality
   npm run build          # Verify production build
   ```

### Submitting a Pull Request

1. **Push to your fork**
   ```bash
   git push origin feature/descriptive-name
   ```

2. **Create Pull Request on GitHub**
   - Title: `feat: add X feature` (use conventional commit format)
   - Description: Explain what and why
   - Link to related issues: `Closes #123`

3. **PR Description Template**
   ```markdown
   ## What does this PR do?
   Clear description of changes.

   ## Why?
   Motivation and context.

   ## How to test?
   Steps to verify the changes work.

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Tests pass locally (`npm run build && npm run lint`)
   - [ ] Documentation updated
   - [ ] No breaking changes (or documented if needed)
   ```

4. **Respond to reviews**
   - Address feedback promptly
   - Request re-review after changes
   - Keep the conversation professional

## Contribution Areas

### 🐛 Bug Reports
- Create an Issue with title `[BUG] description`
- Include:
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - Environment (Node version, OS, browser)
  - Error logs/screenshots

### ✨ Feature Requests
- Create an Issue with title `[FEATURE] description`
- Include:
  - Use case and motivation
  - Proposed solution
  - Alternative approaches considered

### 📝 Documentation
- Improve README, API docs, or examples
- Fix typos and clarify explanations
- Add new guides (deployment, testing, etc.)

### 🧪 Testing
- Add test cases for new features
- Improve test coverage
- Test edge cases

### 🔍 Code Review
- Review open Pull Requests
- Suggest improvements
- Spot potential bugs

## Project Structure Overview

```
app/api/          → API endpoints
app/(dashboard)   → Dashboard UI
lib/              → Utilities, validations, Prisma client
components/       → Reusable React components
prisma/           → Database schema and migrations
```

## Key Technologies

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma)
- **Authentication**: Auth.js v5
- **Validation**: Zod
- **Styling**: TailwindCSS
- **Forms**: React Hook Form

## Common Tasks

### Add a New API Endpoint

1. Create file: `app/api/feature/route.ts`
2. Import helpers: `import { ok, badRequest, unauthorized } from '@/lib/api-helpers'`
3. Implement handlers: `export async function GET(req)` / `POST(req)` / etc.
4. Validate input: Use Zod schemas from `@/lib/validations`
5. Test with curl or REST client

### Add a New Form Page

1. Create page component: `app/(dashboard)/dashboard/feature/page.tsx`
2. Use React Hook Form: `const form = useForm<InputType>()`
3. Validate with Zod: `zodResolver(featureSchema)`
4. Submit to API: `const response = await fetch('/api/feature', {...})`

### Modify Database Schema

1. Update `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name descriptive_name`
3. Review generated SQL in `prisma/migrations/`
4. Regenerate Prisma client: `npx prisma generate`

## Getting Help

- **Documentation**: See [README.md](./README.md), [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: Search existing issues or create a new one
- **Discussions**: Start a Discussion for Q&A
- **Code Examples**: Check `app/api/` and `components/` for patterns

## Reporting Security Vulnerabilities

**Do NOT** open a public issue for security vulnerabilities. Instead:
1. Email maintainers with details
2. Allow time for a fix before disclosure
3. Follow responsible disclosure practices

## License

By contributing, you agree that your contributions will be licensed under the project's license (check LICENSE file).

---

## Thank You! 🙏

Your contributions help make Hassaniya Arabic data collection better for everyone. We appreciate your effort!

---

**Questions?** Feel free to ask in Issues or Discussions.
