// lib/api/news.ts
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

  const proxyUrl = `/api/news?q=${encodeURIComponent(location)}&pageSize=${pageSize}&daysBack=${daysBack}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Proxy request failed with status ${response.status}`);
    }
    const data = await response.json();

    if (data.status === 'ok' && data.articles) {
      const cachedNews: CachedNews = {
        articles: data.articles,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cachedNews));
      // console.log(`News: Fetched and cached news for ${location} (${daysBack} days)`);
      return data.articles;
    } else {
      console.error('News API error via proxy:', data.message || 'No articles returned');
      return null;
    }
  } catch (error) {
    console.error('Error fetching news via proxy:', error);
    return null;
  }
}