module.exports = async (req, res) => {
    const { q, pageSize = 10, daysBack = 7 } = req.query;
    const apiKey = process.env.NEWS_API_KEY; // Set in Vercel env vars
  
    if (!apiKey) {
      return res.status(500).json({ error: 'News API key is not configured' });
    }
  
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
  
    const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('.')[0] + 'Z';
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&from=${fromDate}&pageSize=${pageSize}&sortBy=popularity&apiKey=${apiKey}`;
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NewsAPI request failed with status ${response.status}`);
      }
      const data = await response.json();
      res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching news:', error);
      res.status(500).json({ error: 'Failed to fetch news data' });
    }
  };