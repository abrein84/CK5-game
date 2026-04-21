# Game Prototype Bootstrap

You are setting up a new game prototype project from scratch. This file contains every step — execute them all in order. **Install every missing tool automatically.** Do not stop and ask the user to install something themselves unless manual action is truly unavoidable — and even then, give step-by-step instructions as if explaining to someone who has never opened a terminal before.

Do not ask for permission for every individual file or folder created. Propose all file and folder creations/updates in a single plan, then execute them all at once after a single confirmation.

For Windows, always provide terminal commands for Windows PowerShell (or Command Prompt). Do not use Git Bash, MinGW, or Unix-style syntax unless explicitly requested.

## What you're building

A mobile-portrait web game prototype using React + TypeScript + Vite + Tailwind. The architecture is designed for rapid AI-assisted iteration:

- **Data-driven tuning:** Game parameters live in CSV files in `data/`, loaded at runtime. Changing a value and refreshing the browser is the primary iteration loop — no rebuild needed.
- **Living documentation:** Project docs in `project_context/` are the shared memory across sessions. They stay current as a byproduct of working, not as a separate chore. CLAUDE.md tells future sessions which docs to load and what rules to follow.
- **Fail-fast validation:** CSV loading validates schemas on startup. Bad data surfaces immediately, not as a mysterious runtime bug.

After completing these steps, the user should have a running dev server showing a splash screen, and the project should be ready for feature work.

## Audience

The user may be non-technical (designer, producer, or leader exploring AI-assisted development). **You handle everything.** Never say "install X yourself" when you can do it. Never use jargon without a plain-English explanation alongside it. If something goes wrong, explain what happened in plain language — for example, say "the tool that runs JavaScript isn't installed yet" instead of "Node.js is not in your PATH."

---

## Step 0: Platform detection and tool setup

Before scaffolding, identify the operating system, then check and install every required tool for that platform. Report what you find and what you install as you go.

### 0a. Detect the operating system

Run:

```bash
uname -s 2>/dev/null || echo "Windows_NT"
```

Interpret the output:

- `Darwin` → **macOS** — follow macOS instructions throughout this step.
- `Linux` → **Linux** — follow Linux instructions throughout this step.
- `Windows_NT` (or command not found) → **Windows** — follow Windows instructions throughout this step.

Tell the user: "You're running [platform]. I'll set up everything you need."

**Windows note:** On Windows, Claude Code may run commands through PowerShell, cmd, or Git Bash depending on what's installed. At this point in setup, use PowerShell for all installation commands (Git Bash may not exist yet). Once Git is installed in step 0d, Git Bash becomes available — prefer it for the rest of setup, as it supports Unix-style commands used in later steps.

---

### 0b. Windows: Install Chocolatey

*Skip this section entirely on macOS and Linux.*

Chocolatey is a package manager for Windows — it installs software from the command line the same way Homebrew does on macOS. Check if it's already installed:

```powershell
choco --version
```

If the command prints a version number, skip to 0c.

If missing, install it. Open PowerShell **as Administrator** (right-click the Start button → "Windows PowerShell (Admin)" or "Terminal (Admin)") and run:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

This takes 1–2 minutes. After it finishes, **close and reopen the terminal** so the `choco` command becomes available, then confirm it's working:

```powershell
choco --version
```

**Important:** All subsequent `choco install` commands must be run in a terminal opened as Administrator, or they will fail with a permissions error. If you see "Access denied" or "elevation required", close the terminal, reopen it as Administrator, and retry.

---

### 0c. Node.js 18+

Node.js is the engine that runs the development server. npm (the package manager) comes bundled with it.

Check if it's installed and recent enough:

```bash
node --version
```

If the output is `v18.x.x` or higher, skip to 0d. If the command fails, or the version is below 18, install it:

#### macOS

