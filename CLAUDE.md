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

### Model in use
`claude-sonnet-4-6` — called via the `anthropic()` helper function in `App.jsx`.

### Usage in the app
The Claude API is used to parse Indonesian bank statement PDFs (UOB, Danamon, and others). The model receives the PDF text and returns structured JSON with transaction data.

### Indonesian date parsing
Bank statements use non-ISO date formats; `parseIndoDate()` handles:
- `DD MEI` / `DD AGU` — UOB style (Indonesian month abbreviations via `ID_MONTHS`)
- `DD/MM` — Danamon style (no year — infers current year, rolls back if future date)
- `YYYY-MM-DD` — ISO passthrough
- `DD/MM/YYYY` and `DD-MM-YY` — generic fallback via `normDate()`
- `ID_MONTHS` now also accepts English aliases: `MAY`, `AUG`, `OCT`, `DEC`

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
| `accounts` | `id` uuid | Bank/card/wallet/investment accounts |
| `transactions` | `id` uuid | All financial transactions |
| `goals` | `id` uuid | Savings goals |
| `subscriptions` | `id` uuid | Recurring SaaS/service subscriptions |
| `parties` | `id` uuid | People (for split payments and loans) |
| `memory` | `user_id,merchant_key` | AI-learned merchant→category mappings |
| `trip_meta` | `user_id,trip_key` | Travel trip metadata (purpose, banner, name) |
| `statements` | `id` uuid | Monthly credit card statements |
| `loans` | `id` uuid | Loans given to people |
| `loan_payments` | `id` uuid | Payment records against a loan |
| `profiles` | `id` uuid | User profile (scopes, role, status, email) |
| `balance_history` | `user_id,account_id,recorded_at` | Daily balance snapshots per account |
| `import_history` | `id` uuid | PDF import log (filename, hash, tx count) |

### `accounts` — extended fields
- `type` now allows `'investment'` in addition to `credit/debit/qris/e-wallet/cash`
- `credit_limit`, `balance_owed`, `points` are `numeric` (not integer) — supports fractional shares, coupon rates, USD prices
- Investment sub-types: `"Gold"`, `"Stocks"`, `"Mutual Funds"`, `"Crypto"`, `"Bonds"` (stored in `holder` field)

### `transactions` — extended fields
- `pinned_trip_key text` — allows manually pinning a transaction to a specific trip, overriding the auto gap-detection algorithm

### `profiles` — extended fields (admin console)
- `status text` — `'pending'` | `'approved'` | `'rejected'` | `'disabled'`
- `approved_at timestamptz`, `approved_by uuid`
- `last_seen_at timestamptz` — updated on every app load (non-impersonation only)
- `email text`, `display_name text` — mirrored for admin display without joining `auth.users`

### RLS
All tables have Row Level Security. Default policy is `user_id = auth.uid()`. The `profiles` table uses `id = auth.uid()`.

**Admin bypass:** An `is_admin()` SECURITY DEFINER function checks `profiles.role = 'admin'`. Admin read-all policies are OR'd onto every table so admins can view all users' data. Admins can also update `profiles` (approve/suspend/toggle role).

> **Note:** Migration `20260622000009_admin_console.sql` is marked "Run manually in Supabase SQL Editor — do NOT run via CLI" due to `SECURITY DEFINER` requirements.

### UUID generation
Use `gen_random_uuid()` in SQL (not `uuid_generate_v4()` — the extension is not enabled on this project).

Use `crypto.randomUUID()` for client-side UUID generation.

### Unique constraints
- `memory`: `UNIQUE (user_id, merchant_key)` — required for `syncTableByKey` upsert
- `trip_meta`: `UNIQUE (user_id, trip_key)` — required for `syncTableByKey` upsert
- `balance_history`: composite PK `(user_id, account_id, recorded_at)` — upserted directly, not via syncTable

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
Every table has conversion functions at module level in `App.jsx`:
- `toDb*(obj, userId)` → DB row (snake_case)
- `fromDb*(row)` → JS object (camelCase)

