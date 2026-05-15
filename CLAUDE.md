# PWA App Kit

This repository is a starter kit for building offline-first Progressive Web Apps.

## How to use this repo

- **`docs/pwa-builder-spec.md`** — read this before building anything. It defines the full architecture, design system, stack decision framework, and patterns for every app in this repo.
- **`starter/`** — base files (CSS, service worker, manifest, icon) to copy into a new app.
- **`apps/`** — every built app lives here in its own folder.

## Creating a new app

When the user asks to build a new app:

1. Read `docs/pwa-builder-spec.md` in full
2. Run the complexity scorecard from Step 0 to choose vanilla or React track
3. State your stack choice and one-sentence reason before writing any code
4. Create the new app in `apps/<app-name>/`
5. For vanilla apps, copy `starter/` files as the base and adapt them
6. For React apps, scaffold from the three-layer structure defined in the spec

## Repo structure

```
pwa-app-kit/
├── CLAUDE.md                   ← you are here
├── README.md                   ← human-facing intro and quickstart
├── docs/
│   └── pwa-builder-spec.md     ← full architecture and design spec
├── starter/                    ← reusable base files for vanilla apps
│   ├── style.css
│   ├── sw.js
│   ├── manifest.json
│   └── icons/
│       └── icon.svg
└── apps/
    └── time-tracker/           ← sample app (project time tracker)
        ├── index.html
        ├── style.css
        ├── app.js
        ├── sw.js
        ├── manifest.json
        └── icons/
            └── icon.svg
```

## Rules

- New apps always go in `apps/<app-name>/`
- Each app is self-contained — no app imports files from another app or from `starter/`
- `starter/` is a template to copy from, not a shared runtime dependency
- Follow the design tokens and layout patterns in the spec — don't invent new ones