First check for Homebrew (macOS's package manager — it installs developer tools cleanly):

```bash
brew --version
```

If Homebrew is missing, install it. This takes 2–5 minutes and may ask for the user's Mac login password — characters won't appear while typing, which is normal:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After Homebrew installs, it may print instructions to add it to PATH (lines starting with `echo 'eval...'`). Run those commands exactly as printed before continuing.

Then install Node.js:

```bash
brew install node
```

#### Windows

```powershell
choco install nodejs-lts -y
```

After installation finishes: **close and reopen the terminal** (or restart Claude Code). Windows doesn't make newly installed programs available until the terminal restarts.

#### Linux — Ubuntu, Debian, Pop!_OS, Linux Mint

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

If asked for a password, it's the user's login password. Characters won't appear as they type — that's normal.

#### Linux — Fedora, RHEL, CentOS, Rocky, AlmaLinux

```bash
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo dnf install -y nodejs
```

#### Linux — Arch, Manjaro

```bash
sudo pacman -S --noconfirm nodejs npm
```

#### Confirm

After installing, verify both tools are present:

```bash
node --version
npm --version
```

Both should print version numbers. If either fails, something went wrong during install — read the error carefully and retry, or ask the user to restart their terminal and try again.

---

### 0d. Git

Git is the version control tool that saves project history and enables collaboration.

Check if it's installed:

```bash
git --version
```

If missing:

#### macOS

```bash
brew install git
```

(Install Homebrew first if needed — see 0c above.)

#### Windows

```powershell
choco install git -y
```

After installation: **restart the terminal.** Git for Windows also installs **Git Bash**, which provides a Unix-style shell. After restarting, Claude Code can use bash-style commands for the rest of setup — prefer Git Bash over PowerShell going forward.

#### Linux — Ubuntu / Debian

```bash
sudo apt-get install -y git
```

#### Linux — Fedora / RHEL

```bash
sudo dnf install -y git
```

#### Linux — Arch

```bash
sudo pacman -S --noconfirm git
```

---

### 0e. Git identity

Check if a name is configured:

```bash
git config --global user.name
```

If the output is empty, ask the user:

> "Git needs your name and email to label your work. These stay on your computer only — they don't create any accounts. What name and email should it use?"

Then set them:

```bash
git config --global user.name "Their Name"
git config --global user.email "their@email.com"
```

---

### 0f. VS Code (recommended, not required)

```bash
code --version
```

If missing, let the user know it's optional but useful:

> "VS Code is a free code editor that works well with this project. It's not required — any editor works — but it's a good choice if you don't have one. Would you like me to install it?"

If yes:

- **macOS:** `brew install --cask visual-studio-code`
- **Windows:** `choco install vscode -y`
- **Linux (Ubuntu/Debian):** `sudo snap install code --classic` — or download from [code.visualstudio.com/download](https://code.visualstudio.com/download)
- **Linux (Fedora):** `sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc && sudo sh -c 'echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/vscode.repo' && sudo dnf install code`

---

Once all checks pass, summarize what was found and what was installed. Then proceed.

---

## Step 1: Ask for project info

Ask the user:
1. **Project name** — display name for the game (e.g., "Dragon Merge", "Puzzle Quest")
2. **One-line description** — what the game is in one sentence

Use these throughout. If the user already provided them in their message, proceed.

---

## Step 2: Create directory structure

**macOS and Linux** (also works in Git Bash on Windows):

```bash
mkdir -p app/src/data
mkdir -p app/src/components
mkdir -p app/src/engine
mkdir -p data/sprites
mkdir -p project_context
mkdir -p project_plans/active
mkdir -p project_plans/archive
mkdir -p .claude/skills/version-bump
```

**Windows (PowerShell fallback)** — only if bash is not available:

```powershell
New-Item -ItemType Directory -Force -Path app/src/data, app/src/components, app/src/engine, data/sprites, project_context, project_plans/active, project_plans/archive, .claude/skills/version-bump
```

---

## Step 3: Create package.json and install dependencies

Create `package.json`:

```json
{
  "name": "__PROJECT_SLUG__",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host --port 5173 --clearScreen false",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4",
    "vite": "^5.4.2"
  }
}
```

Replace `__PROJECT_SLUG__` with the project name in lowercase-kebab-case.

Run `npm install`.

---

## Step 4: Build tool configuration

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  root: "app",
  plugins: [react()],
  publicDir: "../data",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./app/src", import.meta.url)),
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
```

Note: `publicDir: "../data"` means everything in `data/` is served at the root URL. A file at `data/config.csv` is fetched as `/config.csv`. This is what makes the data-driven architecture work — CSV files are accessible at runtime without import.

Create `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{ts,tsx,html}"],
  theme: { extend: {} },
  plugins: [],
};
```

Create `postcss.config.cjs`:

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./app/src/*"] }
  },
  "include": ["app/src"]
}
```

---

## Step 5: App shell

Create `app/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="mobile-web-app-capable" content="yes" />
  <title>__PROJECT_NAME__</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

Create `app/src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Create `app/src/App.tsx`:

```tsx
import { useState, useEffect, useLayoutEffect } from "react";

export default function App() {
  const [config, setConfig] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetch("/config.csv")
      .then((r) => r.text())
      .then((text) => {
        const lines = text.trim().split("\n").slice(1);
        const map = new Map<string, string>();
        for (const line of lines) {
          const [key, ...rest] = line.split(",");
          map.set(key.trim(), rest.join(",").trim());
        }
        setConfig(map);
      });
  }, []);

  // ── Viewport management ──────────────────────────────────
  // Keeps --app-height, --game-height, --game-width in sync with the
  // real visible area. Handles mobile URL bar show/hide, keyboard popup,
  // orientation changes, and pinch zoom — all the things that make
  // mobile viewport sizing unreliable with pure CSS.
  useLayoutEffect(() => {
    const root = document.documentElement;
    let rafId = 0;
    const update = () => {
      const vv = window.visualViewport;
      const w = vv?.width ?? window.innerWidth;
      const h = vv?.height ?? window.innerHeight;
      const maxW = parseFloat(getComputedStyle(root).getPropertyValue("--app-max-width")) || 400;
      const maxH = parseFloat(getComputedStyle(root).getPropertyValue("--app-max-height")) || 800;
      root.style.setProperty("--app-height", `${Math.round(h)}px`);
      root.style.setProperty("--game-width", `${Math.round(Math.min(w, maxW))}px`);
      root.style.setProperty("--game-height", `${Math.min(Math.round(h), maxH)}px`);
    };
    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => { rafId = 0; update(); });
    };
    update();
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
    };
  }, []);

  return (
    <div className="app-shell relative mx-auto flex w-full flex-col overflow-hidden">
      <div className="game-screen flex flex-col items-center justify-center gap-6">
        {/* Replace with your logo: drop an image in data/sprites/logo.png */}
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <span className="text-white text-4xl font-bold">?</span>
        </div>
        <h1 className="text-2xl font-bold ink-strong">
          {config.get("app_name") || "Loading..."}
        </h1>
        <p className="text-sm ink-soft">v0.1.0</p>
        <button className="ui-cta mt-4">Start</button>
      </div>
    </div>
  );
}
```

Create `app/src/styles.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Theme tokens ──────────────────────────────────────── */

:root {
  --app-height: 100dvh;
  --app-max-width: 400px;
  --app-max-height: 800px;
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}

html {
  /* Light theme — duplicate this block with [data-theme="dark"] to add a dark mode */
  --bg: linear-gradient(170deg, #f8f6f0 0%, #eee8d5 100%);
  --panel: rgba(255, 255, 255, 0.92);
  --text: #1a1a2e;
  --text-muted: #6b7280;
  --border: rgba(0, 0, 0, 0.1);
  --accent: #4f46e5;
  --ink-strong: var(--text);
  --ink-soft: var(--text-muted);
  --ink-inverse: #ffffff;
  --surface-strong: var(--panel);
}

/* ── Base reset ────────────────────────────────────────── */

* { box-sizing: border-box; }

html, body {
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #000;
  color: var(--text);
  height: var(--app-height, 100vh);
  min-height: var(--app-height, 100vh);
  position: fixed;
  width: 100%;
  margin: 0;
}

/* ── App viewport ──────────────────────────────────────── */
/* app-shell: the phone-shaped frame. Capped at max-width/max-height,
   centered on desktop. Fills the screen on mobile. Black body
   background shows around the frame on desktop like a phone bezel. */

.app-shell {
  max-width: var(--app-max-width, 400px);
  height: var(--game-height, var(--app-height, 100vh));
  min-height: var(--game-height, var(--app-height, 100vh));
  background: var(--bg);
  padding-top: calc(0.375rem + var(--safe-top));
  padding-bottom: calc(0.375rem + var(--safe-bottom));
  padding-left: calc(0.5rem + var(--safe-left, 0px));
  padding-right: calc(0.5rem + var(--safe-right, 0px));
  margin-top: max(0px, calc((var(--app-height, 100vh) - var(--game-height, 100vh)) / 2));
  margin-bottom: max(0px, calc((var(--app-height, 100vh) - var(--game-height, 100vh)) / 2));
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.06);
}

/* game-screen: fills the app-shell, use as the content container */
.game-screen {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* app-screen: fixed full-viewport layer for overlays and effects */
.app-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: var(--app-height, 100vh);
}

/* ── Semantic text ─────────────────────────────────────── */

.ink-strong { color: var(--ink-strong); }
.ink-soft { color: var(--ink-soft); }
.ink-inverse { color: var(--ink-inverse); }

/* ── Button hierarchy ──────────────────────────────────── */

.ui-cta {
  background: linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent), black 20%));
  color: white;
  border: 1px solid color-mix(in srgb, var(--accent), transparent 50%);
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: filter 0.15s;
}
.ui-cta:active { filter: brightness(0.9); }

.ui-button {
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: filter 0.15s;
}
.ui-button:active { filter: brightness(0.95); }

.ui-disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* ── Panel ─────────────────────────────────────────────── */

.ui-panel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}
```

---

## Step 6: Starter data

Create `data/config.csv`:

```
key,value
app_name,__PROJECT_NAME__
```

Replace `__PROJECT_NAME__` with the actual project name.

---

## Step 7: Data loader utility

Create `app/src/data/loadData.ts`:

```ts
/**
 * Generic CSV loader with header validation.
 *
 * Files in data/ are served at root by Vite (publicDir = "../data"),
 * so data/config.csv is fetched as /config.csv.
 */

export interface CsvRow {
  [column: string]: string;
}

export async function loadCsv(
  path: string,
  requiredColumns?: string[]
): Promise<CsvRow[]> {
  const res = await fetch(`/${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split("\n");
  if (lines.length === 0) throw new Error(`${path} is empty`);

  const header = lines[0].split(",").map((h) => h.trim());

  // Fail-fast: validate required columns
  if (requiredColumns) {
    for (const col of requiredColumns) {
      if (!header.includes(col)) {
        throw new Error(`${path}: missing required column "${col}"`);
      }
    }
  }

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: CsvRow = {};
    header.forEach((col, i) => {
      row[col] = values[i]?.trim() ?? "";
    });
    return row;
  });
}

