const API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY;

export interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface CachedNews {
  articles: Article[];
  timestamp: number;
}

export async function getLocationNews(location: string, pageSize: number = 10, daysBack: number = 7): Promise<Article[] | null> {
  if (!API_KEY) {
    console.error('News API key is not configured');
    return null;
  }

  const cacheKey = `news_${location.toLowerCase().replace(/\s+/g, '_')}_${daysBack}`;
  const cache = localStorage.getItem(cacheKey);
  const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

  if (cache) {
    const cachedData: CachedNews = JSON.parse(cache);
    const now = Date.now();
    if (now - cachedData.timestamp < ONE_DAY_IN_MS) {
      // console.log(`News: Using cached data for ${location} (${daysBack} days)`);
      return cachedData.articles;
    } else {
      // console.log(`News: Cache expired for ${location} (${daysBack} days)`);
    }
  }

  const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('.')[0] + 'Z';
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(location)}&from=${fromDate}&pageSize=${pageSize}&sortBy=popularity&apiKey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'ok') {
      const cachedNews: CachedNews = {
        articles: data.articles,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cachedNews));
      // console.log(`News: Fetched and cached news for ${location} (${daysBack} days)`);
      return data.articles;
    } else {
      console.error('News API error:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching news:', error);
    return null;
  }
}