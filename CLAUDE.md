# FinPlus — Claude Code Reference

FinPlus is a personal finance PWA built with React + Vite, backed by Supabase (auth + database) and Claude AI (bank statement parsing). All application logic lives in a single file: `src/App.jsx`.

---

## Project Identity

- **Author:** Ahmad Fadlan Awriya — `ahmadfadlan.awriya@gmail.com` / GitHub: `ahmadfadlanawriya`
- **Stack:** React 19, Vite 8, Tailwind CSS 3, Supabase JS v2, Recharts, Lucide React
- **Dev server:** `npm run dev` → `http://localhost:5174`
- **Build:** `npm run build`
- **Repository:** `https://github.com/ahmadfadlanawriya/FinPlus`

---

## Architecture

### Single-file app
All pages, components, hooks, and utilities live in `src/App.jsx`. Do not split into separate files unless the user explicitly requests it.

### File map
```
src/
  App.jsx         — entire application (pages, components, DB layer)
  App.css         — minimal global styles
  main.jsx        — React DOM entry point
  supabase.js     — Supabase client (reads VITE_* env vars)
  index.css       — Tailwind base import
supabase/
  migrations/     — SQL migration files (applied via `supabase db push`)
vite.config.js    — Vite config + Anthropic proxy middleware
.env.local        — API keys (NEVER commit — covered by *.local in .gitignore)
CLAUDE.md         — this file
```

### Environment variables (`.env.local`)
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ANTHROPIC_API_KEY=...
```
The Anthropic key is kept server-side only via the Vite proxy — it is never sent to the browser.

---

## Anthropic / Claude Integration

### Proxy architecture
`vite.config.js` registers a dev-server middleware at `/api/claude`. Browser code POSTs to `/api/claude`; the middleware forwards to `https://api.anthropic.com/v1/messages` with the API key injected server-side. The key is read from `.env.local` at startup and never exposed to the client.

**Production note:** This proxy only works in `vite dev`. For a deployed build, a real server-side proxy (Vercel function, Edge Function, etc.) must replace it.

### Usage in the app
The Claude API is used to parse Indonesian bank statement PDFs (UOB, Danamon, and others). The model receives the PDF text and returns structured JSON with transaction data.

### Indonesian date parsing
Bank statements use non-ISO date formats; `parseIndoDate()` handles:
- `DD MEI` / `DD AGU` — UOB style (Indonesian month abbreviations via `ID_MONTHS`)
- `DD/MM` — Danamon style (no year — infers current year, rolls back if future date)
- `YYYY-MM-DD` — ISO passthrough
- `DD/MM/YYYY` and `DD-MM-YY` — generic fallback via `normDate()`

### Transaction direction classifier
AI `kind` labels are unreliable. The app re-derives direction deterministically:
```
classifyDirection(desc, aiKind, hasCR)
  → "payment"  if desc contains payment keywords (pembayaran, paymt, thru e-bank, …)
  → "income"   if hasCR flag or aiKind === "refund"
  → "expense"  (default)
```

---

## Supabase Database

### Tables
| Table | Key | Purpose |
|---|---|---|
| `accounts` | `id` uuid | Bank/card/wallet accounts |
| `transactions` | `id` uuid | All financial transactions |
| `goals` | `id` uuid | Savings goals |
| `subscriptions` | `id` uuid | Recurring SaaS/service subscriptions |
| `parties` | `id` uuid | People (for split payments and loans) |
| `memory` | `merchant_key` text | AI-learned merchant→category mappings |
| `trip_meta` | `trip_key` text | Travel trip metadata (purpose, banner, name) |
| `statements` | `id` uuid | Monthly credit card statements |
| `loans` | `id` uuid | Loans given to people |
| `loan_payments` | `id` uuid | Payment records against a loan |
| `profiles` | `id` uuid | User profile (scopes, role) |

### RLS
All tables have Row Level Security. Every policy is `user_id = auth.uid()`. The `profiles` table uses `id = auth.uid()`.

### UUID generation
Use `gen_random_uuid()` in SQL (not `uuid_generate_v4()` — the extension is not enabled on this project).

Use `crypto.randomUUID()` for client-side UUID generation.

### Migrations
Migration files live in `supabase/migrations/` and are applied with:
```
supabase db push
```
Supabase CLI login uses a token (non-interactive):
```
supabase login --token <token>
supabase link --project-ref <ref>
```

### camelCase ↔ snake_case mapping
Every table has a pair of conversion functions at module level in `App.jsx`:
- `toDb*(obj, userId)` → DB row (snake_case)
- `fromDb*(row)` → JS object (camelCase)

Never access DB columns by camelCase — always go through these converters.

---

## Data Sync Pattern

### Debounced sync (600 ms)
State for `accounts`, `transactions`, `goals`, `subscriptions`, `parties`, `memory`, `trip_meta`, and `statements` is synced to Supabase via debounced `useEffect` hooks (600 ms delay). Sync only fires when `ready === true`.

### syncTable / syncTableByKey
```
syncTable(table, userId, rows)         — for tables with uuid `id` PK
syncTableByKey(table, userId, rows, keyCol)  — for tables with natural text PK
                                               (memory → merchant_key, trip_meta → trip_key)
```
Both use **upsert-first then delete-stale** (not delete-all then insert). This prevents data loss if upsert fails.

