export const APP_CONFIG = {
  NAME: 'ViatorAI',
  DESCRIPTION: 'Your intelligent travel companion for weather-smart journey planning',
  VERSION: '0.1.0',
};

export const API_CONFIG = {
  NEWS_DAILY_LIMIT: parseInt(process.env.NEXT_PUBLIC_DAILY_NEWS_LIMIT || '10', 10),
  CACHE_DURATION: {
    NEWS: 24 * 60 * 60 * 1000, // 24 hours
    WEATHER: 30 * 60 * 1000,   // 30 minutes
    LOCATION: 24 * 60 * 60 * 1000, // 24 hours
  },
};

export const MAP_CONFIG = {
  DEFAULT_LOCATION: {
    lat: 51.505,
    lng: -0.09,
  },
  DEFAULT_ZOOM: 14,
  MAX_BOUNDS: [[-90, -180], [90, 180]] as const,
  SPIRAL_SEARCH: {
    RADIUS_KM: 200,
    NUM_POINTS: 30,
  },
};

export const WEATHER_CONFIG = {
  UPDATE_INTERVAL: 300000, // 5 minutes
  AQI_LABELS: ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'] as const,
  AQI_COLORS: ['text-green-400', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'] as const,
};

export const STORAGE_KEYS = {
  NEWS_REQUESTS: 'news_requests',
  LOCAL_NEWS_CACHE: 'local_news_cache',
  COUNTRY_NEWS_CACHE: 'country_news_cache',
  SPIRAL_WEATHER_CACHE: 'spiral_weather_cache',
} as const;