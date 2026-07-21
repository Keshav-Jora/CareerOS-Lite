# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (`main`) | ✅ Active |
| Older releases | ❌ Not supported |

Security patches are applied to the latest version only.

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in CareerOS Lite, please report it responsibly by:

1. Opening a **private security advisory** via [GitHub Security Advisories](https://github.com/Keshav-Jora/CareerOS-Lite/security/advisories).
2. Or emailing the maintainer directly through the GitHub profile contact.

Please include in your report:
- A description of the vulnerability and potential impact
- Steps to reproduce the issue
- Any proof-of-concept code (if applicable)
- Your suggested fix (if you have one)

You can expect an acknowledgment within **48 hours** and a status update within **7 days**.

---

## Security Practices

### API Keys

- No API keys are ever committed to the repository.
- The `.env.example` file contains only placeholder values.
- In production, AI provider API keys are proxied through a server-side Express layer — they are never exposed in the client-side bundle.
- Always set environment variables through your hosting provider's secrets management (e.g. Vercel Environment Variables), not in committed files.

### Firebase Security Rules

Firestore rules restrict read and write access to authenticated users only. Each user can only access their own data.

Example rules (adapt for your project):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Apply these rules in your Firebase console under **Firestore Database → Rules**.

### Authentication

- CareerOS Lite uses Firebase Authentication with Google OAuth.
- No passwords are stored by the application.
- Sessions are managed by Firebase's secure token system.

### Data Privacy

- User data stored in Firestore is scoped per authenticated user.
- Offline local storage is scoped to the browser session.
- No user data is shared with third parties beyond the configured AI providers (which receive only the content of user queries, not account information).

---

## Dependency Security

Dependencies are managed via npm. To check for known vulnerabilities in dependencies:

```bash
npm audit
```

To apply safe fixes:

```bash
npm audit fix
```

Critical vulnerabilities in dependencies should be reported as issues on this repository.