| Function | Table |
|---|---|
| `toDbAccount` / `fromDbAccount` | `accounts` |
| `toDbTx` / `fromDbTx` | `transactions` |
| `toDbGoal` / `fromDbGoal` | `goals` |
| `toDbSub` / `fromDbSub` | `subscriptions` |
| `toDbParty` / `fromDbParty` | `parties` |
| `toDbStatement` / `fromDbStatement` | `statements` |
| `toDbImportHistory` / `fromDbImportHistory` | `import_history` |
| `fromDbBalHist` | `balance_history` (read-only via upsert) |
| `fromDbLoan` / `fromDbLoanPayment` | `loans` / `loan_payments` |

Never access DB columns by camelCase — always go through these converters.

---

## Data Sync Pattern

### Debounced sync (600 ms)
State for `accounts`, `transactions`, `goals`, `subscriptions`, `parties`, `memory`, `trip_meta`, `statements`, and `import_history` is synced to Supabase via debounced `useEffect` hooks (600 ms delay). Sync only fires when `ready === true` AND `impersonating === false`.

### syncTable / syncTableByKey
```
syncTable(table, userId, rows, onError?)  — for tables with uuid `id` PK
syncTableByKey(table, userId, rows, keyCol)  — for tables with composite natural key
                                               (memory → user_id,merchant_key)
                                               (trip_meta → user_id,trip_key)
```
Both use **upsert-first then delete-stale** (not delete-all then insert). This prevents data loss if upsert fails. `syncTable` accepts an optional `onError(table, message)` callback — used to surface sync errors to the UI via `syncError` state.

### `balance_history` — special sync
Balance history is **not** synced via `syncTable`. Instead a dedicated effect upserts today's snapshot directly using `onConflict: "user_id,account_id,recorded_at"`. This avoids ever deleting historical snapshots.

### Critical guard: `setReady(true)` placement
`setReady(true)` is called **only inside the `try` block** of `loadAllData`, after all state setters have completed. If loading fails, `ready` stays `false`, all sync effects are disabled, and a `loadError` state triggers a retry UI. Never move `setReady` into a `finally` block.

### Impersonation guard
All sync effects also check `if (impersonating) return` — admins viewing another user's data must never trigger writes that would overwrite that user's records.

### Stale-fetch cancellation
The load effect sets a `cancelled` flag on cleanup. If the user switches impersonation targets quickly, the stale fetch result is ignored.

### LoansPage — direct writes
The `LoansPage` component manages its own `loans` and `payments` state with **direct Supabase calls** (insert, update, delete). It does not use the debounced sync pattern and does not participate in top-level state.

---

## Pages & Navigation

Navigation uses a `tab` state string. On mobile: a bottom nav bar (4 primary tabs) + "More" dropdown. On desktop: a persistent left sidebar showing all tabs.

### Primary tabs (bottom bar / top of sidebar)
| Tab | Component | Description |
|---|---|---|
| `overview` | Overview | Home — spending summary, charts, net worth |
| `transactions` | Transactions | Full transaction list + filters |
| `import` | Import | PDF bank statement import via Claude |

### Secondary pages (More menu / bottom of sidebar)
| Tab | Component |
|---|---|
| `travel` | Travel card view grouped by trip |
| `subscriptions` | Recurring subscription tracker |
| `people` | People (parties) + FadlanPayLater split tracker |
| `loans` | Loans given to others |
| `accountsDetail` | My Accounts (balances, investment portfolio, details) |
| `statements` | Monthly credit card statement tracker |
| `goals` | Savings goals |
| `about` | About Me / profile |

### Admin Console
Accessible only to users with `profile.role === 'admin'`. Shown as a separate entry in the sidebar and More menu (not in `moreTabs` array). Renders `AdminConsole` component in place of the main `App` layout, with tabs: Overview, Users, Pending.

**Impersonation:** Admin can view any user's data in read-only mode. An `ImpersonationBanner` is shown at the top of the screen while impersonating.

### Account flow sub-page relationships
- **Setup** (`accounts`) is a sub-page of **My Accounts** (`accountsDetail`). Setup has a "Back to My Accounts" button; My Accounts has a "Manage Accounts" button.
- `accountsDetail` now has three views: **Credit**, **Debit**, **Investment**.

---