export async function loadConfig(): Promise<Map<string, string>> {
  const rows = await loadCsv("config.csv", ["key", "value"]);
  return new Map(rows.map((r) => [r.key, r.value]));
}
```

---

## Step 8: Project documentation

### CLAUDE.md (project root)

Create `CLAUDE.md`:

```markdown
# Claude Code Instructions

Read these baseline docs at session start:

- @project_context/PROJECT.md
- @project_context/ARCHITECTURE.md
- @project_context/DATA.md
- @project_context/WORKING_MODEL.md
- @project_context/UI_STANDARDS.md

Read specialist docs only when working on those areas (add as the project grows):

- (none yet)

## Key rules

- Follow commit conventions and doc update rules in WORKING_MODEL.md.
- Prefer data-driven changes in `data/*.csv` over hard-coded tuning.
- Keep changes localized; avoid refactors unless required.
- React + TypeScript + Vite + Tailwind stack (`app/` directory).
- **UI consistency:** Check `UI_STANDARDS.md` and `styles.css` for existing patterns before building new UI. Use established classes (`ui-cta`, `ui-button`, `ui-panel`, `ink-strong`, `ink-soft`, etc.) when they fit. When a new pattern is genuinely needed, add it as a reusable CSS class in `styles.css` with CSS variables for tunables. Then document it in `UI_STANDARDS.md`.
```

### project_context/PROJECT.md

```markdown
# __PROJECT_NAME__

