// ============================================================
// PWA App Kit — app.js
// Replace the sample time-tracker logic below with your own.
// The helpers at the top (store, db, toast, etc.) are reusable.
// ============================================================

// --- LocalStorage helpers -----------------------------------

const store = {
  get(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  remove(key)     { localStorage.removeItem(key); },
};

// --- IndexedDB helpers --------------------------------------
// Use these when you have many records (logs, history, library items).
// For simple settings/prefs, stick with store.get/set above.

let _db;

async function initDB(dbName, version, upgrade) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, version);
    req.onupgradeneeded = e => upgrade(e.target.result);
    req.onsuccess  = e => { _db = e.target.result; resolve(_db); };
    req.onerror    = e => reject(e.target.error);
  });
}

function dbSave(storeName, record) {
  return new Promise((resolve, reject) => {
    const tx = _db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(record).onsuccess = e => resolve(e.target.result);
    tx.onerror = e => reject(e.target.error);
  });
}

function dbLoadAll(storeName) {
  return new Promise((resolve, reject) => {
    const tx  = _db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function dbDelete(storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = _db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id).onsuccess = () => resolve();
    tx.onerror = e => reject(e.target.error);
  });
}

// --- Unique ID ----------------------------------------------

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// --- Toast notification -------------------------------------

function showToast(msg, duration = 2000) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

// --- Tab navigation -----------------------------------------

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === target));
      store.set('myApp_lastTab', target);
    });
  });

  const saved = store.get('myApp_lastTab');
  if (saved) {
    const btn = document.querySelector(`.tab-btn[data-tab="${saved}"]`);
    if (btn) btn.click();
  }
}

// --- JSON export --------------------------------------------

function exportJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// --- JSON import --------------------------------------------

function importJSON(callback) {
  const input    = document.createElement('input');
  input.type     = 'file';
  input.accept   = '.json';
  input.onchange = e => {
    const reader   = new FileReader();
    reader.onload  = () => {
      try { callback(JSON.parse(reader.result)); }
      catch { showToast('Invalid file — could not import.'); }
    };
    reader.readAsText(e.target.files[0]);
  };
  input.click();
}

// --- Clipboard copy with button feedback --------------------

async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  if (btn) {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => (btn.textContent = orig), 1500);
  }
}

// ============================================================
// SAMPLE APP: Project Time Tracker
// Delete everything below this line and replace with your app.
// ============================================================

const DB_NAME    = 'pwa-app-kit';
const DB_VERSION = 1;
const STORE      = 'entries';

let entries = [];
let timerInterval = null;
let timerStart    = null;
let activeProject = null;

const TIMER_KEY = 'pwaAppKit_activeTimer';

function saveTimerState() {
  if (activeProject && timerStart) {
    store.set(TIMER_KEY, { project: activeProject, start: timerStart });
  } else {
    store.remove(TIMER_KEY);
  }
}

function resumeTimerUI() {
  document.getElementById('btn-start').disabled = true;
  document.getElementById('btn-stop').disabled  = false;
  document.getElementById('project-input').value = activeProject;
  document.getElementById('timer-project').textContent = activeProject;
  document.getElementById('timer-display').classList.remove('hidden');
  timerInterval = setInterval(updateTimerDisplay, 1000);
  updateTimerDisplay();
}

async function main() {
  await initDB(DB_NAME, DB_VERSION, db => {
    if (!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE, { keyPath: 'id' });
    }
  });

  entries = await dbLoadAll(STORE);
  initTabs();
  renderLog();
  renderSummary();

  // Restore a timer that was running before the page refreshed
  const saved = store.get(TIMER_KEY);
  if (saved && saved.project && saved.start) {
    activeProject = saved.project;
    timerStart    = saved.start;
    resumeTimerUI();
  }

  document.getElementById('btn-start').addEventListener('click', startTimer);
  document.getElementById('btn-stop').addEventListener('click', stopTimer);
  document.getElementById('btn-export').addEventListener('click', doExport);
}

function startTimer() {
  const project = document.getElementById('project-input').value.trim();
  if (!project) { showToast('Enter a project name first.'); return; }
  if (timerInterval) { showToast('Timer is already running.'); return; }

  activeProject = project;
  timerStart    = Date.now();
  saveTimerState();
  timerInterval = setInterval(updateTimerDisplay, 1000);

  document.getElementById('btn-start').disabled = true;
  document.getElementById('btn-stop').disabled  = false;
  document.getElementById('timer-project').textContent = project;
  document.getElementById('timer-display').classList.remove('hidden');
}

async function stopTimer() {
  if (!timerInterval) return;

  clearInterval(timerInterval);
  timerInterval = null;

  const duration = Date.now() - timerStart;
  const entry = {
    id:       uid(),
    project:  activeProject,
    start:    timerStart,
    end:      Date.now(),
    duration, // ms
  };

  await dbSave(STORE, entry);
  entries.push(entry);

  store.remove(TIMER_KEY);

  document.getElementById('btn-start').disabled = false;
  document.getElementById('btn-stop').disabled  = true;
  document.getElementById('timer-display').classList.add('hidden');
  document.getElementById('timer-clock').textContent = '0:00:00';

  renderLog();
  renderSummary();
  showToast(`Logged ${formatDuration(duration)} to "${activeProject}"`);
  activeProject = null;
}

function updateTimerDisplay() {
  const elapsed = Date.now() - timerStart;
  document.getElementById('timer-clock').textContent = formatDuration(elapsed);
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function renderLog() {
  const list = document.getElementById('entry-list');
  if (!entries.length) {
    list.innerHTML = '<div class="empty-state"><p>No entries yet. Start a timer to log time.</p></div>';
    return;
  }

  const sorted = [...entries].sort((a, b) => b.start - a.start);
  list.innerHTML = sorted.map(e => `
    <div class="item-row">
      <div>
        <div class="item-label">${e.project}</div>
        <div class="item-meta">${new Date(e.start).toLocaleString()}</div>
      </div>
      <div class="flex gap-sm" style="align-items:center">
        <span class="item-value">${formatDuration(e.duration)}</span>
        <button class="btn btn-ghost btn-sm" onclick="deleteEntry('${e.id}')">✕</button>
      </div>
    </div>
  `).join('');
}

function renderSummary() {
  const totals = {};
  for (const e of entries) {
    totals[e.project] = (totals[e.project] || 0) + e.duration;
  }

  const container = document.getElementById('summary-list');
  const projects  = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  if (!projects.length) {
    container.innerHTML = '<div class="empty-state"><p>No data yet.</p></div>';
    return;
  }

  container.innerHTML = projects.map(([name, ms]) => `
    <div class="item-row">
      <span class="item-label">${name}</span>
      <span class="item-value">${formatDuration(ms)}</span>
    </div>
  `).join('');
}

async function deleteEntry(id) {
  await dbDelete(STORE, id);
  entries = entries.filter(e => e.id !== id);
  renderLog();
  renderSummary();
}

function doExport() {
  if (!entries.length) { showToast('Nothing to export yet.'); return; }
  const date = new Date().toISOString().slice(0, 10);
  exportJSON({ exported: date, entries }, `time-log-${date}.json`);
  showToast('Exported.');
}

main();
