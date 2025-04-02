export default async function handler(req, res) {
  const { q, pageSize = 10, daysBack = 7 } = req.query;
  const apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY;

  // console.log('news.js: Received request:', { q, pageSize, daysBack });

  if (!apiKey) {
    console.error('news.js: NEWS_API_KEY not configured');
    return res.status(500).json({ error: 'News API key is not configured' });
  }

  if (!q) {
    console.error('news.js: Query parameter "q" is required');
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('.')[0] + 'Z';
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&from=${fromDate}&pageSize=${pageSize}&sortBy=popularity&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('news.js: NewsAPI failed:', response.status, errorText);
      throw new Error(`NewsAPI request failed with status ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    // console.log('news.js: Successfully fetched news:', data.totalResults, 'articles');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    console.error('news.js: Error fetching news:', error.message);
    res.status(500).json({ error: 'Failed to fetch news data', details: error.message });
  }
}