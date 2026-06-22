# Pension Fund Tracker

Real-time tracking dashboard for Scottish Widows pension funds. Displays the top 10 holdings in each fund with live stock price changes from Finnhub.

## Features

- **4 Pension Funds**: SW SSgA Japan Equity, SW SSgA Asia Pacific ex Japan, SW Veritas Asian, and SW Artemis US Select
- **Top 10 Holdings**: Each fund displays its 10 largest holdings
- **Live Price Changes**: % change from previous market close for each stock
- **Average Performance**: Calculates and displays the average % change for each fund's top 10
- **Auto-Refresh**: Updates data every 15 minutes
- **Responsive Design**: Works on desktop, tablet, and mobile

## Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6 modules)
- **Backend**: Node.js serverless functions (Vercel)
- **Data**: Finnhub Stock API (https://finnhub.io)
- **Deployment**: Vercel

## Setup

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/Parfect66/pension-fund-tracker.git
   cd pension-fund-tracker
   ```

2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

3. Link to Vercel project and run locally:
   ```bash
   vercel
   vercel dev
   ```

4. Open http://localhost:3000 in your browser

### Environment Variables

You need a Finnhub API key. Set it as an environment variable:

```bash
export FINNHUB_KEY=your_api_key_here
```

Or create a `.env.local` file:
```
FINNHUB_KEY=your_api_key_here
```

Get a free API key at https://finnhub.io

### Deployment to Vercel

1. Connect your GitHub repo to Vercel
2. Set the `FINNHUB_KEY` environment variable in Vercel project settings
3. Deploy:
   ```bash
   vercel
   ```

## File Structure

```
pension-fund-tracker/
├── index.html          # Main dashboard page
├── app.mjs             # Frontend JavaScript (fund data, data fetching, rendering)
├── style.css           # Dashboard styling
├── api/
│   └── quote.js        # Finnhub API proxy endpoint
├── package.json        # Project metadata
├── vercel.json         # Vercel deployment config
└── README.md           # This file
```

## API

### GET `/api/quote?symbol=TICKER`

Fetches the latest quote for a stock ticker from Finnhub.

**Parameters:**
- `symbol` (string): Stock ticker symbol (e.g., `NVDA`, `7203.T`, `005930.KS`)

**Response:**
```json
{
  "c": 150.25,      // Current price
  "pc": 149.50,     // Previous close
  "t": 1234567890   // Unix timestamp
}
```

**Allowed symbols** include all holdings from the 4 pension funds.

## Pension Funds Data

### SW SSgA Japan Equity Index Pn CS8
- ISIN: GB00B2PGH611
- Tracks: FTSE World Japan Index
- Holdings: Toyota, Mitsubishi UFJ, Hitachi, etc.

### SW SSgA Asia Pacific ex Japan Pn CS8
- ISIN: GB00B2PGH389
- Tracks: FTSE All-World Developed Asia Pacific ex Japan Index
- Holdings: Samsung, SK Hynix, Commonwealth Bank, etc.

### SW Veritas Asian Pn CS8
- ISIN: GB00BYPG4T70
- Manager: Ezra Sun
- Focus: Taiwan & Korea (chip-heavy)
- Holdings: Samsung, TSMC, Delta Electronics, SK Hynix, etc.

### SW Artemis US Select Pn CS8
- ISIN: GB00BYPFY508
- Managers: Cormac Weldon & Chris Kent
- Focus: US equities
- Holdings: Nvidia, Alphabet, Apple, Goldman Sachs, etc.

## License

Private - All rights reserved
