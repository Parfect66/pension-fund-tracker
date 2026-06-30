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
      { company: 'Hon Precision Inc', ticker: '7769.TW' },
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
      { company: 'Alphabet Inc', ticker: 'GOOG' },
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

// Fund value state (loaded from /api/funds)
let fundState = {
  japan: { value: 0, lastApplied: null },
  asiapac: { value: 0, lastApplied: null },
  veritas: { value: 0, lastApplied: null },
  artemis: { value: 0, lastApplied: null }
};

// UK time helpers
function getUKDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

function getUKHour() {
  return parseInt(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', hour12: false
  }).format(new Date()), 10);
}

function formatGBP(value) {
  return '£' + Math.round(value || 0).toLocaleString('en-GB');
}

// Load fund values from server
async function loadFundState() {
  try {
    const res = await fetch('/api/funds');
    if (res.ok) {
      const data = await res.json();
      if (data && !data.error) fundState = data;
    }
  } catch (e) {
    console.error('Failed to load fund state:', e);
  }
  renderFundValues();
}

// Save edited values to server
async function saveFundValue(fundKey, newValue) {
  try {
    const res = await fetch('/api/funds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', values: { [fundKey]: newValue } })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      console.error('Save failed:', data);
      setError(`Save failed: ${data.error || res.status}. Make sure Upstash Redis is connected and project has redeployed.`);
    } else {
      fundState = data;
      setError('');
    }
  } catch (e) {
    console.error('Failed to save fund value:', e);
    setError('Failed to save value: ' + e.message);
  }
  renderFundValues();
}

// Apply daily change snapshot (after 7pm UK)
async function applyDailyChanges(percentages) {
  try {
    const res = await fetch('/api/funds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'apply-daily', percentages })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.state) fundState = data.state;
      console.log('Daily values applied:', data.applied);
    }
  } catch (e) {
    console.error('Failed to apply daily changes:', e);
  }
  renderFundValues();
}

// Render the portfolio summary values
function renderFundValues() {
  let total = 0;
  for (const key of Object.keys(fundState)) {
    const el = document.getElementById(`${key}-value`);
    if (el) el.textContent = formatGBP(fundState[key].value);
    total += fundState[key].value || 0;
  }
  const totalEl = document.getElementById('totalValue');
  if (totalEl) totalEl.textContent = formatGBP(total);
}

// Make a value editable - click to edit, save on Enter/blur
function setupValueEditor(el) {
  el.addEventListener('click', () => {
    if (el.querySelector('input')) return;
    const fundKey = el.dataset.fund;
    const currentVal = fundState[fundKey]?.value || 0;

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'fund-value-input';
    input.value = Math.round(currentVal);
    input.min = '0';
    input.step = '1';

    el.textContent = '';
    el.appendChild(input);
    input.focus();
    input.select();

    let saved = false;
    const commit = () => {
      if (saved) return;
      saved = true;
      const newVal = parseFloat(input.value);
      if (!isNaN(newVal) && newVal >= 0) {
        saveFundValue(fundKey, newVal);
      } else {
        renderFundValues();
      }
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { input.blur(); }
      if (e.key === 'Escape') { saved = true; renderFundValues(); }
    });
  });
}

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

  return avgChange;
}

// Refresh all funds
async function refreshAll() {
  setError('');
  console.log('Refreshing all funds...');

  // Load saved fund values and quotes in parallel
  const [_, ...avgs] = await Promise.all([
    loadFundState(),
    renderFund('japan'),
    renderFund('asiapac'),
    renderFund('veritas'),
    renderFund('artemis')
  ]);

  const [japanAvg, asiapacAvg, veritasAvg, artemisAvg] = avgs;

  // Apply daily snapshot if past 19:00 UK and not already applied today
  const ukHour = getUKHour();
  const ukDate = getUKDate();

  if (ukHour >= 19) {
    const percentages = {};
    const avgMap = { japan: japanAvg, asiapac: asiapacAvg, veritas: veritasAvg, artemis: artemisAvg };
    for (const [fund, pct] of Object.entries(avgMap)) {
      if (fundState[fund] && fundState[fund].lastApplied !== ukDate && pct !== null) {
        percentages[fund] = pct;
      }
    }
    if (Object.keys(percentages).length > 0) {
      console.log('Applying daily snapshot:', percentages);
      await applyDailyChanges(percentages);
    }
  }

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

// Wire up click-to-edit on fund values
document.querySelectorAll('.fund-value.editable').forEach(setupValueEditor);

// Initial load
refreshAll();

// Auto-refresh every 15 minutes
setInterval(() => {
  console.log('Auto-refresh triggered');
  refreshAll();
}, 15 * 60 * 1000);
