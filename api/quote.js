export default async function handler(req, res) {
  const { symbol } = req.query;

  const allowed = [
    '7203.T', '8306.T', '6501.T', '6857.T', '9984.T', '8725.T', '8035.T', '6758.T', '8058.T', '8411.T',
    '005930.KS', '000660.KS', 'CBA.AX', '1299.HK', 'WBC.AX', 'D05.SI', 'NAB.AX', '005935.KS', 'ANZ.AX', '0388.HK',
    '2330.TW', '2308.TW', '2354.TW', '329180.KS', '2383.TW', '2345.TW', '2454.TW', '600183.SS',
    'NVDA', 'GOOGL', 'BNY', 'AAPL', 'GS', 'CAH', 'TRGP', 'WMT', 'AVGO', 'PH'
  ];

  if (!allowed.includes(symbol)) {
    return res.status(400).json({ error: 'Invalid symbol' });
  }

  const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${process.env.FMP_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data || !data[0] || !data[0].price) {
      console.error(`FMP error for ${symbol}:`, data);
      throw new Error(`No data available for ${symbol}`);
    }

    const quote = data[0];
    const finnhubFormat = {
      c: parseFloat(quote.price),
      pc: parseFloat(quote.previousClose),
      t: Math.floor(new Date(quote.timestamp * 1000).getTime() / 1000)
    };

    res.setHeader('Cache-Control', 's-maxage=30');
    res.status(200).json(finnhubFormat);
  } catch (e) {
    console.error(`Quote error for ${symbol}:`, e.message);
    res.status(502).json({ error: e.message });
  }
}
