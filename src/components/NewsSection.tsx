import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, Calendar, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getLocationNews } from '@/lib/api/news';
import { getWeatherData } from '@/lib/api/weather';
import { getPlaceNameFromCoordinates } from '@/lib/api/geocoding';
import { Location } from '@/types';

interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface NewsSectionProps {
  articles: Article[];
  loading: boolean;
  currentLocation: Location | null;
}

const LOCAL_NEWS_CACHE_KEY = 'local_news_cache';
const COUNTRY_NEWS_CACHE_KEY = 'country_news_cache';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface NewsCache {
  articles: Article[];
  timestamp: number;
}

export default function NewsSection({ articles: initialArticles, loading: initialLoading, currentLocation }: NewsSectionProps) {
  const [isLocalNews, setIsLocalNews] = useState(true);
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(initialLoading);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [countryName, setCountryName] = useState<string | null>(null);

  useEffect(() => {
    if (currentLocation) {
      fetchCountryData();
    }
  }, [currentLocation]);

  useEffect(() => {
    if (currentLocation && (isLocalNews || (countryCode && countryName))) {
      fetchNews();
    }
  }, [isLocalNews, currentLocation, countryCode, countryName]);

  const fetchCountryData = async () => {
    if (!currentLocation) return;
    try {
      const weatherData = await getWeatherData(currentLocation.lat, currentLocation.lng);
      if (weatherData && weatherData.sys.country) {
        setCountryCode(weatherData.sys.country);
        const countryDisplayName = new Intl.DisplayNames(['en'], { type: 'region' }).of(weatherData.sys.country);
        setCountryName(countryDisplayName || weatherData.sys.country); // Fallback to code if conversion fails
      }
    } catch (error) {
      console.error('Error fetching country data:', error);
    }
  };

  const getCachedNews = (key: string): Article[] | null => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { articles, timestamp }: NewsCache = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return articles;
  };

  const setCachedNews = (key: string, articles: Article[]) => {
    if (articles.length > 0) {
      const cache: NewsCache = { articles, timestamp: Date.now() };
      localStorage.setItem(key, JSON.stringify(cache));
    }
  };

  const fetchNews = async () => {
    if (!currentLocation) return;
    setLoading(true);
    const cacheKey = isLocalNews ? LOCAL_NEWS_CACHE_KEY : COUNTRY_NEWS_CACHE_KEY;
    const cachedArticles = getCachedNews(cacheKey);

    if (cachedArticles) {
      setArticles(cachedArticles);
      setLoading(false);
      return;
    }

    try {
      const query = isLocalNews
        ? await getPlaceNameFromCoordinates(currentLocation.lat, currentLocation.lng)
        : countryName;
      if (query) {
        const news = await getLocationNews(query || '', 10);
        if (news && news.length > 0) {
          setArticles(news);
          setCachedNews(cacheKey, news);
        } else {
          setArticles([]);
        }
      } else {
        setArticles([]);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="neomorphic p-6 rounded-xl h-[400px]">
        <div className="flex items-center space-x-3 mb-4">
          <Newspaper className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">{isLocalNews ? 'Local News' : 'Country News'}</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-700/50 rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700/50 rounded w-1/2 mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="neomorphic p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Newspaper className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">{isLocalNews ? 'Local News' : 'Country News'}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${isLocalNews ? 'text-white' : 'text-gray-400'}`}>Local</span>
          <div
            className="relative w-12 h-6 bg-gray-600 rounded-full cursor-pointer"
            onClick={() => setIsLocalNews(!isLocalNews)}
          >
            <motion.div
              className="absolute w-4 h-4 bg-blue-500 rounded-full top-1"
              animate={{ x: isLocalNews ? 2 : 26 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          </div>
          <span className={`text-sm ${!isLocalNews ? 'text-white' : 'text-gray-400'}`}>Country</span>
        </div>
      </div>
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-4">
          {articles.length === 0 && (
            <p className="text-gray-400 text-center text-sm">No headlines are available in this area. Try again in a different location.</p>
          )}
          {articles.map((article, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card hover:bg-white/5 transition-all duration-300"
            >
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4"
              >
                {article.urlToImage && (
                  <div className="relative h-48 mb-4 overflow-hidden rounded-lg">
                    <img
                      src={article.urlToImage}
                      alt={article.title}
                      className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white line-clamp-2 hover:text-blue-400 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {article.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(article.publishedAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>{article.source.name}</span>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}