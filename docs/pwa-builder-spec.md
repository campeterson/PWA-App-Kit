# PWA Builder — Full Specification

Build offline-first, installable progressive web apps — fast utilities that run entirely in the browser, require no server, and work without a network connection after first load.

## Step 0 — Choose the right stack

Before writing a single line of code, analyze the app description and pick one of two tracks. State your choice and reasoning briefly before proceeding.

### Complexity scorecard

Score the app against these signals:

| Signal | Points |
|---|---|
| 3+ distinct screens or views | +2 |
| Shared state across multiple views (e.g. a record edited in one tab displayed in another) | +2 |
| Multiple entity types with relationships (e.g. vehicles → entries, decks → cards) | +2 |
| Rich interactive UI (drag-and-drop, animated transitions, complex forms with validation) | +2 |
| Derived/computed data that updates reactively (charts, summaries, live totals) | +1 |
| Data visualizations (charts, graphs, maps) | +1 |
| The app will be maintained and extended over time (not a one-off utility) | +1 |
| More than ~300 lines of app logic anticipated | +1 |

**Score 0–3 → Vanilla track.** Score 4+ → React track. When in doubt, vanilla. You can always escalate; refactoring downward is rare.

---

### Vanilla track

Use for: calculators, counters, simple loggers, single-screen utilities, reference tools, anything a student or non-developer should be able to read and modify.

**Stack**: HTML + CSS + JS, no build step, no npm. Source files are the deployed files.

**Hard constraints**:
- No React, Vue, jQuery, or any framework
- No CDN imports — all files local to the project folder
- No package.json, node_modules, or bundler
- No user accounts, no cloud sync
- App must work with no network after first load

**When to split files** (start inline, split when these thresholds are hit):
- CSS > ~200 lines → `style.css`
- JS > ~300 lines → `app.js`, split further by concern (`data.js`, `export.js`, `timer.js`)
- Data > ~100 entries → `data.js` or `data.json` fetched locally

**Avoid**:
- Modals for simple interactions — prefer inline expansion or page sections
- Loading spinners for local operations — everything is instant
- Hamburger menus — use visible tabs or a segmented control

---

### React track

Use for: multi-screen apps with shared state, entity relationships, reactive summaries, or anything intended to grow.

**Stack**: React 18 + TypeScript + Vite + Zustand + `idb` (IndexedDB wrapper). PWA via `vite-plugin-pwa`.

**Dependencies** (these and no others unless the task clearly requires more):

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.0",
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^1.2.0",
    "vitest": "^2.0.0"
  }
}
```

Add `react-router-dom` only if the app has 3+ distinct routes. Add charting libraries (e.g. `recharts`) only if the spec calls for charts. No UI component libraries (no MUI, no shadcn, no Radix) — hand-write components using the design system tokens below.

**Three-layer architecture** — every React app follows this structure:

```
src/
├── data/
│   ├── types.ts          ← all TypeScript interfaces and types
│   ├── persistence.ts    ← IndexedDB open/read/write/delete via idb
│   ├── calculations.ts   ← pure functions, no side effects
│   └── sample.ts         ← seed data for first-run experience
├── state/
│   ├── foo-store.ts      ← one Zustand store per major entity
│   └── bar-store.ts
└── ui/
    ├── shell/
    │   ├── Shell.tsx      ← app frame: header, tab bar, layout
    │   └── TabBar.tsx
    ├── routes/
    │   ├── FooPage.tsx    ← one file per screen/route
    │   └── BarPage.tsx
    └── components/
        └── FooCard.tsx    ← shared components
```

**PWA setup for React track** (`vite.config.ts`):

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: false,          // keep manifest.json in public/ by hand
      workbox: {
        cacheId: 'app-name-v1',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
    }),
  ],
  test: { environment: 'jsdom', globals: true },
})
```

Put `manifest.json` and icons in `public/` — Vite copies them to `dist/` on build.

**Zustand store pattern**:

