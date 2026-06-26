# PWA App Kit

A starter kit for building offline-first Progressive Web Apps with Claude Code — no frameworks required (unless the app needs them), no backend, no accounts.

Every app installs like a native app, works without a network connection, and stores data on the user's device. The source files are the deployed files.

---

## Quickstart

```bash
git clone https://github.com/YOUR_USERNAME/pwa-app-kit.git
cd pwa-app-kit
```

Open the repo in [Claude Code](https://claude.ai/code), then ask:

> "Build me a habit tracker app"

Claude will analyze the complexity, pick the right stack, and create the app in `apps/habit-tracker/`. To run it locally:

```bash
cd apps/habit-tracker
npx serve .
# open http://localhost:3000
```

---

## What's in this repo

```
pwa-app-kit/
├── README.md                   ← you are here
├── CLAUDE.md                   ← instructions Claude reads automatically
├── docs/
│   └── pwa-builder-spec.md     ← full architecture, design system, and patterns
├── starter/                    ← base files to copy when starting a vanilla app
│   ├── style.css               ← complete design system (tokens, components, dark mode)
│   ├── sw.js                   ← service worker (cache-first, offline support)
│   ├── manifest.json           ← PWA manifest template
│   └── icons/
│       └── icon.svg            ← placeholder icon
└── apps/
    └── time-tracker/           ← sample app — fully working project time tracker
```

---

## Two stacks, one decision

Claude picks the stack automatically based on app complexity. You can also tell it explicitly.

**Vanilla** (HTML + CSS + JS, no build step) — the default for simple tools. No npm, no bundler. Source files are the deployed files. Good for: calculators, counters, loggers, timers, single-screen utilities.

**React + Vite + Zustand** — for apps with multiple screens, shared state across views, related entity types, or reactive summaries. Good for: trackers with multiple entity types, apps with charts, anything intended to grow.

See [`docs/pwa-builder-spec.md`](docs/pwa-builder-spec.md) for the full decision framework and both track specifications.

---

## App ideas

### Work
| App | Stack |
|---|---|
| Project time tracker *(included)* | Vanilla |
| Meeting cost calculator | Vanilla |
| Decision log | Vanilla |
| On-call incident log | Vanilla |
| Interview scorecard | Vanilla |
| 1-on-1 notes | Vanilla |
| Equipment / asset tracker | React |

### Personal
| App | Stack |
|---|---|
| Person counter (entry/exit, headcount) | Vanilla |
| Habit tracker | Vanilla |
| Budget tracker | Vanilla |
| Packing list builder | Vanilla |
| Car mileage & fuel log | React |
| Home maintenance log | React |

### School / Learning
| App | Stack |
|---|---|
| Pomodoro timer | Vanilla |
| Flashcard deck with spaced repetition | React |
| PDF reference viewer (offline search) | React |
| Reading tracker | Vanilla |
| Lab notebook | Vanilla |
| Citation builder | Vanilla |

---

## When PWAs are the right choice

- Single-user or same-device workflows
- Tools you'd otherwise reach for a spreadsheet or Notes app
- Anything that needs to work offline or in spotty connectivity
- Fast to build, free to deploy, zero infrastructure to maintain
- Tools you want to own — no subscription, no vendor lock-in

## When they're not

- Multi-user collaboration with real-time shared state → you need a backend
- Data that belongs in your org's systems of record (ERP, CRM, HR)
- Anything requiring auth, role-based permissions, or audit trails
- iOS push notifications and background sync are limited compared to native apps

---

## Deploying

All apps are static files. No server needed.

| Platform | How |
|---|---|
| **Netlify** | Drag the app folder to [netlify.com/drop](https://netlify.com/drop) |
| **GitHub Pages** | Push to a repo → Settings → Pages → Deploy from branch |
| **Vercel** | `npx vercel apps/your-app/` |
| **Cloudflare Pages** | Connect repo, set output to the app folder |

Service workers require HTTPS — all four platforms include it. For local testing, use `npx serve apps/your-app` (not `file://`).

---

## License

[MIT](LICENSE) — Copyright (c) 2026 Cameron Peterson & Parachute River LLC

---

## Running the sample app locally

```bash
npx serve apps/time-tracker
# open http://localhost:3000
```

The time tracker logs work sessions per project, shows a per-project summary, and exports to JSON. Data lives in IndexedDB on your device.

---

## Getting help

Happy to help with the trickier parts of getting your app into the world — custom domains and DNS, deployment pipelines, setting up JSON backup/restore, or anything else that comes up. Open a [GitHub issue](../../issues/new) for public questions.

If you'd rather not figure it out alone, I'm happy to actually sit down with you in person, hop on a call and either walk you through the process live, or even build a working prototype of your app together. No charge. Just email me at [parachuteriver@gmail.com](mailto:campeterson@gmail.com).

---

## Built with PWA App Kit

Did you build something with this kit? [Open an issue](../../issues/new?title=Built+with+PWA+App+Kit%3A+%5Byour+app+name%5D&body=**App+name%3A**%0A%0A**What+it+does%3A**%0A%0A**Link+%28optional%29%3A**) and I'll add it to this list.

<!-- Built-with entries go here -->
