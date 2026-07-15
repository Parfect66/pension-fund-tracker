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
  intl: {
    name: 'SW International CS8',
    isin: 'GB00BMRRZW41',
    weight: 0.10,
    holdings: [
      { company: 'SW International CS8 (NAV)', ticker: 'FE:R72O' }
    ]
  },

  climate: {
    name: 'SW BlackRock ACS Climate Transition CS8',
    isin: 'GB00BMQDJL09',
    weight: 0.35,
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
    weight: 0.35,
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

  infra: {
    name: 'SW L&G FTSE Dev Core Infrastructure CS8',
    isin: 'GB00BMQDK398',
    weight: 0.20,
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
