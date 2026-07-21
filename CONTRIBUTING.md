# Contributing to CareerOS Lite

Thank you for your interest in contributing. Please read this guide before opening a pull request.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Branching](#branching)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

By participating in this project, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Development Setup

**Requirements:**

- Node.js 18 or later
- npm

**Steps:**

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/CareerOS-Lite.git
cd CareerOS-Lite

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# At minimum, add VITE_GEMINI_API_KEY and your Firebase credentials

# 4. Start the dev server (runs on port 3000)
npm run dev

# 5. Type check
npm run lint
# This runs tsc --noEmit. There is no ESLint in this project.

# 6. Production build
npm run build
```

---

## Branching

The repository currently uses a single `main` branch. When contributing:

```bash
# Branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

Branch naming conventions:

| Prefix | Use for |
|--------|---------|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code restructuring without behavior change |

When your work is ready, open a pull request against `main`.

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short description>
```

| Type | When to use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Restructuring without behavior change |
| `perf` | Performance improvement |
| `chore` | Build, tooling, or dependency changes |

**Examples:**

```
feat(nova): add Groq provider fallback when Gemini is unavailable
fix(sync): resolve Firestore offline cache conflict on reconnect
docs(readme): correct dev server port from 5173 to 3000
chore(deps): update firebase to 12.16.0
```

---

## Pull Request Process

1. Make sure your branch is up to date with `main`.

```bash
git fetch origin
git rebase origin/main
```

2. Confirm the build and type check pass.

```bash
npm run build
npm run lint
```

3. Write a clear PR description:
   - What does this PR change?
   - Why is the change needed?
   - Screenshots or recordings for any UI changes
   - Any breaking changes or new environment variables required

4. Reference related issues (e.g. `Closes #12`).

5. Request a review. Address feedback before the PR is merged.

---

## Code Style

- **TypeScript is required** for all source files. Avoid `any`.
- **Component files** use PascalCase (`OpportunityTracker.tsx`).
- **Hook files** use camelCase with the `use` prefix (`useFirebaseSync.ts`).
- **Service files** use camelCase (`geminiService.ts`).
- **Styling** is done with Tailwind CSS utility classes. Avoid inline styles.
- Keep components focused. Consider splitting files that grow beyond ~200 lines.
- Comments should explain *why*, not *what*. Self-documenting code is preferred.

**No ESLint config is present.** The only automated check is `tsc --noEmit` (`npm run lint`). Keep your types clean.

---

## Reporting Bugs

Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) template.

Before filing:
- Check if the bug has already been reported in Issues.
- Verify it reproduces with the latest code on `main`.
- Include reproduction steps, expected behavior, and actual behavior.

---

## Suggesting Features

Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) template.

Good requests explain the problem you're trying to solve, not just the solution you want.