```typescript
// state/items-store.ts
import { create } from 'zustand'
import { Item } from '../data/types'
import { dbSaveItem, dbLoadAllItems, dbDeleteItem } from '../data/persistence'

interface ItemsStore {
  items: Item[]
  load: () => Promise<void>
  save: (item: Item) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useItemsStore = create<ItemsStore>((set, get) => ({
  items: [],
  load: async () => {
    const items = await dbLoadAllItems()
    set({ items })
  },
  save: async (item) => {
    await dbSaveItem(item)
    set({ items: [...get().items.filter(i => i.id !== item.id), item] })
  },
  remove: async (id) => {
    await dbDeleteItem(id)
    set({ items: get().items.filter(i => i.id !== id) })
  },
}))
```

**Build and deploy**:

```bash
npm install
npm run dev      # local dev server
npm run build    # outputs to dist/
```

Deploy `dist/` as static files — same options as vanilla (GitHub Pages, Netlify, Vercel, Cloudflare Pages).

---

## Constraints common to both tracks

- **No user accounts**: No login, no signup, no authentication of any kind
- **No cloud sync**: Data stays on the device
- **No external API calls at runtime**: All logic runs client-side. No fetching remote data (unless the app specifically requires it and an offline fallback is acceptable)
- **Always include export/import**: JSON export and import is the user's only backup mechanism — never omit it
- **44×44px minimum tap targets**: On mobile, fingers are imprecise. Big targets matter

### When to split files

A single `index.html` with inlined CSS and JS is fine for simple tools (calculators, converters). Split into separate files when:

- **CSS exceeds ~200 lines** → move to `style.css`
- **JS exceeds ~300 lines** → move to `app.js` (or split by concern: `app.js`, `data.js`, `utils.js`)
- **Embedded data exceeds ~100 entries** → move to `data.js` or `data.json` loaded via a local `<script>` tag or `fetch('./data.json')`
- **Multiple distinct features** → one JS file per feature module (e.g. `timer.js`, `export.js`)

Keep the file count low and the structure flat. A typical complex app looks like:

```
my-tool/
├── index.html
├── style.css
├── app.js
├── sw.js
└── manifest.json

my-tracker/
├── index.html
├── style.css
├── app.js
├── data.js          ← static reference data or defaults
├── export.js        ← JSON/CSV export logic
├── sw.js
└── manifest.json
```

### Data persistence

- Use `localStorage` for simple key-value persistence (settings, small datasets)
- Use `IndexedDB` for larger or structured datasets (logs, records, item libraries)
- Always implement JSON **export** and **import** so users can back up and transfer data manually
- Include a "copy to clipboard" option where sharing generated text is useful

**Persist transient UI state across page refreshes.** If the user can be "in the middle of something" — a running timer, a partially filled form, a selected mode — that state must survive a refresh. Write it to `localStorage` the moment it changes; restore it on boot before rendering. Use `localStorage` (not IndexedDB) for this because it's synchronous and available before any async DB is open.

```javascript
// Write whenever state changes
store.set('myApp_activeSession', { project, start: Date.now() });

// Restore on boot, before first render
const saved = store.get('myApp_activeSession');
if (saved) resumeSession(saved);

// Clear when the session ends naturally
store.remove('myApp_activeSession');
```

The rule of thumb: if losing state on a refresh would surprise or frustrate the user, that state belongs in `localStorage`.

### PWA setup

Every app must be installable. Include in `index.html`:

