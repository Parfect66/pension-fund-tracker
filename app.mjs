// Scottish Widows Pension Fund Holdings
const fundData = {
  japan: {
    id: 'japan',
    name: 'SW SSgA Japan Equity Index Pn CS8',
    isin: 'GB00B2PGH611',
    holdings: [
      { company: 'Toyota Motor Corporation', ticker: '7203.T' },
      { company: 'Mitsubishi UFJ Financial Group', ticker: '8306.T' },
      { company: 'Hitachi Ltd', ticker: '6501.T' },
      { company: 'Advantest Corporation', ticker: '6857.T' },
      { company: 'SoftBank Group Corp', ticker: '9984.T' },
      { company: 'Mitsui Sumitomo Insurance Co', ticker: '8725.T' },
      { company: 'Tokyo Electron Limited', ticker: '8035.T' },
      { company: 'Sony Group Corporation', ticker: '6758.T' },
      { company: 'Mitsubishi Corporation', ticker: '8058.T' },
      { company: 'Mizuho Financial Group', ticker: '8411.T' }
    ]
  },
  asiapac: {
    id: 'asiapac',
    name: 'SW SSgA Asia Pacific ex Japan Pn CS8',
    isin: 'GB00B2PGH389',
    holdings: [
      { company: 'Samsung Electronics Co Ltd', ticker: '005930.KS' },
      { company: 'SK Hynix Inc', ticker: '000660.KS' },
      { company: 'Commonwealth Bank of Australia', ticker: 'CBA.AX' },
      { company: 'AIA Group Limited', ticker: '1299.HK' },
      { company: 'Westpac Banking Corporation', ticker: 'WBC.AX' },
      { company: 'DBS Group Holdings Ltd', ticker: 'D05.SI' },
      { company: 'National Australia Bank Limited', ticker: 'NAB.AX' },
      { company: 'Samsung Electronics (Preferred)', ticker: '005935.KS' },
      { company: 'Australia & New Zealand Banking Group', ticker: 'ANZ.AX' },
      { company: 'Hong Kong Exchanges & Clearing', ticker: '0388.HK' }
    ]
  },
  veritas: {
    id: 'veritas',
    name: 'SW Veritas Asian Pn CS8',
    isin: 'GB00BYPG4T70',
    holdings: [
      { company: 'Samsung Electronics', ticker: '005930.KS' },
      { company: 'Taiwan Semiconductor (TSMC)', ticker: '2330.TW' },
      { company: 'Delta Electronics', ticker: '2308.TW' },
      { company: 'SK Hynix', ticker: '000660.KS' },
      { company: 'Hon Precision Inc', ticker: '2354.TW' },
      { company: 'HD Hyundai Heavy Industries', ticker: '329180.KS' },
      { company: 'Elite Material Co Ltd', ticker: '2383.TW' },
      { company: 'Accton Technology Corporation', ticker: '2345.TW' },
      { company: 'MediaTek', ticker: '2454.TW' },
      { company: 'Shengyi Technology Co Ltd-A', ticker: '600183.SS' }
    ]
  },
  artemis: {
    id: 'artemis',
    name: 'SW Artemis US Select Pn CS8',
    isin: 'GB00BYPFY508',
    holdings: [
      { company: 'Nvidia Corp', ticker: 'NVDA' },
      { company: 'Alphabet Class A', ticker: 'GOOGL' },
      { company: 'Bank of New York Mellon', ticker: 'BNY' },
      { company: 'Apple Inc', ticker: 'AAPL' },
      { company: 'Goldman Sachs Group', ticker: 'GS' },
      { company: 'Cardinal Health', ticker: 'CAH' },
      { company: 'Targa Resources Corp', ticker: 'TRGP' },
      { company: 'Walmart Inc', ticker: 'WMT' },
      { company: 'Broadcom Inc', ticker: 'AVGO' },
      { company: 'Parker-Hannifin Corp', ticker: 'PH' }
    ]
  }
};

// UI Helpers
function setError(msg) {
  const box = document.getElementById('errorBox');
  if (msg) {
    box.textContent = msg;
    box.classList.add('show');
  } else {
    box.classList.remove('show');
  }
}

function updateTimestamp() {
  document.getElementById('lastUpdated').textContent =
    'Last updated: ' + new Date().toLocaleString();
}

