// Marketstack handler for reliable Asian market data (Taiwan, Korea, Japan, Shanghai).
// Returns last 2 trading days so we can compute prev close for % change.
async function fetchMarketstackQuote(symbol) {
  const key = process.env.MARKETSTACK_KEY;
  if (!key) throw new Error('Marketstack key not configured');

  const url = `https://api.marketstack.com/v2/eod?symbols=${symbol}&access_key=${key}&limit=2`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Marketstack HTTP ' + response.status);

  const data = await response.json();
  if (!data.data || data.data.length === 0) {
    throw new Error(`Marketstack: no data for ${symbol}`);
  }

  const latest = data.data[0];
  const previous = data.data.length > 1 ? data.data[1] : latest;

  return {
    c: latest.adj_close || latest.close,
    pc: previous.adj_close || previous.close,
    t: Math.floor(new Date(latest.date).getTime() / 1000)
  };
}

// FMP (FinancialModelingPrep) fallback for international tickers Marketstack doesn't have.
async function fetchFmpQuote(symbol) {
  const key = process.env.FMP_KEY;
  if (!key) throw new Error('FMP key not configured');

  const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${key}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('FMP HTTP ' + response.status);

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`FMP: no data for ${symbol}`);
  }

  const quote = data[0];
  if (!quote.price || !quote.previousClose) {
    throw new Error(`FMP: missing price data for ${symbol}`);
  }

  return {
    c: quote.price,
    pc: quote.previousClose,
    t: Math.floor(new Date(quote.timestamp * 1000).getTime() / 1000)
  };
}

// FE Precision Plus handler for direct NAV-based daily change.
// Ticker format: "FE:<CitiCode>" — calls the SW pension fund portal.
async function fetchFeQuote(citiCode) {
  const params = {
    FilteringOptions: {
      undefined: 0,
      SearchText: 'International',
      PerformanceOperator: 'GREAT',
      RangeId: null,
      RangeName: '',
      CategoryId: '7gpp01',
      Category2Id: null,
      PriipProductCode: null,
      DefaultCategoryId: null,
      DefaultCategory2Id: null,
      ForSaleIn: null,
      ShowMainUnits: false,
      MPCategoryCode: null
    },
    ProjectName: 'corppen',
    LanguageCode: 'en-GB',
    UserType: '',
    Region: '',
    LanguageId: '1',
    LocaleId: '1',
    Theme: 'cp-am',
    SortingStyle: '',
    PageNo: 1,
    PageSize: 20,
    OrderBy: ':init',
    IsAscOrder: true,
    OverrideDocumentCountryCode: null,
    ToolId: '14',
    PrefetchPages: 100,
    PrefetchPageStart: 1,
    OverridenThemeName: 'cp-am',
    ForSaleIn: '',
    ValidateFeResearchAccess: false,
    HasFeResearchFullAccess: false,
    EnableSedolSearch: 'false',
    GrsProjectId: '36800083',
    UseCombinedOngoingChargeTER: false
  };

  const url = `https://digitalfundservice.feprecisionplus.com/FundDataService.svc/GetRowIdList?jsonString=${encodeURIComponent(JSON.stringify(params))}`;
  const response = await fetch(url, {
    headers: { Referer: 'https://digital.feprecisionplus.com/corppen' }
  });
  if (!response.ok) throw new Error('FE HTTP ' + response.status);

  const raw = await response.json();
  const units = typeof raw.Units === 'string' ? JSON.parse(raw.Units) : raw.Units;
  const dataList = units?.DataList;
  if (!Array.isArray(dataList)) throw new Error('FE: no DataList');

  const entry = dataList.find(d => d?.Price?.CitiCode === citiCode);
  if (!entry) throw new Error(`FE: ${citiCode} not found`);

  const priceObj = entry.Price;
  const price = priceObj?.Price?.Amount;
  const changePct = priceObj?.Change_;

  if (typeof price !== 'number' || typeof changePct !== 'number') {
    throw new Error('FE: missing price/change data');
  }

  const prevClose = price / (1 + changePct / 100);
  const dateStr = priceObj?.PriceDate;
  const t = dateStr ? Math.floor(new Date(dateStr).getTime() / 1000) : Math.floor(Date.now() / 1000);

  return { c: price, pc: prevClose, t };
}

// Exchange suffixes for markets that close BEFORE the US session each day.
// At 09:10 UK the "latest close" for these has already happened this morning UK
// time, whereas US stocks show yesterday's close - misaligning the daily move.
// We shift these back by one bar so the move matches the same trading window.
const ASIA_PAC_SUFFIXES = ['.AX', '.T', '.KS', '.TW', '.HK', '.SS', '.SI'];

function isAsiaPacific(ticker) {
  return ASIA_PAC_SUFFIXES.some(sfx => ticker.endsWith(sfx));
}

// Tickers that should use Marketstack for reliable international data.
// Yahoo Finance is missing recent data for these Asian exchanges.
const MARKETSTACK_SUFFIXES = ['.TW', '.KS', '.T', '.SS'];

function useMarketstack(ticker) {
  return MARKETSTACK_SUFFIXES.some(sfx => ticker.endsWith(sfx));
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
      if (ticker.startsWith('FE:')) {
        result[ticker] = await fetchFeQuote(ticker.slice(3));
      } else if (useMarketstack(ticker)) {
        try {
          result[ticker] = await fetchMarketstackQuote(ticker);
        } catch (e) {
          try {
            // Try FMP if Marketstack fails
            console.warn(`Marketstack failed for ${ticker}, trying FMP:`, e.message);
            result[ticker] = await fetchFmpQuote(ticker);
          } catch (e2) {
            // Final fallback: Yahoo Finance
            console.warn(`FMP failed for ${ticker}, falling back to Yahoo:`, e2.message);
            result[ticker] = await fetchYahooQuote(ticker);
          }
        }
      } else {
        result[ticker] = await fetchYahooQuote(ticker);
      }
    } catch (e) {
      errors.push({ ticker, message: e.message });
      console.error(`Quote fetch failed for ${ticker}:`, e.message);
      result[ticker] = null;
    }
  }));

  res.setHeader('Cache-Control', 's-maxage=300');
  return res.status(200).json(debug ? { result, errors } : result);
}
