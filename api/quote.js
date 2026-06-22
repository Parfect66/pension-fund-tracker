export default async function handler(req, res) {
  const { symbol } = req.query;

  const allowed = [
    // Japan Market ETF (EWJ)
    'EWJ', 'TM', 'SONY', 'MUFG', 'SFTBY', 'HTHIY', 'HMC', 'DSAKY', 'TKPYY', 'SHECY',
    // South Korea Market ETF (EWY)
    'EWY', 'SSNLF', 'SKHHY', 'LPL', 'NAVER', 'KAKOF', 'HYMTF', 'KIMTF', 'PSHOF', 'KALAF',
    // Taiwan Market ETF (EWT)
    'EWT', 'TSM', 'MDTK', 'TCMTF', 'CHT', 'FFH', 'PGTRF', 'LTONF', 'DELT', 'TAIPF',
    // Australia Market ETF (EWA)
    'EWA', 'CBDX', 'NABZY', 'WBK', 'BHP', 'RIO', 'CSLLF', 'AMLTF', 'SKLTF', 'WFAOF'
  ];

  if (!allowed.includes(symbol)) {
    return res.status(400).json({ error: 'Invalid symbol' });
  }

  const url = `https://financialmodelingprep.com/stable/quote?symbol=${symbol}&apikey=${process.env.FMP_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data || !data[0] || typeof data[0].price !== 'number') {
      console.error(`FMP error for ${symbol}:`, data);
      throw new Error(`No data available for ${symbol}`);
    }

    const quote = data[0];
    const finnhubFormat = {
      c: parseFloat(quote.price),
      pc: parseFloat(quote.previousClose || quote.price),
      t: Math.floor(Date.now() / 1000)
    };

    res.setHeader('Cache-Control', 's-maxage=30');
    res.status(200).json(finnhubFormat);
  } catch (e) {
    console.error(`Quote error for ${symbol}:`, e.message);
    res.status(502).json({ error: e.message });
  }
}