1. **`<link rel="manifest" href="./manifest.json">`** pointing to the project's manifest file
2. **A service worker registration block** that registers `sw.js`
3. **Meta tags** for mobile web app capability:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
   <meta name="apple-mobile-web-app-capable" content="yes">
   <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
   <meta name="theme-color" content="#YOUR_ACCENT_COLOR">
   ```

The service worker must cache **all project files** for offline use. Use a cache-first strategy and list every file in the ASSETS array:

```javascript
const CACHE_NAME = 'app-name-v1'; // increment on every release that changes cached files
const ASSETS = [
  './',
  './style.css',
  './app.js',
  // list every project file — omit entries for files not present
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
});
```

**Important**: Bump `CACHE_NAME` (e.g. `v1` → `v2`) whenever you change any cached file. The old service worker won't know to re-fetch unless the version string changes.

## Design System

The design system below is a solid default. Adapt the colors and font to match the app's domain — what matters is that the tokens are defined consistently and the layout/interaction rules are followed.

### Typography

- **Primary font**: `Inter` (clean, legible at small sizes on mobile) — or choose a domain-appropriate alternative
- **Monospace variant**: `'Courier New'`, `monospace` for data, codes, and technical values
- Load via a `@font-face` block with local files, OR use a Google Fonts import as a single acceptable external resource (with a local fallback stack)
- Fallback stack: `'Inter', 'Segoe UI', system-ui, sans-serif`

### Colors

Define everything as CSS custom properties on `:root`. This makes dark mode and theming straightforward. Below is a neutral default — replace with domain-appropriate hues:

```css
:root {
  /* Backgrounds */
  --bg-primary: #F8F9FA;       /* near-white page background */
  --bg-secondary: #EDEEF0;     /* slightly darker for cards/sections */
  --bg-input: #FFFFFF;          /* white for input fields */

  /* Text */
  --text-primary: #1A1A2E;      /* near-black for body text */
  --text-secondary: #4A4A6A;    /* muted for labels, captions */

  /* Accent — swap these for your brand color */
  --accent-primary: #2563EB;    /* blue — primary actions, active states */
  --accent-hover: #1D4ED8;      /* darker for hover/active */
  --accent-light: #DBEAFE;      /* light tint for subtle highlights */

  /* Structure */
  --border: #D1D5DB;            /* light gray border */
  --success: #16A34A;           /* green for positive states */
  --warning: #D97706;           /* amber for caution */
  --error: #DC2626;             /* red for errors */
  --shadow: rgba(0, 0, 0, 0.06);
}
```

Dark mode is **not required** but add it when the app will be used in low-light environments:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0F172A;
    --bg-secondary: #1E293B;
    --bg-input: #1E293B;
    --text-primary: #F1F5F9;
    --text-secondary: #94A3B8;
    --border: #334155;
    --shadow: rgba(0, 0, 0, 0.3);
    /* keep accent colors or adjust as needed */
  }
}
```

### Layout patterns

- **Header**: App title on the left, compact nav/action buttons on the right. Keep it slim — no more than 52px height on mobile. Use the app's background color with a subtle bottom border
- **Content area**: Single-column on mobile, can expand to two columns on tablet+. Generous padding (16–20px). `max-width: 640px; margin: 0 auto;` keeps content readable on wide screens
- **Cards**: Rounded corners (`border-radius: 8px`), subtle shadow, secondary background color
- **Bottom actions**: For tools with a primary action (calculate, save, export), use a sticky bottom bar on mobile with a full-width accent button

### Interactive elements

- **Buttons**: Rounded (`border-radius: 6px`), accent for primary, outlined for secondary. Minimum touch target **44×44px**
- **Inputs**: White background, light border, generous padding (12px). Clear focus states with accent-color outline
- **Tap targets**: Everything interactive must be at least 44×44px. On mobile, fingers are imprecise. Big targets matter
- **Feedback**: Subtle transitions on state changes (0.15s ease). No jarring animations. Use color shifts and gentle scaling, not bounces or slides

### Responsive behavior

- Mobile-first. Design for 375px wide first, then scale up
- The app must be fully usable on a phone in portrait orientation with one hand
- Tablet and desktop are secondary — the layout can expand but the phone experience is the priority

## File Structure Template

