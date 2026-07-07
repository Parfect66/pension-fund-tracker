// Exchange suffixes for markets that close BEFORE the US session each day.
// At 09:10 UK the "latest close" for these has already happened this morning UK
// time, whereas US stocks show yesterday's close - misaligning the daily move.
// We shift these back by one bar so the move matches the same trading window.
const ASIA_PAC_SUFFIXES = ['.AX', '.T', '.KS', '.TW', '.HK', '.SS', '.SI'];

function isAsiaPacific(ticker) {
  return ASIA_PAC_SUFFIXES.some(sfx => ticker.endsWith(sfx));
}

async function fetchYahooQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=10d`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }

  const data = await response.json();

  if (data.chart?.error) {
    throw new Error(data.chart.error.description || data.chart.error.code || 'Yahoo error');
  }

  const result = data.chart?.result?.[0];
  if (!result?.meta) {
    throw new Error('No data returned');
  }

  const meta = result.meta;

  // Non-Asia/Pacific (i.e. US, TO, L): use Yahoo's authoritative fields.
  if (!isAsiaPacific(symbol)) {
    const price = meta.regularMarketPrice;
    let prevClose = meta.previousClose;

    if (typeof prevClose !== 'number') {
      const closes = result.indicators?.quote?.[0]?.close;
      const timestamps = result.timestamp;
      const todayTs = meta.regularMarketTime || Math.floor(Date.now() / 1000);
      if (Array.isArray(closes) && Array.isArray(timestamps)) {
        for (let i = timestamps.length - 1; i >= 0; i--) {
          if (typeof closes[i] === 'number' && (todayTs - timestamps[i]) > 43200) {
            prevClose = closes[i];
            break;
          }
        }
      }
    }
    if (typeof prevClose !== 'number') prevClose = meta.chartPreviousClose;

    if (typeof price !== 'number' || typeof prevClose !== 'number') {
      throw new Error('Missing price data');
    }
    return {
      c: price,
      pc: prevClose,
      t: meta.regularMarketTime || Math.floor(Date.now() / 1000)
    };
  }

  // Asia/Pacific: shift back one bar so the displayed change matches the
  // "yesterday US close" window, not this morning's local close.
  const closes = result.indicators?.quote?.[0]?.close;
  const timestamps = result.timestamp;
  if (!Array.isArray(closes) || !Array.isArray(timestamps)) {
    throw new Error('Missing chart data for shifted quote');
  }

  // Collect valid (close, ts) pairs, newest first
  const pairs = [];
  for (let i = timestamps.length - 1; i >= 0; i--) {
    if (typeof closes[i] === 'number') {
      pairs.push({ close: closes[i], ts: timestamps[i] });
    }
    if (pairs.length >= 4) break;
  }

  if (pairs.length < 3) {
    throw new Error('Not enough historical bars for Asia/Pacific shift');
  }

  // pairs[0] = today's local close (just closed this morning UK)
  // pairs[1] = yesterday's local close  <-- use as "current" for alignment
  // pairs[2] = day-before-yesterday's local close  <-- use as "prev close"
  const price = pairs[1].close;
  const prevClose = pairs[2].close;

  if (typeof price !== 'number' || typeof prevClose !== 'number') {
    throw new Error('Missing price data');
  }

  return {
    c: price,
    pc: prevClose,
    t: pairs[1].ts
  };
}

export default async function handler(req, res) {
  const { symbols, debug } = req.query;

  if (!symbols) {
    return res.status(400).json({ error: 'Missing symbols parameter' });
  }

  const symbolList = symbols.split(',');
  const result = {};
  const errors = [];

  await Promise.all(symbolList.map(async (ticker) => {
    try {
      result[ticker] = await fetchYahooQuote(ticker);
    } catch (e) {
      errors.push({ ticker, message: e.message });
      console.error(`Yahoo fetch failed for ${ticker}:`, e.message);
      result[ticker] = null;
    }
  }));

  res.setHeader('Cache-Control', 's-maxage=300');
  return res.status(200).json(debug ? { result, errors } : result);
}
