import { getPlaceNameFromCoordinates } from '@/lib/api/geocoding';
import { WeatherData, Location } from '@/types';
import { computeDestinationPoint } from 'geolib';

const RADIUS_KM = 200;
const NUM_POINTS = 30;
const DISTANCE_STEP = Math.sqrt((RADIUS_KM ** 2) / NUM_POINTS);
const ANGLE_STEP = 137.5;
const CACHE_KEY = 'spiral_weather_cache';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

interface SpiralWeatherPoint {
  location: Location;
  name: string;
  forecast: any;
  airPollution: any;
  avgTemp: number;
  avgAQI: number;
  avgWindSpeed: number;
  avgCloudCover: number;
  avgHumidity: number;
}

interface SpiralCache {
  points: SpiralWeatherPoint[];
  timestamp: number;
}

function generateSpiralPoints(center: Location): Location[] {
  const points: Location[] = [];
  // console.log('Generating spiral points for center:', center);

  for (let i = 0; i < NUM_POINTS; i++) {
    const r = DISTANCE_STEP * Math.sqrt(i);
    const theta = (i * ANGLE_STEP * Math.PI) / 180;

    if (r > RADIUS_KM) break;

    const newPoint = computeDestinationPoint(
      { latitude: center.lat, longitude: center.lng },
      r * 1000,
      (theta * 180) / Math.PI
    );

    points.push({
      lat: newPoint.latitude,
      lng: newPoint.longitude,
    });
  }

  // console.log('Generated points:', points);
  return points;
}

async function getSpiralWeatherForecast(lat: number, lng: number): Promise<any> {
  const url = `/api/spiral-weather?lat=${lat}&lon=${lng}&type=forecast`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch forecast for lat: ${lat}, lng: ${lng}, status: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching forecast for lat: ${lat}, lng: ${lng}:`, error);
    return null;
  }
}

async function getSpiralAirPollutionForecast(lat: number, lng: number): Promise<any> {
  const url = `/api/spiral-weather?lat=${lat}&lon=${lng}&type=air_pollution_forecast`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch air pollution for lat: ${lat}, lng: ${lng}, status: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching air pollution for lat: ${lat}, lng: ${lng}:`, error);
    return null;
  }
}

function getCachedSpiralData(): SpiralWeatherPoint[] | null {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  const { points, timestamp }: SpiralCache = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_EXPIRY_MS) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
  return points;
}