## Key Patterns & Conventions

### Brand palette
All colors come from the `BRAND` object. Never hardcode hex values outside of it.
```js
BRAND = { blue, blueDark, blueLight, blueTint, red, redDark, ..., gold, plum, success, slate, olive, ink }
```
Note: `BRAND.blue` is `#3B6FD4` (updated from `#476C9B` in an earlier version).

### Category system
Categories are broader than before and include sub-categories:
- `"Online Food Orders"` — GrabFood, GoFood, ShopeeFood, etc.
- `"Coffee n Cafe"` — coffee shop transactions
- `"Ride Hailing"` — Gojek, Grab (non-food), Maxim, etc.
- `"Mobile App Subscription"` — Apple, Google Play, Spotify, Netflix, etc.

The `enrich(desc)` function now matches these before falling through to SaaS/fee detection.

### Currency formatting
- `idr(n)` — Indonesian Rupiah, no decimals
- `fmtMoney(amount, currency)` — multi-currency aware

### FX rates
Live exchange rates are fetched from `open.er-api.com/v6/latest/IDR` on app mount. Stored in `fxRates` state as IDR per 1 unit of each foreign currency. Used in Overview and AccountsDetail to convert foreign-currency balances to IDR equivalents.

### Investment accounts
Tracked in `accountsDetail` under the "Investment" tab. Each investment has:
- `holder` — sub-type: `"Gold"`, `"Stocks"`, `"Mutual Funds"`, `"Crypto"`, `"Bonds"`
- `creditLimit` — quantity held (shares, grams, units, bonds)
- `balanceOwed` — current price per unit
- `points` — average buy price (or coupon rate % for bonds)
- `balance` — market value (computed display only, not stored separately)

### Import deduplication
`import_history` stores a hash of each imported PDF. On upload, the app checks for an existing record with the same `(user_id, file_hash)` and warns before re-importing.

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

A transaction can be **pinned** to a specific trip via `pinnedTripKey` — this overrides the auto-grouping. Stored in `transactions.pinned_trip_key`.

Inline trip name editing: click the name in the TripCard header to activate an `<input>` with `autoFocus`. Committing (blur or Enter) saves to `tripMeta` state which syncs to DB.

### SaaS auto-detection
The `SAAS` array contains ~65 known SaaS merchant keywords. `enrich(desc)` matches them and auto-assigns `category: "Subscriptions"`, `scope: "work"`, `recurring: true`.

### Access control flow
On app load, `main.jsx` reads `profile.status`:
- `'pending'` → show `PendingCard` (waiting for admin approval)
- `'rejected'` / `'disabled'` → show `DeniedCard`
- `'approved'` + `role === 'admin'` → show `AdminConsole` toggle in nav
- `'approved'` → show normal `App`

---

## Security Rules

1. **Never commit `.env.local`** — the `*.local` pattern in `.gitignore` covers it. Verify before every commit.
2. **Never commit `supabase/.temp/`** — added to `.gitignore`. Contains the linked-project reference but no secrets.
3. **Anthropic API key stays server-side** — the Vite proxy is the only place it appears. Do not put it in any client-side code or log it.
4. **Supabase anon key** — safe to ship in client code (RLS enforces access control). The service-role key must never appear in the client.
5. **Impersonation is read-only** — all sync effects are gated on `!impersonating`. Never remove this guard.

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

### `syncTableByKey` requires unique constraints
`syncTableByKey` uses Supabase upsert with `onConflict: "user_id,<keyCol>"`. This requires a `UNIQUE (user_id, key_col)` constraint to exist on the table. Migrations 20260621000002 and 20260621000008 add these for `memory` and `trip_meta`.

### `accounts_type_check` constraint blocked investment accounts
The original `accounts` table had a CHECK constraint limiting `type` to `credit/debit/qris/e-wallet/cash`. Adding `type='investment'` silently failed the entire upsert batch. Fixed in migration 20260621000004 by dropping and recreating the constraint with `'investment'` included.

### Admin console migration must run manually
Migration `20260622000009_admin_console.sql` uses `SECURITY DEFINER` functions and must be run directly in the Supabase SQL Editor — not via `supabase db push`.
