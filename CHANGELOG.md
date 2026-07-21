# Changelog

All notable changes to CareerOS Lite are documented here.

This project follows [Semantic Versioning](https://semver.org/) and [Keep a Changelog](https://keepachangelog.com/) conventions.

---

## [Unreleased]

No unreleased changes at this time.

---

## [1.0.0] — 2025

Initial public release of CareerOS Lite.

### Added

**AI Assistant (Nova)**
- Google Gemini integration via `@google/genai` SDK
- Additional provider support: Groq (`groq-sdk`), OpenRouter (via `openai` SDK with OpenRouter endpoint), Cerebras
- Provider keys are optional except Gemini, which is required

**Career Tracking**
- Opportunity tracker for internships, jobs, hackathons, and fellowships
- Journey timeline for career milestones
- Daily progress logging with XP and streak system

**Productivity Modules**
- Goals management
- Task management
- Notes hub for interview prep and study material
- Certificate vault

**Analytics**
- Career analytics dashboard with Recharts visualizations

**Authentication and Data**
- Google sign-in via Firebase Authentication
- Firestore real-time cloud sync
- Offline local storage fallback
- JSON import/export for backup and restore

**Admin**
- Admin dashboard accessible to emails listed in `VITE_ADMIN_EMAILS`

**Developer Setup**
- Vite 6 with `@tailwindcss/vite` plugin (Tailwind 4, no config file)
- Express server compiled from TypeScript at build time
- `.env.example` with all required and optional variables documented
- TypeScript type checking via `tsc --noEmit`

---

## [0.1.0] — Initial version

Original frontend-only version with:
- Local storage persistence only (no Firebase, no cloud sync)
- Rule-based assistant (no real AI)
- Basic opportunity tracker, notes, certificates, and progress tracking
- React 18, Vite, Tailwind CSS
