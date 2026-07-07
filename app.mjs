import { FUNDS } from './funds.mjs';

// -----------------------------------------------------------------------------
// Fund value state (loaded from /api/funds). Initialised from FUNDS keys so
// swapping funds in funds.mjs is a one-file change.
// -----------------------------------------------------------------------------
let fundState = {};
for (const key of Object.keys(FUNDS)) {
  fundState[key] = { value: 0, lastApplied: null };
}

// UK time helpers
function getUKDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

function getUKMinutesSinceMidnight() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date());
  const hh = parseInt(parts.find(p => p.type === 'hour').value, 10);
  const mm = parseInt(parts.find(p => p.type === 'minute').value, 10);
  return hh * 60 + mm;
}

const DAILY_APPLY_MINUTE = 9 * 60 + 10; // 09:10 UK

function formatGBP(value) {
  return '£' + Math.round(value || 0).toLocaleString('en-GB');
}

// -----------------------------------------------------------------------------
// DOM builders - generate portfolio rows and dashboard columns from FUNDS.
// -----------------------------------------------------------------------------
function buildPortfolioRows() {
  const container = document.getElementById('portfolioFundRows');
  container.innerHTML = '';
  for (const [key, fund] of Object.entries(FUNDS)) {
    const row = document.createElement('div');
    row.className = 'portfolio-row sub-row';
    row.innerHTML = `
      <span class="portfolio-label">${fund.name}</span>
      <span class="fund-value editable" data-fund="${key}" id="${key}-value">£0</span>
    `;
    container.appendChild(row);
  }
}

function buildDashboardColumns() {
  const grid = document.getElementById('dashboardGrid');
  grid.innerHTML = '';
  for (const [key, fund] of Object.entries(FUNDS)) {
    const col = document.createElement('div');
    col.className = 'fund-column';
    const isinRow = fund.isin ? `<div class="isin">${fund.isin}</div>` : '';
    col.innerHTML = `
      <div class="column-header">
        <h2>${fund.name}</h2>
        ${isinRow}
      </div>
      <div class="holdings" id="${key}-holdings"></div>
      <div class="column-footer">
        <div class="average-label">Top ${fund.holdings.length} Average</div>
        <div class="average-value" id="${key}-avg">–</div>
      </div>
    `;
    grid.appendChild(col);
  }
}

// -----------------------------------------------------------------------------
// Fund state persistence
// -----------------------------------------------------------------------------
async function loadFundState() {
  try {
    const res = await fetch('/api/funds');
    if (res.ok) {
      const data = await res.json();
      if (data && !data.error) {
        // Only pull in keys we know about; ignore orphaned keys from old fund sets
        for (const key of Object.keys(FUNDS)) {
          if (data[key]) fundState[key] = data[key];
        }
      }
    }
  } catch (e) {
    console.error('Failed to load fund state:', e);
  }
  renderFundValues();
}

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
      for (const key of Object.keys(FUNDS)) {
        if (data[key]) fundState[key] = data[key];
      }
      setError('');
    }
  } catch (e) {
    console.error('Failed to save fund value:', e);
    setError('Failed to save value: ' + e.message);
  }
  renderFundValues();
}

async function applyDailyChanges(percentages) {
  try {
    const res = await fetch('/api/funds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'apply-daily', percentages })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.state) {
        for (const key of Object.keys(FUNDS)) {
          if (data.state[key]) fundState[key] = data.state[key];
        }
      }
      console.log('Daily values applied:', data.applied);
    }
  } catch (e) {
    console.error('Failed to apply daily changes:', e);
  }
  renderFundValues();
}

function renderFundValues() {
  let total = 0;
  for (const key of Object.keys(FUNDS)) {
    const el = document.getElementById(`${key}-value`);
    const val = fundState[key]?.value || 0;
    if (el) el.textContent = formatGBP(val);
    total += val;
  }
  document.getElementById('totalValue').textContent = formatGBP(total);
}

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