For simple tools (calculators, converters), inline everything in `index.html`. For more complex tools, split CSS into `style.css` and JS into `app.js`. Either way, start from this skeleton:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#2563EB">
  <link rel="manifest" href="./manifest.json">
  <title>[App Name]</title>

  <!-- Option A: inline styles for simple tools -->
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-primary: #F8F9FA;
      --bg-secondary: #EDEEF0;
      --bg-input: #FFFFFF;
      --text-primary: #1A1A2E;
      --text-secondary: #4A4A6A;
      --accent-primary: #2563EB;
      --accent-hover: #1D4ED8;
      --accent-light: #DBEAFE;
      --border: #D1D5DB;
      --success: #16A34A;
      --warning: #D97706;
      --error: #DC2626;
      --shadow: rgba(0, 0, 0, 0.06);
    }

    body {
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.5;
      min-height: 100dvh;
    }

    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid var(--border);
      background: var(--bg-primary);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .app-header h1 {
      font-size: 1.1rem;
      color: var(--accent-primary);
      font-weight: 700;
    }

    .app-content {
      padding: 16px;
      max-width: 640px;
      margin: 0 auto;
    }

    .card {
      background: var(--bg-secondary);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px var(--shadow);
    }

    .btn-primary {
      background: var(--accent-primary);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 12px 24px;
      font-family: inherit;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      min-height: 44px;
      min-width: 44px;
      transition: background 0.15s ease;
    }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-primary:active { transform: scale(0.98); }

    .btn-secondary {
      background: transparent;
      color: var(--accent-primary);
      border: 2px solid var(--accent-primary);
      border-radius: 6px;
      padding: 10px 20px;
      font-family: inherit;
      font-size: 1rem;
      cursor: pointer;
      min-height: 44px;
      min-width: 44px;
      transition: all 0.15s ease;
    }
    .btn-secondary:hover { background: var(--accent-light); }

    input, select, textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--bg-input);
      font-family: inherit;
      font-size: 1rem;
      color: var(--text-primary);
      min-height: 44px;
    }
    input:focus, select:focus, textarea:focus {
      outline: 2px solid var(--accent-primary);
      outline-offset: -1px;
      border-color: var(--accent-primary);
    }

    .text-secondary { color: var(--text-secondary); }
    .text-accent { color: var(--accent-primary); }
    .mt-sm { margin-top: 8px; }
    .mt-md { margin-top: 16px; }
    .mt-lg { margin-top: 24px; }
  </style>

  <!-- Option B: external stylesheet for complex tools -->
  <!-- <link rel="stylesheet" href="./style.css"> -->
