import { useState, useEffect } from 'react';
import { Article } from '@/types/api';
import { API_CONFIG, STORAGE_KEYS } from '@/config/constants';

interface NewsCache {
  articles: Article[];
  timestamp: number;
}

export function useNewsCache(locationKey: string) {
  const [cachedNews, setCachedNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cacheKey = `${STORAGE_KEYS.LOCAL_NEWS_CACHE}_${locationKey}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const { articles, timestamp }: NewsCache = JSON.parse(cached);
      if (Date.now() - timestamp < API_CONFIG.CACHE_DURATION.NEWS) {
        setCachedNews(articles);
        setLoading(false);
        return;
      }
      localStorage.removeItem(cacheKey);
    }
    setLoading(false);
  }, [locationKey]);

  const updateCache = (articles: Article[]) => {
    if (articles.length > 0) {
      const cacheKey = `${STORAGE_KEYS.LOCAL_NEWS_CACHE}_${locationKey}`;
      const cache: NewsCache = { articles, timestamp: Date.now() };
      localStorage.setItem(cacheKey, JSON.stringify(cache));
      setCachedNews(articles);
    }
  };

  return { cachedNews, loading, updateCache };
}