# CLAUDE.md

Pension fund tracker for Scottish Widows funds (currently Biotech + Gold; the fund set is swappable via `funds.mjs`). Static frontend (vanilla JS, no build step) + two Vercel serverless functions in `api/`. Live quotes come from Yahoo Finance; portfolio state persists in Vercel KV.

## Architecture

- `funds.mjs` — **the fund list** (names + holdings with Yahoo tickers). The dashboard is generated entirely from this file; swapping funds is a one-file edit. The `factsheets/` folder is the drop zone for the swap workflow (see `factsheets/README.md`): user drops a Trustnet PDF, Claude maps holdings to Yahoo tickers, verifies each with a live quote, rewrites `funds.mjs`.
- `index.html` + `app.mjs` + `style.css` — frontend. `index.html` is just a shell; `app.mjs` builds portfolio rows and dashboard columns from `FUNDS`.
- `uk-time.mjs` — shared UK-time helpers + `DAILY_APPLY_MINUTE`, imported by both `app.mjs` (browser) and `api/funds.mjs` (server).
- `api/quote.mjs` — proxies Yahoo Finance chart API (`query1.finance.yahoo.com/v8/finance/chart/`). Takes `?symbols=` (comma-separated), returns `{c, pc, t}` per ticker. Add `&debug=1` to get per-ticker errors in the response.
- `api/funds.mjs` — GET/POST portfolio state to Vercel KV via REST (`KV_REST_API_URL` / `KV_REST_API_TOKEN` env vars). Actions: `update` (manual edit), `apply-daily` (compound daily % change into fund values). Fund keys are client-driven (`[a-zA-Z0-9_-]{1,64}`), not hardcoded — orphaned keys from old fund sets stay in KV and are ignored by the UI. Renaming a key in `funds.mjs` orphans that fund's stored value.
- Everything is ESM. API files **must** be `.mjs` — we already went CJS-and-back once; Vercel warns/breaks on `.js` here.

## Hard-won rules (each one cost a debugging session — don't relearn them)

### Market data: Yahoo Finance only. Do not switch providers.
We burned a full day cycling Finnhub → Twelve Data → FMP → index ETFs → Finnhub → Marketstack → Yahoo. Every alternative failed on **international symbol coverage or free-tier rate limits**. Holdings use exchange suffixes (`NST.AX`, `EDV.TO` today; `7203.T`, `005930.KS`, `600183.SS`, `2330.TW` in past fund sets) and most free APIs only cover US tickers — and since the fund set is swappable, international coverage can become critical again with any fund swap. If a quote problem comes up, fix it within the Yahoo integration; if a provider change is ever truly needed, first verify the candidate returns data for the *actual* non-US tickers in `funds.mjs` before writing any code.

### Previous close: `meta.previousClose` is the source of truth.
The % change calc was fixed **three separate times**. Final, correct priority (see `api/quote.mjs`):
1. `meta.previousClose` (Yahoo's authoritative value, matches Yahoo/MSN display)
2. Walk the daily `closes` array for the last bar >12h older than `regularMarketTime` — naive `closes[-2]` picks a 2-day-old close when Yahoo hasn't added today's bar yet, inflating % change
3. `meta.chartPreviousClose` as last resort — it is NOT the previous trading day's close and produced wildly inflated numbers as a primary source

Do not "simplify" this fallback chain.

### The daily-apply schedule lives ONLY in `uk-time.mjs`. Don't reintroduce copies.
`DAILY_APPLY_MINUTE` (09:10 UK) used to be duplicated across `app.mjs`, `api/funds.mjs`, and the `index.html` hint text. They drifted (UI said 10:00, client checked 10:00, server checked 19:00) and the endpoint silently refused every apply for 9 hours a day. Now the client check, server gate, UI hint, and error message all derive from the one constant in `uk-time.mjs` — change the schedule there and nowhere else, and never define a local `DAILY_APPLY_MINUTE` or UK-time helper in another file. 09:10 UK was chosen because all Asian markets have closed by then. All time logic uses `Europe/London` via `Intl.DateTimeFormat` — never the server's local clock.

### Secrets never go in `vercel.json` or the repo.
An API key reference was committed once and had to be stripped. All secrets are Vercel project env vars (or `.env.local` locally, which is gitignored).

### Surface errors — never fail silently.
Two past bugs were invisible because errors were swallowed (save failures silently reset values; quote failures showed nothing). Keep the patterns: API handlers return the error message in JSON, `?debug=1` exposes per-ticker fetch errors, and the UI shows save errors instead of resetting state.

## Workflow

- **Test before pushing.** There is no CI; the old workflow was push-to-Vercel-and-see, which produced 26 commits in one day. Yahoo/KV fetch logic is plain `fetch` — exercise it directly with `node -e` or a scratch script against real tickers, or run `vercel dev`, before committing.
- **Update the README when behavior changes.** It went stale (still described Finnhub weeks after the Yahoo switch) and the leftover references caused confusion. If you touch the provider, endpoints, file names, or schedule, fix README.md in the same commit.
- **Write descriptive commit messages** stating the user-visible symptom and the cause (e.g. "Fix inflated % change: use previousClose not chartPreviousClose"), not "Update app.mjs".
