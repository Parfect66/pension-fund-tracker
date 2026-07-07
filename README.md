# Pension Fund Tracker

Live dashboard for Scottish Widows pension funds. Shows each fund's top-10 holdings with daily % moves from Yahoo Finance, tracks your fund values, and compounds each fund's average daily change into its value once per day.

Currently tracked funds (defined in [`funds.mjs`](funds.mjs)):

- **SW AXA Framlington Biotech CS8**
- **SW BlackRock Gold & General CS8**

## Features

- **Swappable funds**: the whole dashboard is generated from the `FUNDS` object in `funds.mjs` — edit that one file to change what's tracked (see [factsheets/README.md](factsheets/README.md) for the drop-a-PDF workflow)
- **Live price changes**: % change from previous close for every holding, via Yahoo Finance
- **Fund value tracking**: click any fund value to edit it; values persist in Vercel KV (Upstash Redis)
- **Daily compounding**: at 09:10 UK time each day, each fund's average holding change is applied once to its stored value
- **Auto-refresh**: quotes refresh every 15 minutes
- **Test API button**: probes one ticker per fund and reports pass/fail

## Stack

- **Frontend**: static HTML/CSS + vanilla JS ES modules — no build step
- **Backend**: two Vercel serverless functions in `api/` (ESM, `.mjs`)
- **Market data**: Yahoo Finance chart API (proxied server-side, no API key needed)
- **Storage**: Vercel KV / Upstash Redis via REST
- **Deployment**: Vercel

## File structure

```
pension-fund-tracker/
├── index.html          # Page shell; containers filled by app.mjs
├── app.mjs             # Frontend: rendering, quote fetching, value editing, daily apply
├── funds.mjs           # THE fund list - names + holdings with Yahoo tickers
├── uk-time.mjs         # Shared UK-time helpers + daily-apply schedule (single source of truth)
├── style.css           # Styling
├── api/
│   ├── quote.mjs       # Yahoo Finance proxy
│   └── funds.mjs       # Fund value persistence (Vercel KV)
├── factsheets/         # Drop fund factsheet PDFs here to have Claude swap funds
├── package.json
├── vercel.json
└── README.md
```

## API

### GET `/api/quote?symbols=TICKER1,TICKER2,...`

Batch-fetches quotes from Yahoo Finance. Tickers use Yahoo's exchange suffixes (`NST.AX`, `EDV.TO`, `7203.T`, `005930.KS`, …).

**Response** (per ticker; `null` if that ticker failed):
```json
{
  "VRTX": { "c": 405.12, "pc": 401.88, "t": 1751875200 },
  "NEM":  { "c": 58.31,  "pc": 57.90,  "t": 1751875200 }
}
```
`c` = current price, `pc` = previous close (Yahoo's `meta.previousClose`), `t` = quote timestamp.

Add `&debug=1` to get `{ result, errors }` with per-ticker error messages.

### GET `/api/funds`

Returns stored fund state: `{ <fundKey>: { value, lastApplied } }`.

### POST `/api/funds`

- `{ "action": "update", "values": { "<fundKey>": 12345 } }` — manual value edit
- `{ "action": "apply-daily", "percentages": { "<fundKey>": 1.23 } }` — compound daily % change into stored values; rejected before 09:10 UK, and applied at most once per fund per UK day

Fund keys are arbitrary (must match `[a-zA-Z0-9_-]{1,64}`); state for funds no longer in `funds.mjs` stays in KV but isn't displayed.

## Setup

### Environment variables

No market-data API key is required. Storage needs a Vercel KV / Upstash Redis database connected to the project, which provides:

```
KV_REST_API_URL
KV_REST_API_TOKEN
```

Set automatically when you connect Upstash via the Vercel integration; put them in `.env.local` (gitignored) for local dev. **Never commit secrets or reference them in `vercel.json`.**

### Local development

```bash
git clone https://github.com/Parfect66/pension-fund-tracker.git
cd pension-fund-tracker
npm install -g vercel
vercel dev
```

Open http://localhost:3000.

### Deployment

Connect the GitHub repo to Vercel; every push to `master` deploys. There is no build step.

## Changing the tracked funds

1. Drop the new fund's factsheet PDF into `factsheets/` (from Trustnet or FE fundinfo).
2. Ask Claude to add or replace the funds — it maps holdings to Yahoo tickers, verifies each with a live quote, and rewrites `funds.mjs`.
3. Push. The dashboard rebuilds itself around the new list.

Or edit `funds.mjs` by hand — the file header documents the format and ticker suffix conventions.

## Changing the daily-apply time

Edit `DAILY_APPLY_MINUTE` in `uk-time.mjs` — the client check, the server gate, and the UI hint all derive from it. It's set to 09:10 UK because all Asian markets have closed by then.
