# CareerOS Lite

CareerOS Lite is a React and Firebase career workspace for tracking opportunities, goals, projects, progress, certificates, notes, and career milestones. Nova provides conversational assistance with multi-provider AI routing and streaming responses.

## Product capabilities

- Career dashboard with recommendations, progress, and repository-backed statistics
- Opportunity, journey, progress, certificate, note, and goal management
- Nova workspace with persisted conversations, streaming, provider/model metadata, and provider fallback
- Google authentication and per-user cloud sync through Firebase
- Optional product analytics stored in `analytics_events`
- Internal owner console at `/admin` for configured admin email addresses

## Requirements

- Node.js 20 or newer
- A Firebase project with Authentication and Cloud Firestore enabled
- At least one configured AI provider key for Nova

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

The development server runs at `http://localhost:3000`.

Set the Firebase configuration values and at least one provider key in `.env`. Vite reads environment files when it starts, so restart the development server after changing `.env`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_FIREBASE_*` | Firebase web application configuration |
| `VITE_GEMINI_API_KEY` | Gemini provider key |
| `VITE_GROQ_API_KEY` | Groq provider key (optional fallback) |
| `VITE_OPENROUTER_API_KEY` | OpenRouter provider key (optional fallback) |
| `VITE_CEREBRAS_API_KEY` | Cerebras provider key (optional fallback) |
| `ENABLE_ANALYTICS` | Set to `true` to enable non-blocking analytics writes |
| `VITE_ADMIN_EMAILS` | Comma-separated emails allowed to access `/admin` |

Never commit `.env` or provider secrets.

## Firebase release requirements

Firebase security rules are deployment configuration and must be maintained with the Firebase project. Before public release, verify rules permit an authenticated user to read/write only their own `careerData/{uid}` document and permit only the intended analytics/admin access for `analytics_events`.

The `/admin` route has a client-side email allowlist for UX. Firestore security rules must independently enforce analytics access; client-side checks alone are not a security boundary.

## Validation

```bash
npm run lint
npm run build
```

## Deployment

The app is a Vite static build. Configure the same environment variables in the deployment platform, run `npm run build`, and serve `dist`. Configure SPA rewrites so `/admin` resolves to `index.html`.

## Architecture

The UI calls focused hooks and services. Provider selection, streaming, and fallback remain behind the AI provider boundary; career data remains behind the repository and cloud-sync services. Analytics writes are fire-and-forget and use the existing `analytics_events` collection only.
