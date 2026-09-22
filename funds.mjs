// -----------------------------------------------------------------------------
// Scottish Widows pension funds tracked on this dashboard.
//
// To switch funds:
//   1. Edit the FUNDS object below. Each entry needs a unique `key` (used for
//      storage) and a `name`, `isin` (optional), and `holdings` list.
//   2. Each holding is { company, ticker } where ticker is the Yahoo Finance
//      symbol (US = plain, London = .L, Tokyo = .T, Korea = .KS, Taiwan = .TW,
//      Hong Kong = .HK, Australia = .AX, Toronto = .TO, Shanghai = .SS).
//   3. Push to master - the dashboard rebuilds itself around the new list.
//
// Order in the object drives the display order.
// -----------------------------------------------------------------------------

export const FUNDS = {
  pacific: {
    name: 'SW iShares Pacific ex Japan Equity Index CS8',
    isin: 'GB00BMQDJG55',
    weight: 1.0,
    holdings: [
      { company: 'Taiwan Semiconductor Manufacturing', ticker: '2330.TW' },
      { company: 'Samsung Electronics',                 ticker: '005930.KS' },
      { company: 'SK Hynix',                           ticker: '000660.KS' },
      { company: 'BHP Group',                          ticker: 'BHP.AX' },
      { company: 'Commonwealth Bank of Australia',     ticker: 'CBA.AX' },
      { company: 'MediaTek',                           ticker: '2454.TW' },
      { company: 'DBS Group Holdings',                 ticker: 'D05.SI' },
      { company: 'Delta Electronics',                  ticker: '2308.TW' },
      { company: 'Samsung Electronics (Non-Voting)',   ticker: '005380.KS' },
      { company: 'AIA Group',                          ticker: '1299.HK' }
    ]
  }
};
