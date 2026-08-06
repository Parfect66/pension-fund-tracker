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
  gold: {
    name: 'SW BlackRock Gold & General Pn CS8',
    isin: 'GB00BMRS2V58',
    weight: 1.0,
    holdings: [
      { company: 'Barrick Gold Corp',      ticker: 'ABX.TO' },
      { company: 'Agnico Eagle Mines',     ticker: 'AEM.TO' },
      { company: 'Newmont Corporation',    ticker: 'NEM'    },
      { company: 'Wheaton Precious Metals', ticker: 'WPM.TO' },
      { company: 'AngloGold Ashanti',      ticker: 'AU'     },
      { company: 'Franco-Nevada Corp',     ticker: 'FNV.TO' },
      { company: 'Northern Star Resources', ticker: 'NST.AX' },
      { company: 'Endeavour Mining',       ticker: 'EDV.TO' },
      { company: 'Kinross Gold Corp',      ticker: 'KGC'    },
      { company: 'Alamos Gold Inc',        ticker: 'AGI.TO' }
    ]
  }
};
