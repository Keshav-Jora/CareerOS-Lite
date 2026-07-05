# CareerOS Lite

A frontend-first Career Operating System designed for students and developers to organize opportunities, hackathons, certifications, coding progress, and learning milestones.

---

## Project Overview

**CareerOS Lite** is a unified productivity dashboard built specifically for computer science students and job candidates. It consolidates job search pipelines, technical competition deadlines, certification achievements, and daily practice habits into a responsive, local-first web application.

---

## Features

- **Dashboard**: Centralized overview displaying key career metrics, application pipeline stages, upcoming deadlines, and daily activity tracking.
- **Opportunity Tracker**: Structured ledger for tracking internships, full-time roles, hackathons, fellowships, and research opportunities with status stages.
- **Upcoming & Calendar**: Dedicated timeline highlighting urgent closing dates and interview schedules.
- **Journey Timeline**: Chronological record documenting career milestones, hackathon achievements, and major accomplishments.
- **Progress Analytics**: Quantitative analytics for daily coding hours, DSA problems solved, and project commits over time.
- **Certificate Vault**: Centralized credential storage for uploading, organizing, and verifying course certificates and badges.
- **Notes Hub**: Strategy scratchpad for technical interview notes, behavioral STAR framework responses, and preparation materials.
- **XP & Streak Mechanics**: Gamified progress mechanics awarding XP and tracking daily activity streaks to reinforce consistent career growth habits.
- **Responsive Layout**: Dual-optimized layout featuring a desktop sidebar and a thumb-friendly mobile navigation bar with a quick-capture speed dial.
- **LocalStorage Persistence**: Client-side state management ensuring fast performance, offline availability, and data privacy without external backend dependencies.
- **Rule-Based Assistant**: Built-in assistant providing structured, deterministic guidance and quick action prompts for common career management tasks.

---


## Tech Stack

- **Frontend Framework**: [React 18+](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tooling**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/) (`motion/react`)
- **Icons**: [Lucide React](https://lucide.react.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Delight Mechanics**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)

---

## Architecture

CareerOS Lite uses a modular, decoupled frontend architecture designed for clean separation of concerns:

```
┌──────────────────────────────────────────────────────────┐
│                      React 18 UI                         │
│   (App.tsx, View Components, MobileNavigation, Modal)    │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                    Custom Hooks & State                  │
│                     (useAppData, useTheme)               │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                    Data Service Layer                    │
│            (dataService.ts, aiService.ts)                │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                   Storage Abstraction                    │
│               (Browser LocalStorage API)                 │
└────────────────────────────┴─────────────────────────────┘
```

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Keshav-Jora/CareerOS-Lite.git
cd CareerOS-Lite
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

### 4. Build for production

```bash
npm run build
```

---

## Current Status

CareerOS Lite is a frontend-first career productivity application that stores all user data locally using browser localStorage. It is designed for students and developers who want a private, responsive dashboard to organize opportunities, certifications, coding progress, notes, and career activities.

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## License

This project is licensed under the MIT License.
