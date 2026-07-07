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
      { company: 'Alnylam Pharmaceuticals',   ticker: 'ALNY' }
    ]
  },

  gold: {
    name: 'SW BlackRock Gold & General CS8',
    isin: '',
    holdings: [
      { company: 'Barrick Mining',          ticker: 'B'      },
      { company: 'Newmont',                 ticker: 'NEM'    },
      { company: 'AngloGold Ashanti',       ticker: 'AU'     },
      { company: 'Wheaton Precious Metals', ticker: 'WPM'    },
      { company: 'Northern Star Resources', ticker: 'NST.AX' },
      { company: 'Kinross Gold',            ticker: 'KGC'    },
      { company: 'Endeavour Mining',        ticker: 'EDV.TO' },
      { company: 'Franco-Nevada',           ticker: 'FNV'    },
      { company: 'Agnico Eagle Mines',      ticker: 'AEM'    },
      { company: 'Alamos Gold',             ticker: 'AGI'    }
    ]
  }
};
