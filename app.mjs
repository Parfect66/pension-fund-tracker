// Market-Tracking ETF Data
const fundData = {
  japan: {
    id: 'japan',
    name: 'Japan Market (EWJ)',
    isin: 'iShares MSCI Japan ETF',
    holdings: [
      { company: 'iShares Japan ETF', ticker: 'EWJ' },
      { company: 'Toyota Motor Corporation', ticker: 'TM' },
      { company: 'Sony Group Corporation', ticker: 'SONY' },
      { company: 'Mitsubishi UFJ Financial', ticker: 'MUFG' },
      { company: 'SoftBank Group Corp', ticker: 'SFTBY' },
      { company: 'Hitachi Ltd', ticker: 'HTHIY' },
      { company: 'Honda Motor Company', ticker: 'HMC' },
      { company: 'Daiichi Sankyo Company', ticker: 'DSAKY' },
      { company: 'Takeda Pharmaceutical', ticker: 'TKPYY' },
      { company: 'Shin-Etsu Chemical', ticker: 'SHECY' }
    ]
  },
  asiapac: {
    id: 'asiapac',
    name: 'South Korea Market (EWY)',
    isin: 'iShares MSCI South Korea ETF',
    holdings: [
      { company: 'iShares Korea ETF', ticker: 'EWY' },
      { company: 'Samsung Electronics', ticker: 'SSNLF' },
      { company: 'SK Hynix Inc', ticker: 'SKHHY' },
      { company: 'LG Electronics', ticker: 'LPL' },
      { company: 'NAVER Corporation', ticker: 'NAVER' },
      { company: 'Kakao Corporation', ticker: 'KAKOF' },
      { company: 'Hyundai Motor Company', ticker: 'HYMTF' },
      { company: 'Kia Corporation', ticker: 'KIMTF' },
      { company: 'POSCO Holdings', ticker: 'PSHOF' },
      { company: 'Korean Air Lines', ticker: 'KALAF' }
    ]
  },
  veritas: {
    id: 'veritas',
    name: 'Taiwan Market (EWT)',
    isin: 'iShares MSCI Taiwan ETF',
    holdings: [
      { company: 'iShares Taiwan ETF', ticker: 'EWT' },
      { company: 'Taiwan Semiconductor (TSMC)', ticker: 'TSM' },
      { company: 'MediaTek Inc', ticker: 'MDTK' },
      { company: 'Taiwan Cement', ticker: 'TCMTF' },
      { company: 'Chunghwa Telecom', ticker: 'CHT' },
      { company: 'First Financial Holdings', ticker: 'FFH' },
      { company: 'Pegatron Corporation', ticker: 'PGTRF' },
      { company: 'Lite-On Technology', ticker: 'LTONF' },
      { company: 'Delta Electronics', ticker: 'DELT' },
      { company: 'Taiwan Power Company', ticker: 'TAIPF' }
    ]
  },
  artemis: {
    id: 'artemis',
    name: 'Australia Market (EWA)',
    isin: 'iShares MSCI Australia ETF',
    holdings: [
      { company: 'iShares Australia ETF', ticker: 'EWA' },
      { company: 'Commonwealth Bank of Australia', ticker: 'CBDX' },
      { company: 'National Australia Bank', ticker: 'NABZY' },
      { company: 'Westpac Banking Corporation', ticker: 'WBK' },
      { company: 'BHP Group Limited', ticker: 'BHP' },
      { company: 'Rio Tinto Limited', ticker: 'RIO' },
      { company: 'CSL Limited', ticker: 'CSLLF' },
      { company: 'AMP Limited', ticker: 'AMLTF' },
      { company: 'Stockland', ticker: 'SKLTF' },
      { company: 'Wesfarmers Limited', ticker: 'WFAOF' }
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

// Fetch stock quote
async function fetchQuote(ticker) {
  try {
    const res = await fetch(`/api/quote?symbol=${ticker}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data || typeof data.c !== 'number') throw new Error('Invalid quote');
    return {
      price: data.c,
      previousClose: data.pc,
      timestamp: data.t
    };
  } catch (e) {
    console.error(`Error fetching ${ticker}:`, e);
    return null;
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

  // Fetch all quotes in parallel
  const quotes = await Promise.all(
    fund.holdings.map(h => fetchQuote(h.ticker))
  );

  // Render each holding
  quotes.forEach((quote, idx) => {
    const holding = fund.holdings[idx];
    const change = quote ? calculateChange(quote.price, quote.previousClose) : null;
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
      const res = await fetch(`/api/quote?symbol=${t.ticker}`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return { name: t.name, ok: data && typeof data.c === 'number' };
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
