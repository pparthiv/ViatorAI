import { format, fromUnixTime } from 'date-fns';
import { WeatherData, AirQualityData } from '@/types/weather';
import { WEATHER_CONFIG } from '@/config/constants';

export function formatWeatherDescription(weather: WeatherData): string {
  return `${weather.temperature.value}°${weather.temperature.unit} - ${weather.clouds.name}`;
}

export function formatDateTime(timestamp: number): string {
  return format(fromUnixTime(timestamp), 'PPpp');
}

export function getAirQualityInfo(aqi: number): AirQualityData {
  return {
    index: aqi,
    label: WEATHER_CONFIG.AQI_LABELS[aqi - 1] || 'Unknown',
    color: WEATHER_CONFIG.AQI_COLORS[aqi - 1] || 'text-gray-400',
  };
}

export function formatNewsDate(dateString: string): string {
  return format(new Date(dateString), 'PPP');
}