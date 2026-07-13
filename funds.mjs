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
  biotech: {
    name: 'SW AXA Framlington Biotech CS8',
    isin: '',
    holdings: [
      { company: 'Vertex Pharmaceuticals',    ticker: 'VRTX' },
      { company: 'Gilead Sciences',           ticker: 'GILD' },
      { company: 'Amgen',                     ticker: 'AMGN' },
      { company: 'Regeneron Pharmaceuticals', ticker: 'REGN' },
      { company: 'argenx SE',                 ticker: 'ARGX' },
      { company: 'United Therapeutics',       ticker: 'UTHR' },
      { company: 'Insmed',                    ticker: 'INSM' },
      { company: 'Ionis Pharmaceuticals',     ticker: 'IONS' },
      { company: 'Revolution Medicines',      ticker: 'RVMD' },
      { company: 'Mirum Pharmaceuticals',     ticker: 'MIRM' }
    ]
  },

  // Holdings are ETF proxies tracking the same strategies as the underlying SW
  // unit trusts (most of which are institutional-only X/Pens share classes with
  // no Yahoo Finance coverage). Two actual fund ISINs work directly (.L suffix).
  intl: {
    name: 'SW International CS8',
    isin: 'GB00BMRRZW41',
    holdings: [
      { company: 'SW Global Growth (actual)',       ticker: 'GB00B7WCCL77.L' },
      { company: 'Global Equity (Fundamental Idx)', ticker: 'IWRD.L'         },
      { company: 'US Equity Tracker',               ticker: 'CSPX.L'         },
      { company: 'Climate Transition World Eq',     ticker: 'SUSW.L'         },
      { company: 'Emerging Markets',                ticker: 'EIMI.L'         },
      { company: 'European Equity Tracker',         ticker: 'VEUR.L'         },
      { company: 'Dev Markets Tilted Tracker',      ticker: 'HMWO.L'         },
      { company: 'Fundamental Index EM Equity',     ticker: 'EMVL.L'         },
      { company: 'Global Environmental Solutions',  ticker: 'INRG.L'         },
      { company: 'UK All Share Tracker (actual)',   ticker: 'GB0031905119.L'  }
    ]
  },

  infra: {
    name: 'SW L&G FTSE Dev Core Infrastructure CS8',
    isin: 'GB00BMQDK398',
    holdings: [
      { company: 'Nextera Energy',                   ticker: 'NEE' },
      { company: 'Union Pacific',                    ticker: 'UNP' },
      { company: 'Enbridge',                         ticker: 'ENB' },
      { company: 'Southern Company',                 ticker: 'SO'  },
      { company: 'Duke Energy',                      ticker: 'DUK' },
      { company: 'Williams Companies',               ticker: 'WMB' },
      { company: 'National Grid',                    ticker: 'NGG' },
      { company: 'American Tower',                   ticker: 'AMT' },
      { company: 'CSX',                              ticker: 'CSX' },
      { company: 'Canadian Pacific Kansas City',     ticker: 'CP'  }
    ]
  }
};
