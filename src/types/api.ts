export interface WeatherResponse {
  cod: number | string;
  message?: string;
  list?: any[];
  city?: {
    name: string;
    country: string;
    sunrise: number;
    sunset: number;
    timezone: number;
  };
}

export interface NewsResponse {
  status: string;
  articles: Article[];
  message?: string;
}

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

export interface OverpassResponse {
  elements: Array<{
    id: number;
    lat: number;
    lon: number;
    tags?: {
      name?: string;
      amenity?: string;
      leisure?: string;
      tourism?: string;
    };
  }>;
}

export interface GeocodingResponse {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}