// Fetch all quotes for a fund in a single batched API call
async function fetchFundQuotes(tickers) {
  try {
    const symbols = tickers.join(',');
    const res = await fetch(`/api/quote?symbols=${encodeURIComponent(symbols)}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return data; // { ticker: { c, pc, t } | null }
  } catch (e) {
    console.error('Batch fetch error:', e);
    return {};
  }
}

// Calculate percentage change
function calculateChange(current, previous) {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

// Format percentage for display
function formatPercent(value) {
  if (value === null) return '–';
  const sign = value >= 0 ? '+' : '';
  return sign + value.toFixed(2) + '%';
}

// Get CSS class for change color
function getChangeClass(value) {
  if (value === null) return 'change-loading';
  if (value > 0.1) return 'change-positive';
  if (value < -0.1) return 'change-negative';
  return 'change-neutral';
}

// Render holdings for a fund
async function renderFund(fundKey) {
  const fund = fundData[fundKey];
  const holdingsEl = document.getElementById(`${fundKey}-holdings`);
  const avgEl = document.getElementById(`${fundKey}-avg`);

  holdingsEl.innerHTML = '';
  let changes = [];

  // Fetch all quotes in a single batched API call
  const tickers = fund.holdings.map(h => h.ticker);
  const quotesMap = await fetchFundQuotes(tickers);

  // Render each holding
  fund.holdings.forEach((holding) => {
    const quote = quotesMap[holding.ticker];
    const change = quote ? calculateChange(quote.c, quote.pc) : null;
    changes.push(change);

    const row = document.createElement('div');
    row.className = 'holding-row';

    const name = document.createElement('div');
    name.className = 'holding-name';
    name.textContent = holding.company;

    const ticker = document.createElement('div');
    ticker.className = 'holding-ticker';
    ticker.textContent = holding.ticker;

    const changeEl = document.createElement('div');
    changeEl.className = `holding-change ${getChangeClass(change)}`;
    changeEl.textContent = formatPercent(change);

    row.appendChild(name);
    row.appendChild(ticker);
    row.appendChild(changeEl);
    holdingsEl.appendChild(row);
  });

  // Calculate and display average
  const validChanges = changes.filter(c => c !== null);
  let avgChange = null;
  if (validChanges.length > 0) {
    avgChange = validChanges.reduce((a, b) => a + b, 0) / validChanges.length;
  }

  avgEl.textContent = formatPercent(avgChange);
  avgEl.className = getChangeClass(avgChange);
}

// Refresh all funds
async function refreshAll() {
  setError('');
  console.log('Refreshing all funds...');

  await Promise.all([
    renderFund('japan'),
    renderFund('asiapac'),
    renderFund('veritas'),
    renderFund('artemis')
  ]);

  updateTimestamp();
}

// Test API keys
async function testApiKeys() {
  const statusEl = document.getElementById('apiStatus');
  statusEl.textContent = 'Testing…';

  const tests = [
    { name: 'Stock quote (NVDA)', ticker: 'NVDA' },
    { name: 'Stock quote (7203.T)', ticker: '7203.T' },
    { name: 'Stock quote (005930.KS)', ticker: '005930.KS' },
    { name: 'Stock quote (2330.TW)', ticker: '2330.TW' }
  ];

  const results = await Promise.all(tests.map(async t => {
    try {
      const res = await fetch(`/api/quote?symbols=${encodeURIComponent(t.ticker)}`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const quote = data[t.ticker];
      return { name: t.name, ok: quote && typeof quote.c === 'number' };
    } catch (e) {
      return { name: t.name, ok: false, err: e.message };
    }
  }));

  const lines = results.map(r =>
    `${r.ok ? '✅' : '❌'} ${r.name}${r.ok ? '' : ' – ' + r.err}`
  );

  statusEl.innerHTML = lines
    .map(l => l.includes('✅')
      ? `<span class="ok">${l}</span>`
      : `<span class="fail">${l}</span>`
    )
    .join('<br>');
}

// Expose functions
window.refreshAll = refreshAll;
window.testApiKeys = testApiKeys;

// Initial load
refreshAll();

// Auto-refresh every 15 minutes
setInterval(() => {
  console.log('Auto-refresh triggered');
  refreshAll();
}, 15 * 60 * 1000);