function setCachedSpiralData(points: SpiralWeatherPoint[]) {
  if (points.length > 0) {
    const cache: SpiralCache = { points, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  }
}

export async function getSpiralWeatherLocations(
  center: Location,
  preference: string
): Promise<SpiralWeatherPoint[]> {

  const points = generateSpiralPoints(center);

  const weatherPoints = await Promise.all(
    points.map(async (point) => {
      const forecast = await getSpiralWeatherForecast(point.lat, point.lng);
      const airPollution = await getSpiralAirPollutionForecast(point.lat, point.lng);
      if (!forecast || !forecast.list || !airPollution || airPollution.length === 0) return null;

      const name = (await getPlaceNameFromCoordinates(point.lat, point.lng)) || 'Unknown Location';
      const avgTemp = forecast.list
        .slice(0, 40)
        .reduce((sum: number, entry: any) => sum + entry.main.temp, 0) / 40;
      const avgAQI = airPollution
        .slice(0, 40)
        .reduce((sum: number, entry: any) => sum + entry.main.aqi, 0) / 40;
      const avgWindSpeed = forecast.list
        .slice(0, 40)
        .reduce((sum: number, entry: any) => sum + entry.wind.speed, 0) / 40;
      const avgCloudCover = forecast.list
        .slice(0, 40)
        .reduce((sum: number, entry: any) => sum + entry.clouds.all, 0) / 40;
      const avgHumidity = forecast.list
        .slice(0, 40)
        .reduce((sum: number, entry: any) => sum + entry.main.humidity, 0) / 40;

      return {
        location: point,
        name,
        forecast,
        airPollution,
        avgTemp,
        avgAQI,
        avgWindSpeed,
        avgCloudCover,
        avgHumidity,
      };
    })
  );

  const validPoints = weatherPoints.filter((point): point is SpiralWeatherPoint => point !== null);
  setCachedSpiralData(validPoints);

  return sortSpiralPoints(validPoints, preference);
}

function sortSpiralPoints(points: SpiralWeatherPoint[], preference: string): SpiralWeatherPoint[] {
  let sortedPoints: SpiralWeatherPoint[] = [];

  const prefLower = preference.toLowerCase();

  if (prefLower.includes('rainy') || prefLower.includes('precipitation')) {
    sortedPoints = points
      .sort((a, b) => {
        const aRain = a.forecast.list.reduce((sum: number, entry: any) => sum + (entry.rain?.['3h'] || 0), 0);
        const bRain = b.forecast.list.reduce((sum: number, entry: any) => sum + (entry.rain?.['3h'] || 0), 0);
        return bRain - aRain;
      })
      .slice(0, 5);
  } else if (prefLower.includes('cool') || prefLower.includes('cold') || prefLower.includes('not hot')) {
    sortedPoints = points
      .sort((a, b) => a.avgTemp - b.avgTemp)
      .slice(0, 5);
  } else if (prefLower.includes('warm') || prefLower.includes('hot')) {
    sortedPoints = points
      .sort((a, b) => b.avgTemp - a.avgTemp)
      .slice(0, 5);
  } else if (prefLower.includes('air pollution less') || prefLower.includes('clean air') || prefLower.includes('good air')) {
    sortedPoints = points
      .sort((a, b) => a.avgAQI - b.avgAQI)
      .slice(0, 5);
  } else if (prefLower.includes('windy')) {
    sortedPoints = points
      .sort((a, b) => b.avgWindSpeed - a.avgWindSpeed)
      .slice(0, 5);
  } else if (prefLower.includes('sunny')) {
    sortedPoints = points
      .sort((a, b) => a.avgCloudCover - b.avgCloudCover)
      .slice(0, 5);
  } else if (prefLower.includes('humid')) {
    sortedPoints = points
      .sort((a, b) => b.avgHumidity - a.avgHumidity)
      .slice(0, 5);
  } else if (prefLower.includes('calm') || prefLower.includes('low wind')) {
    sortedPoints = points
      .sort((a, b) => a.avgWindSpeed - b.avgWindSpeed)
      .slice(0, 5);
  } else {
    sortedPoints = points
      .sort((a, b) => a.avgTemp - b.avgTemp)
      .slice(0, 5);
  }

  return sortedPoints;
}

export function formatSpiralWeatherData(point: SpiralWeatherPoint): WeatherData {
  const forecastList = point.forecast.list.slice(0, 40);
  const firstEntry = forecastList[0];
  const airPollutionList = point.airPollution.slice(0, 40);

  return {
    city: {
      name: point.name,
      country: point.forecast.city.country || 'Unknown',
      sunrise: point.forecast.city.sunrise,
      sunset: point.forecast.city.sunset,
      timezone: point.forecast.city.timezone,
    },
    temperature: {
      value: firstEntry.main.temp,
      min: Math.min(...forecastList.map((entry: any) => entry.main.temp_min)),
      max: Math.max(...forecastList.map((entry: any) => entry.main.temp_max)),
      feels_like: firstEntry.main.feels_like,
      unit: 'C',
    },
    humidity: {
      value: firstEntry.main.humidity,
      unit: '%',
    },
    pressure: {
      value: firstEntry.main.pressure,
      unit: 'hPa',
    },
    wind: {
      speed: {
        value: firstEntry.wind.speed,
        unit: 'm/s',
        name: 'Light Breeze',
      },
      direction: {
        value: firstEntry.wind.deg,
        code: 'N',
        name: 'North',
      },
    },
    clouds: {
      value: firstEntry.clouds.all,
      name: firstEntry.weather[0].description,
    },
    visibility: {
      value: firstEntry.visibility / 1000,
    },
    airQuality: {
      index: airPollutionList[0].main.aqi,
      components: {
        co: airPollutionList[0].components.co,
        no2: airPollutionList[0].components.no2,
        o3: airPollutionList[0].components.o3,
        pm2_5: airPollutionList[0].components.pm2_5,
        pm10: airPollutionList[0].components.pm10,
      },
    },
    forecast: forecastList
      .filter((_: any, index: number) => index % 8 === 0)
      .map((day: any) => ({
        dt: day.dt,
        temp: {
          day: day.main.temp,
          min: day.main.temp_min,
          max: day.main.temp_max,
          night: day.main.temp,
        },
        weather: {
          id: day.weather[0].id,
          main: day.weather[0].main,
          description: day.weather[0].description,
          icon: day.weather[0].icon,
        },
        pop: day.pop || 0,
        humidity: day.main.humidity,
      })),
  };
}