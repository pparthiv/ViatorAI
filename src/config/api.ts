export const API_ENDPOINTS = {
  WEATHER: {
    CURRENT: 'https://api.openweathermap.org/data/2.5/weather',
    FORECAST: 'https://api.openweathermap.org/data/2.5/forecast',
    AIR_POLLUTION: 'https://api.openweathermap.org/data/2.5/air_pollution',
    AIR_POLLUTION_FORECAST: 'https://api.openweathermap.org/data/2.5/air_pollution/forecast',
    GEOCODING: 'https://api.openweathermap.org/geo/1.0/direct',
    REVERSE_GEOCODING: 'https://api.openweathermap.org/geo/1.0/reverse',
  },
  NEWS: {
    EVERYTHING: 'https://newsapi.org/v2/everything',
  },
  OVERPASS: {
    INTERPRETER: 'https://overpass-api.de/api/interpreter',
  },
};

export const API_KEYS = {
  WEATHER: process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY,
  NEWS: process.env.NEXT_PUBLIC_NEWS_API_KEY,
  GEMINI: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  OPENWEATHER_SPIRAL: process.env.NEXT_PUBLIC_OPENWEATHER_SPIRAL_API_KEY,
};