__PROJECT_DESCRIPTION__

## Core gameplay loop

(Describe the main player actions and feedback loops here as they emerge.)

## Run locally

\`\`\`bash
npm install
npm run dev
\`\`\`

Open the Vite dev server URL (defaults to `http://localhost:5173`).

## Testing

- Save/Load: (describe persistence approach when implemented)
- Resetting: clear site data or use an incognito window.
```

### project_context/ARCHITECTURE.md

```markdown
# Architecture Map

## Key files

- `app/index.html`: Vite entry HTML.
- `app/src/main.tsx`: React entry point.
- `app/src/App.tsx`: Main app shell and UI layout.
- `app/src/styles.css`: Tailwind base, theme variables, viewport management (app-shell/game-screen/app-screen).
- `app/src/data/loadData.ts`: CSV loading + validation.
- `data/config.csv`: Global tunables.

## Data flow

- CSVs in `data/` are loaded at runtime via `loadData.ts` (Vite `publicDir` points to `../data`). See DATA.md for CSV schemas.
- Game state lives in React state (context/reducer pattern when complexity warrants it).

## Where to change things

- React UI: `app/src/App.tsx` + `app/src/components/*`
- Game state + rules: `app/src/engine/*` (create files as needed)
- Data loading + validation: `app/src/data/loadData.ts`
- Tuning values: `data/config.csv` or new CSV files (document in DATA.md)
```

### project_context/DATA.md

```markdown
# Data Reference