// -----------------------------------------------------------------------------
// Quote fetching + rendering
// -----------------------------------------------------------------------------
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

async function fetchFundQuotes(tickers) {
  try {
    const symbols = tickers.join(',');
    const res = await fetch(`/api/quote?symbols=${encodeURIComponent(symbols)}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Batch fetch error:', e);
    return {};
  }
}

function calculateChange(current, previous) {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function formatPercent(value) {
  if (value === null) return '–';
  const sign = value >= 0 ? '+' : '';
  return sign + value.toFixed(2) + '%';
}

function getChangeClass(value) {
  if (value === null) return 'change-loading';
  if (value > 0.1) return 'change-positive';
  if (value < -0.1) return 'change-negative';
  return 'change-neutral';
}

async function renderFund(fundKey) {
  const fund = FUNDS[fundKey];
  const holdingsEl = document.getElementById(`${fundKey}-holdings`);
  const avgEl = document.getElementById(`${fundKey}-avg`);

  holdingsEl.innerHTML = '';
  const changes = [];

  const tickers = fund.holdings.map(h => h.ticker);
  const quotesMap = await fetchFundQuotes(tickers);

  fund.holdings.forEach((holding) => {
    const quote = quotesMap[holding.ticker];
    const change = quote ? calculateChange(quote.c, quote.pc) : null;
    changes.push(change);

    const row = document.createElement('div');
    row.className = 'holding-row';
    row.innerHTML = `
      <div class="holding-name">${holding.company}</div>
      <div class="holding-ticker">${holding.ticker}</div>
      <div class="holding-change ${getChangeClass(change)}">${formatPercent(change)}</div>
    `;
    holdingsEl.appendChild(row);
  });

  const validChanges = changes.filter(c => c !== null);
  const avgChange = validChanges.length > 0
    ? validChanges.reduce((a, b) => a + b, 0) / validChanges.length
    : null;

  avgEl.textContent = formatPercent(avgChange);
  avgEl.className = 'average-value ' + getChangeClass(avgChange);

  return avgChange;
}

async function refreshAll() {
  setError('');
  console.log('Refreshing all funds...');

  const fundKeys = Object.keys(FUNDS);
  const results = await Promise.all([
    loadFundState(),
    ...fundKeys.map(k => renderFund(k))
  ]);
  const avgs = results.slice(1);

  const ukMinutes = getUKMinutesSinceMidnight();
  const ukDate = getUKDate();

  if (ukMinutes >= DAILY_APPLY_MINUTE) {
    const percentages = {};
    fundKeys.forEach((key, i) => {
      if (fundState[key] && fundState[key].lastApplied !== ukDate && avgs[i] !== null) {
        percentages[key] = avgs[i];
      }
    });
    if (Object.keys(percentages).length > 0) {
      console.log('Applying daily snapshot:', percentages);
      await applyDailyChanges(percentages);
    }
  }

  updateTimestamp();
}

// -----------------------------------------------------------------------------
// Test button - probes one ticker per fund + one US ticker as a control
// -----------------------------------------------------------------------------
async function testApiKeys() {
  const statusEl = document.getElementById('apiStatus');
  statusEl.textContent = 'Testing…';

  const tests = [];
  for (const [key, fund] of Object.entries(FUNDS)) {
    if (fund.holdings.length > 0) {
      tests.push({ name: `${fund.name} (${fund.holdings[0].ticker})`, ticker: fund.holdings[0].ticker });
    }
  }

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

// -----------------------------------------------------------------------------
// Boot
// -----------------------------------------------------------------------------
window.refreshAll = refreshAll;
window.testApiKeys = testApiKeys;

buildPortfolioRows();
buildDashboardColumns();
document.querySelectorAll('.fund-value.editable').forEach(setupValueEditor);

refreshAll();

setInterval(() => {
  console.log('Auto-refresh triggered');
  refreshAll();
}, 15 * 60 * 1000);