### Critical guard: `setReady(true)` placement
`setReady(true)` is called **only inside the `try` block** of `loadAllData`, after all state setters have completed. If loading fails, `ready` stays `false`, all sync effects are disabled, and a `loadError` state triggers a retry UI. Never move `setReady` into a `finally` block.

### LoansPage — direct writes
The `LoansPage` component manages its own `loans` and `payments` state with **direct Supabase calls** (insert, update, delete). It does not use the debounced sync pattern and does not participate in top-level state.

---

## Pages & Navigation

Navigation uses a `tab` state string. The bottom bar shows the primary tabs; a "More" sheet exposes secondary pages.

### Primary tabs
| Tab | Component | Description |
|---|---|---|
| `dashboard` | Dashboard | Spending overview, charts |
| `transactions` | Transactions | Full transaction list + filters |
| `upload` | Upload | PDF bank statement import via Claude |
| `more` | — | Bottom sheet with secondary pages |

### Secondary pages (moreTabs)
| Tab | Component |
|---|---|
| `travel` | Travel card view grouped by trip |
| `subscriptions` | Recurring subscription tracker |
| `people` | People (parties) + FadlanPayLater split tracker |
| `loans` | Loans given to others |
| `accountsDetail` | My Accounts (balances, details) |
| `statements` | Monthly credit card statement tracker |
| `goals` | Savings goals |
| `about` | About Me / profile |

### Sub-page relationships
- **Setup** (`accounts`) is a sub-page of **My Accounts** (`accountsDetail`). The Setup page has a "Back to My Accounts" button; My Accounts has a "Manage Accounts" button.
- **accountsDetail** is the primary accounts view. **accounts** (Setup) is for adding/editing accounts.

---

## Key Patterns & Conventions

### Brand palette
All colors come from the `BRAND` object. Never hardcode hex values outside of it.
```js
BRAND = { blue, blueDark, blueLight, blueTint, red, redDark, ..., gold, plum, success, slate, olive, ink }
```

### Currency formatting
- `idr(n)` — Indonesian Rupiah, no decimals
- `fmtMoney(amount, currency)` — multi-currency aware

### Render helpers vs React components inside a component
**Do not define React components as inner functions inside another component.** On every re-render React sees a new function type, causing unmount + remount, which breaks input focus.

Use plain render-helper functions instead:
```js
// WRONG — causes focus loss bug
function PayForm({ loanId }) { return <input ... /> }
// CORRECT
function renderPayForm(loanId) { return <input ... /> }
// Called as: {renderPayForm(id)} not <PayForm id={id} />
```

### WhatsApp links
`whatsappLink(phone, message)` normalizes Indonesian phone numbers (leading 0 → 62) and returns a `wa.me` deep link.

### Travel grouping
Transactions are grouped into trips by a gap-detection algorithm (`TRIP_GAP_DAYS = 5`). Trip metadata (purpose, banner image, display name) is stored in `tripMeta` (synced to `trip_meta` table). The `trip_key` is derived from the trip's date range.

Inline trip name editing: click the name in the TripCard header to activate an `<input>` with `autoFocus`. Committing (blur or Enter) saves to `tripMeta` state which syncs to DB.

### SaaS auto-detection
The `SAAS` array contains ~60 known SaaS merchant keywords. `enrich(desc)` matches them and auto-assigns `category: "Subscriptions"`, `scope: "work"`, `recurring: true`.

---

## Security Rules

1. **Never commit `.env.local`** — the `*.local` pattern in `.gitignore` covers it. Verify before every commit.
2. **Never commit `supabase/.temp/`** — added to `.gitignore`. Contains the linked-project reference but no secrets.
3. **Anthropic API key stays server-side** — the Vite proxy is the only place it appears. Do not put it in any client-side code or log it.
4. **Supabase anon key** — safe to ship in client code (RLS enforces access control). The service-role key must never appear in the client.

---

## Common Commands

```bash
# Dev server
npm run dev

# Apply DB migrations
supabase db push

# Lint
npm run lint

# Production build
npm run build

# Push to GitHub (must run from a terminal with GUI access for GCM auth)
git push
```

---

## Known Issues & History

### Input focus loss in form fields
Defining React components as inner functions of a parent component causes them to remount on every parent re-render. Fixed by converting to plain render helper functions (`renderPayForm`, `renderPayHistory`, etc.).

### Data wipe on page refresh
`setReady(true)` placed in a `finally` block fired even when `loadAllData` threw an error. Empty state arrays then triggered sync effects that deleted all Supabase data. Fixed by: (1) moving `setReady(true)` into the `try` block, (2) adding `loadError` state + retry screen, (3) using upsert-first sync.

### `uuid_generate_v4()` not available
The `uuid-ossp` extension is not enabled on this Supabase project. Use `gen_random_uuid()` in all SQL.

### `git push` requires interactive terminal
Git Credential Manager opens a browser window for GitHub auth — this cannot run in Claude's sandboxed shell. Always push from VS Code's integrated terminal or PowerShell directly.