All CSVs live in `data/` and are loaded at runtime. Values are read as strings and parsed to numbers where expected.

## data/config.csv

- Schema: `key,value`
- Meaning: global tunables.
- Example rows:
  - `app_name,__PROJECT_NAME__`

## Validation rules

- When adding a new CSV, document its schema and constraints in this file.
- Use fail-fast validation in `loadData.ts` — missing required columns should throw on load, not fail silently at runtime.
```

### project_context/DESIGN.md

```markdown
# Design

## North Star

(What is this game trying to prove? What feelings should the player have?)

## Design Principles

(Add principles here as they emerge from design discussions. Each should capture a recurring "why" that guided multiple decisions.)

## Core Loop

(Describe the core gameplay loop here.)

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
```

### project_context/WORKING_MODEL.md

```markdown
# Working Model

## AI Collaboration Principles

This document describes collaboration principles for working with AI coding assistants on this project.

## Sources of truth

| Doc | What it covers |
|-----|----------------|
| PROJECT.md | What the repo is, how to run it |
| ARCHITECTURE.md | Code structure, data flow, where to change things |
| DATA.md | CSV schemas, column types, validation rules |
| DESIGN.md | Design intent, principles, decision log |
| UI_STANDARDS.md | Button/panel/interaction patterns |

Feature plans live in `project_plans/active/` (move to `archive/` when shipped).

## How to treat docs vs active iteration

These docs are a shared baseline snapshot, not a gate.

- **DATA.md is strict.** CSV schemas and invariants must be respected. If a change implies a schema change, update DATA.md and code together.
- **DESIGN.md is directional.** It should not block implementation. If we're actively experimenting, the latest chat messages override DESIGN.md until we commit the direction.
- **PROJECT.md and ARCHITECTURE.md describe current behavior.** Update them when behavior changes.

Conflict handling:

- If a chat request conflicts with PROJECT/ARCH/DESIGN: call it out briefly, then proceed with the chat request.
- If a chat request conflicts with DATA/schema invariants: stop and propose the minimal schema + code updates needed.

## Doc update rules

When code changes land, update docs based on what changed:

| What changed | Update |
|---|---|
| CSV schema (new column, new file, changed constraints) | DATA.md (required) |
| New game behavior or rule change | PROJECT.md |
| New file, moved file, changed file responsibility | ARCHITECTURE.md |
| Design decision or direction change | DESIGN.md |
| New button/panel pattern or visual rule | UI_STANDARDS.md |
| Major feature plan | `project_plans/active/*.md` |

If a change doesn't affect any of these, no doc update is needed.

## Feature plans

When brainstorming or planning a major feature, create a plan doc in `project_plans/active/`. Plans are living documents. Once shipped, move to `project_plans/archive/` and migrate stable parts into the appropriate `project_context/` docs.

Plan template:

```
# Feature Name
Status: Active / Shipped / Abandoned
Last updated: YYYY-MM-DD

## Problem
What's broken, missing, or limiting today.

## Design
How it works from the player perspective.

## Implementation
Technical approach.

## Open Questions
Unresolved product or technical questions.
```

**Stub data in plans:** Feature plans that introduce new CSVs must include stub CSV data (realistic example rows) inline. Seeing concrete data catches schema problems that abstract column tables miss.

## Commit conventions

**Never commit or push without explicit approval.** When a task reaches a natural completion point, suggest committing and note what would be included — but wait for confirmation.

**Only commit files from this session.** Multiple people may be editing concurrently. Only stage files that were created or modified during the current session.

When committing:

1. Stage only files relevant to the change (not `git add -A`).
2. First line: imperative summary, under 70 characters.
3. Body: 1-3 sentences of context (what motivated the change, any non-obvious decisions).
4. Include doc updates in the same commit when needed per the table above.
5. Do not commit secrets (.env, credentials, API keys).

## Git workflow

| Branch | Purpose |
|---|---|
| `dev` | Active development |
| `staging` | Shared preview |
| `main` | Production |

Rules:

- Commit to whatever branch is currently checked out. Do not switch branches before committing.
- Before starting work, pull latest: `git pull`.
- Push to your dev branch freely.
- Run `npm run build` before merging to `staging` or `main`.

Never:

- Force-push to `staging` or `main`.
- Commit `node_modules/`, `.env`, or credential files.

## Debugging rule

When debugging, avoid guessing.

- Prefer fail-fast errors and explicit logging over silent fallbacks.
- When context is missing, read the relevant file(s) before making assumptions.
```

### project_context/UI_STANDARDS.md

```markdown
# UI Standards

Codified visual and interaction patterns for consistent UI. `app/src/styles.css` is the source of truth for implementation.

## Core Rule

Prefer existing utility classes and patterns before inventing a one-off treatment.

If a new pattern is genuinely needed, add it as a reusable CSS class in `styles.css` and document it here.

## Button Hierarchy

| Class | Use | Examples |
|-------|-----|----------|
| `ui-cta` | Primary positive actions that advance the current flow | Start, Continue, Confirm |
| `ui-button` | Secondary actions and navigation | Close, Back, Info |
| `ui-disabled` | Visually disabled non-interactive state | Locked features, unavailable actions |

Rules:

- Use `ui-cta` for forward momentum, not every clickable thing.
- Pair `ui-disabled` with actual non-interactivity (`disabled` attribute or click guard).

## Panel Styles

| Class | Use |
|-------|-----|
| `ui-panel` | Solid themed panels, dialogs, detail cards |

## Text

| Context | Class |
|---------|-------|
| Primary text | `ink-strong` |
| Secondary / muted text | `ink-soft` |
| Text on dark / image backgrounds | `ink-inverse` |

## Touch and Pointer Rules

- Target touch areas should be at least ~44px.
- Decorative elements should use `pointer-events-none`.
- Rapid taps on spend/claim buttons must not create duplicate actions.
```

---

## Step 9: Skills

### .claude/skills/version-bump/SKILL.md

```markdown
---
name: version-bump
description: Bump the game version (patch, minor, or major), create a git tag, and commit.
---

# Version Bump

Bump the semver version in `package.json`, create the corresponding git tag, and commit.

## Steps

1. Ask the user which segment to bump: **patch**, **minor**, or **major**.
2. Read the current version from `package.json`.
3. Compute the new version:
   - **patch**: increment patch (e.g., 0.1.0 -> 0.1.1)
   - **minor**: increment minor, reset patch (e.g., 0.1.2 -> 0.2.0)
   - **major**: increment major, reset minor+patch (e.g., 0.2.1 -> 1.0.0)
4. Show: `Version: {old} -> {new}`. Ask for confirmation.
5. Update `"version"` in `package.json`.
6. Stage and commit: `git add package.json && git commit -m "Bump version to {new}"`
7. Create git tag: `git tag v{new}`
8. Report success. Do NOT push automatically.
```

---

## Step 10: Git initialization

Create `.gitignore`:

```
node_modules/
dist/
.env
.env.*
.DS_Store
*.log
```

Then run:

```bash
git init
git add -A
git commit -m "Bootstrap project scaffold

Data-driven game prototype with React + TypeScript + Vite + Tailwind.
Includes project documentation structure, CSV data layer, and
collaboration workflow for AI-assisted development."
```

---

## Step 11: Verify

Run `npm run dev` and confirm the app loads at `http://localhost:5173`. The splash screen should show the project name (read from `config.csv`), a placeholder logo, and a Start button.

**Windows note:** If a Windows Firewall dialog appears asking whether to allow Node.js through the firewall, click "Allow access." This is required for the dev server to be reachable — both locally and from other devices on your network.

Tell the user:

> "Project is ready. The dev server is running at http://localhost:5173."

Also mention:

> "To test on your phone, look for the **Network** URL printed in the terminal just below the Local URL — it will look like `http://192.168.x.x:5173`. Open that address in your phone's browser. Your phone needs to be on the same Wi-Fi network as this computer."
