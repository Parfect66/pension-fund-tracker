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
  climate: {
    name: 'SW BlackRock ACS Climate Transition CS8',
    isin: 'GB00BMQDJL09',
    weight: 0.36,
    holdings: [
      { company: 'Nvidia',            ticker: 'NVDA' },
      { company: 'Apple',             ticker: 'AAPL' },
      { company: 'Microsoft',         ticker: 'MSFT' },
      { company: 'Amazon',            ticker: 'AMZN' },
      { company: 'Alphabet A',        ticker: 'GOOGL' },
      { company: 'Alphabet C',        ticker: 'GOOG' },
      { company: 'Broadcom',          ticker: 'AVGO' },
      { company: 'Mastercard',        ticker: 'MA'   },
      { company: 'Meta Platforms',    ticker: 'META' },
      { company: 'Tesla',             ticker: 'TSLA' }
    ]
  },

  artemis: {
    name: 'SW Artemis US Select CS8',
    isin: 'GB00BMRS2P98',
    weight: 0.36,
    holdings: [
      { company: 'Nvidia',               ticker: 'NVDA' },
      { company: 'Alphabet A',           ticker: 'GOOGL' },
      { company: 'Bank of New York Mellon', ticker: 'BNY' },
      { company: 'Advanced micro devices',  ticker: 'AMD' },
      { company: 'Goldman Sachs',        ticker: 'GS'   },
      { company: 'Cardinal Health',      ticker: 'CAH'  },
      { company: 'MICRON TECHNOLOGY',      ticker: 'MU' },
      { company: 'Amazon.com inc',       ticker: 'AMZN'  },
      { company: 'JB HUNT',             ticker: 'JBHT' },
      { company: 'ely lilly',             ticker: 'LLY'   }
    ]
  },

  veritas: {
    name: 'SW Veritas Asian Pn CS8',
    isin: 'GB00BMRS3K19',
    weight: 0.28,
    holdings: [
      { company: 'Taiwan Semiconductor',         ticker: '2330.TW'   },
      { company: 'SK hynix',                     ticker: '000660.KS' },
      { company: 'Samsung Electronics',          ticker: '005930.KS' },
      { company: 'Delta Electronics',            ticker: '2308.TW'   },
      { company: 'MediaTek',                     ticker: '2454.TW'   },
      { company: 'HMM (HD Hyundai)',             ticker: '011200.KS' },
      { company: 'Murata Manufacturing',         ticker: '6981.T'    },
      { company: 'Elite Material',               ticker: '2383.TW'   },
      { company: 'Accton Technology',            ticker: '2345.TW'   },
      { company: 'AMEC',                         ticker: '688012.SS' }
    ]
  }
};