</head>
<body>

  <header class="app-header">
    <h1>[App Name]</h1>
    <!-- Optional: nav tabs or action buttons -->
  </header>

  <main class="app-content">
    <!-- App content here -->
  </main>

  <!-- Option A: inline script for simple tools -->
  <script>
    // LocalStorage helpers
    const store = {
      get(key, fallback = null) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch { return fallback; }
      },
      set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
      },
      remove(key) { localStorage.removeItem(key); }
    };

    // Export data as a JSON file download
    function exportData(data, filename) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    // Import data from a JSON file
    function importData(callback) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = e => {
        const reader = new FileReader();
        reader.onload = () => {
          try { callback(JSON.parse(reader.result)); }
          catch { alert('Invalid file format.'); }
        };
        reader.readAsText(e.target.files[0]);
      };
      input.click();
    }

    // Copy text to clipboard with button feedback
    async function copyToClipboard(text, feedbackEl) {
      try {
        await navigator.clipboard.writeText(text);
        if (feedbackEl) {
          const original = feedbackEl.textContent;
          feedbackEl.textContent = 'Copied!';
          setTimeout(() => feedbackEl.textContent = original, 1500);
        }
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    }

    // Service Worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  </script>

  <!-- Option B: external scripts for complex tools -->
  <!-- <script src="./data.js"></script> -->
  <!-- <script src="./app.js"></script> -->
</body>
</html>
```

### manifest.json template

```json
{
  "name": "App Full Name",
  "short_name": "AppName",
  "description": "One-line description of what this app does.",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#F8F9FA",
  "theme_color": "#2563EB",
  "icons": [
    { "src": "./icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "./icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

> **Icons**: For fast prototyping, generate a simple SVG icon and convert to PNG, or use an online tool. The app will still install without icons but they won't appear on home screens correctly.

### sw.js template

```javascript
const CACHE_NAME = 'app-name-v1';
const ASSETS = [
  './',
  './style.css',   // remove if not present
  './app.js',      // remove if not present
  './data.js',     // remove if not present
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
});
```

## Reference Data Pattern

For apps that need built-in reference data (lookup tables, templates, default values):

**Inline in JS** (small datasets, <100 entries): Define as a `const` in `app.js` or a dedicated `data.js`:

```javascript
// data.js
const TEMPLATES = [
  { id: 'one', label: 'Template One', content: '...' },
  // ...
];
```

Load in `index.html` before `app.js`:
```html
<script src="./data.js"></script>
<script src="./app.js"></script>
```

**Separate JSON file** (large datasets, >100 entries): Store as `data.json` and load with fetch:

```javascript
async function loadData() {
  const res = await fetch('./data.json');
  return res.json();
}
```

This works offline because the service worker caches `data.json`. List it in the `ASSETS` array in `sw.js`.

## IndexedDB Pattern

Use IndexedDB when you need to store many records (logs, history, a library of items). Here's a minimal but complete wrapper:

```javascript
let db;

async function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('app-name', 1);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('items')) {
        const store = d.createObjectStore('items', { keyPath: 'id' });
        store.createIndex('date', 'date'); // add indexes as needed
      }
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror = e => reject(e.target.error);
  });
}

function dbSave(storeName, record) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(record).onsuccess = e => resolve(e.target.result);
    tx.onerror = e => reject(e.target.error);
  });
}

function dbLoadAll(storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

function dbDelete(storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id).onsuccess = () => resolve();
    tx.onerror = e => reject(e.target.error);
  });
}

// Generate a simple unique ID
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
```

## localStorage Key Naming

Namespace keys to avoid collisions between apps running on the same origin:

```
appName_feature_keyName
```

Examples: `myTracker_settings_theme`, `myTracker_prefs_lastTab`, `myTracker_cache_lastSync`

## App Ideas by Category

Use these as prompts when a user asks "what could I build?" or needs inspiration. Each fits the PWA model: single-user, offline-capable, no backend required.

### Work

| App | Core mechanic |
|---|---|
| **Project time tracker** | Start/stop timer per project, daily/weekly summary, JSON/CSV export |
| **Meeting cost calculator** | Attendees × hourly rate × duration = real-time dollar cost |
| **Decision log** | Timestamped entries: decision, context, outcome — searchable, exportable |
| **On-call incident log** | Quick timestamped notes during outages; no time to open Jira |
| **Interview scorecard** | Structured per-candidate notes, dimension ratings, side-by-side export |
| **1-on-1 notes** | Running date-stamped notes per person; never lose context before a review |
| **Equipment tracker** | Serial numbers, maintenance dates, location — small team, no IT system |

### Personal

| App | Core mechanic |
|---|---|
| **Person counter** | Large +/− buttons, running count with timestamp log — entry/exit, event headcount, inventory |
| **Habit tracker** | Daily checkbox grid, streak calculation, no account needed |
| **Budget tracker** | Log purchases by category, running total vs. monthly target |
| **Packing list builder** | Reusable lists per trip type, check off as you pack |
| **Car mileage & fuel log** | Fill-up history, MPG trend, cost per mile |
| **Home maintenance log** | Date + what you did + parts used, per room or system |

### School / Learning

| App | Core mechanic |
|---|---|
| **Pomodoro timer** | 25-min focus / 5-min break, session count, log of what you worked on each block |
| **Flashcard deck** | Create cards from notes, flip to reveal, mark confident/shaky, SM-2 spaced repetition (~20 lines of JS) |
| **PDF reference viewer** | Load a local PDF, full-text search via PDF.js (bundle locally — MIT license), bookmark pages |
| **Reading tracker** | Books, pages per session, quotes, progress toward a yearly goal |
| **Lab notebook** | Timestamped experiment entries: hypothesis, method, result, notes |
| **Citation builder** | Enter title/author/URL, output formatted APA/MLA/Chicago to copy |

### Implementation notes for non-obvious apps

**Person counter** — the core is a single integer in localStorage. Add a log array of `{ ts, delta }` objects to replay history. Works well as a near-single-file app with giant tap targets.

**Pomodoro timer** — use `setInterval` + `visibilitychange` to pause/resume when the tab is backgrounded. Store completed sessions in IndexedDB with the task label so the log is meaningful.

**Flashcard app** — cards in IndexedDB, decks exportable as JSON. SM-2 algorithm: each card stores `interval`, `repetitions`, `easeFactor`; after each review update these fields and re-sort the queue. No backend needed.

**PDF reference viewer** — use the [PDF.js](https://mozilla.github.io/pdf.js/) library downloaded and bundled locally (fits the no-CDN rule). The user drags in a PDF; PDF.js renders pages to canvas and exposes text content for search. Bookmarks go in localStorage keyed by filename hash.

## Patterns to Avoid

**Both tracks:**
- No CSS frameworks (no Tailwind, Bootstrap, MUI, shadcn) — hand-write CSS using the design tokens above
- No hamburger menus — use visible tabs or a segmented control; hidden navigation is hostile on mobile
- No loading spinners for local-only operations — everything from localStorage/IndexedDB is effectively instant

**Vanilla track only:**
- No framework boilerplate — direct DOM manipulation with `querySelector` and `addEventListener`
- No package.json, node_modules, or build pipeline — source files are the deployed files

**React track only:**
- No UI component libraries — hand-write components; the design system tokens make this fast
- No `useEffect` for derived data that can be a selector or computed value
- No prop-drilling past one level — put shared state in a Zustand store
- Don't add `react-router-dom` for fewer than 3 routes — conditional rendering is simpler

## Naming Conventions

- **Project folder**: `tool-name/` (lowercase, hyphenated)
- **Entry point**: Always `index.html`
- **CSS file**: `style.css`
- **JS files**: `app.js` for main logic, descriptive names for modules (`data.js`, `export.js`, `timer.js`)
- **localStorage keys**: `appName_feature_key` (namespaced)
- **CSS classes**: Lowercase hyphenated (`.item-list`, `.detail-card`)
- **JS functions/variables**: camelCase (`loadItems`, `activeRecord`)

## Testing Checklist

Before considering an app complete:

1. Opens and functions fully with airplane mode / no network
2. All tap targets are ≥ 44×44px
3. Usable on a 375px-wide screen without horizontal scrolling
4. Data persists across browser sessions
5. Export produces valid JSON that can be re-imported cleanly
6. No console errors or warnings
7. Service worker caches the page for offline use (verify in DevTools → Application → Service Workers)
8. `manifest.json` is valid (DevTools → Application → Manifest shows no errors)
9. Passes basic accessibility: `<label>` on all inputs, sufficient color contrast, keyboard navigable

## Deploying

These apps are static files — no server required. Options:

- **Local**: Open `index.html` directly in a browser. Service worker won't register over `file://` — use a local server for testing: `npx serve .` or `python3 -m http.server 8080`
- **GitHub Pages**: Push to a repo, enable Pages from the branch root or a subfolder
- **Netlify / Vercel**: Drag the folder into Netlify Drop, or connect the repo. Zero config needed
- **Cloudflare Pages**: Free tier, fast global CDN, connects to GitHub

For service workers to work, the app must be served over HTTPS (or `localhost`).

## When PWAs are not the right choice

Know the limits and tell users up front:

- **Multi-user / real-time collaboration** — no shared state without a backend. If two people need to see the same data, you need a server
- **Org systems of record** — data that belongs in ERP, CRM, HR, or accounting tools should stay there; a PWA won't integrate with those
- **Auth, roles, audit trails** — no login means no access control. If the app needs to know *who* is using it, it needs a backend
- **iOS push notifications + background sync** — iOS PWA support is good for offline and installability, but background sync and push notifications are limited compared to Android and desktop
- **Large file processing** — PDF.js and in-browser image processing work, but anything over ~50MB will strain memory on low-end phones. For heavy media workflows, a native app is more appropriate
