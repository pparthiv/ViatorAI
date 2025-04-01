'use client';

import React, { useEffect, useState } from 'react';
import { format, fromUnixTime, isBefore, isAfter } from 'date-fns';
import { 
  Sun, 
  Cloud, 
  Wind, 
  Droplets, 
  Eye, 
  Gauge, 
  CloudRain,
  Sunrise,
  Sunset,
  Thermometer,
  CloudSnow,
  Zap,
  Umbrella,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Location } from '@/types';
import { getCurrentAirPollution, getWeatherData, getWeatherForecast } from '@/lib/api/weather';

interface WeatherSectionProps {
  currentLocation: Location | null;
}

interface WeatherData {
  city: { name: string; country: string; sunrise: number; sunset: number };
  temperature: { value: number; feels_like: number; unit: string };
  humidity: { value: number; unit: string };
  pressure: { value: number; unit: string };
  wind: { speed: { value: number; unit: string }; direction: { name: string } };
  visibility: { value: number };
  weather: { main: string; description: string };
  airQuality: { index: number; components: { pm2_5: number; pm10: number } };
  forecast: { 
    dt: number; 
    temp: { min: number; max: number }; 
    weather: { main: string }; 
    pop: number; 
    wind_speed: number; 
    humidity: number 
  }[];
}

const getAQILabel = (aqi: number) => {
  const labels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  const colors = ['text-green-400', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'];
  return { label: labels[aqi - 1] || 'Unknown', color: colors[aqi - 1] || 'text-gray-400' };
};

const getBackgroundImage = (weatherMain: string, sunrise: number, sunset: number) => {
  const now = new Date();
  const isDayTime = isAfter(now, fromUnixTime(sunrise)) && isBefore(now, fromUnixTime(sunset));
  const timeOfDay = isDayTime ? 'day' : 'night';

  switch (weatherMain.toLowerCase()) {
    case 'clear':
      return `/clear_${timeOfDay}.png`;
    case 'clouds':
      return `/cloudy_${timeOfDay}.png`;
    case 'rain':
      return `/rainy_${timeOfDay}.png`;
    case 'snow':
      return `/clear_${timeOfDay}.png`;
    case 'thunderstorm':
      return `/clear_${timeOfDay}.png`;
    default:
      return `/clear_${timeOfDay}.png`;
  }
};

const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData | null> => {
  try {
    const weatherData = await getWeatherData(lat, lon);
    if (weatherData.cod !== 200) {
      console.error('WeatherSection: Weather API error:', weatherData.message);
      return null;
    }

    const forecastData = await getWeatherForecast(lat, lon);
    if (forecastData.cod !== '200') {
      console.error('WeatherSection: Forecast API error:', forecastData.message);
      return null;
    }

    const airData = await getCurrentAirPollution(lat, lon);
    if (!airData.list?.length) {
      console.error('WeatherSection: Air Quality API error: No data returned');
      return null;
    }

    const dailyForecast = forecastData.list
      .reduce((acc: any[], item: any) => {
        const date = format(fromUnixTime(item.dt), 'yyyy-MM-dd');
        if (!acc.some((d) => format(fromUnixTime(d.dt), 'yyyy-MM-dd') === date)) {
          acc.push(item);
        }
        return acc;
      }, [])
      .slice(0, 5)
      .map((item: any) => ({
        dt: item.dt,
        temp: { min: item.main.temp_min, max: item.main.temp_max },
        weather: { main: item.weather[0].main },
        pop: item.pop,
        wind_speed: item.wind.speed,
        humidity: item.main.humidity,
      }));

    return {
      city: {
        name: weatherData.name,
        country: weatherData.sys.country,
        sunrise: weatherData.sys.sunrise,
        sunset: weatherData.sys.sunset,
      },
      temperature: {
        value: Math.round(weatherData.main.temp),
        feels_like: Math.round(weatherData.main.feels_like),
        unit: 'C',
      },
      humidity: { value: weatherData.main.humidity, unit: '%' },
      pressure: { value: weatherData.main.pressure, unit: 'hPa' },
      wind: {
        speed: { value: weatherData.wind.speed, unit: 'm/s' },
        direction: { name: weatherData.wind.deg.toString() + '°' },
      },
      visibility: { value: weatherData.visibility },
      weather: { main: weatherData.weather[0].main, description: weatherData.weather[0].description },
      airQuality: {
        index: airData.list[0].main.aqi,
        components: {
          pm2_5: airData.list[0].components.pm2_5,
          pm10: airData.list[0].components.pm10,
        },
      },
      forecast: dailyForecast,
    };
  } catch (error) {
    console.error('WeatherSection: Error fetching weather data:', error);
    return null;
  }
};

export default function WeatherSection({ currentLocation }: WeatherSectionProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (currentLocation) {
      // console.log('WeatherSection: Fetching data for location:', currentLocation);
      fetchWeatherData(currentLocation.lat, currentLocation.lng).then((data) => {
        // console.log('WeatherSection: Fetched Weather Data:', data);
        setWeather(data);
      });
    }
  }, [currentLocation]);

  if (!weather) {
    return (
      <div
        className="neomorphic p-6 rounded-xl h-[600px] flex items-center justify-center"
        style={{
          backgroundImage: `url(/clear_day.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        <div className="absolute inset-0 bg-black/50 rounded-xl" /> {/* Overlay for loading state */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center"
        >
          <Thermometer className="h-8 w-8 text-primary" />
          <span className="ml-2 text-foreground">Loading weather...</span>
        </motion.div>
      </div>
    );
  }

  const { label: aqiLabel, color: aqiColor } = getAQILabel(weather.airQuality.index);
  const backgroundImage = getBackgroundImage(weather.weather.main, weather.city.sunrise, weather.city.sunset);

  return (
    <div
      className="neomorphic p-6 rounded-xl h-[600px] overflow-y-auto custom-scrollbar"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        backgroundBlendMode: 'soft-light',
      }}
    >
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 space-y-6"
      >
        {/* City and Sunrise/Sunset */}
        <div className="bg-blue-800/20 glass-card p-4 rounded-lg flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground glow-text">
            {weather.city.name}, {weather.city.country}
          </h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Sunrise className="h-5 w-5 text-yellow-400 glow-accent" />
              <span className="text-sm text-blue-200">{format(fromUnixTime(weather.city.sunrise), 'HH:mm')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sunset className="h-5 w-5 text-orange-400 glow-accent" />
              <span className="text-sm text-blue-200">{format(fromUnixTime(weather.city.sunset), 'HH:mm')}</span>
            </div>
          </div>
        </div>

        {/* Main Weather Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-between items-start bg-indigo-800/20 glass-card p-4 rounded-lg"
            >
              <div>
                <div className="text-5xl font-bold text-white glow-text">
                  {weather.temperature.value}°{weather.temperature.unit}
                </div>
                <div className="text-lg text-blue-300">Feels like {weather.temperature.feels_like}°</div>
                <div className="text-sm text-blue-200 mt-1 capitalize">{weather.weather.description}</div>
              </div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {weather.weather.main === 'Clear' ? (
                  <Sun className="h-12 w-12 text-yellow-500 glow-accent" />
                ) : weather.weather.main === 'Rain' ? (
                  <CloudRain className="h-12 w-12 text-blue-500 glow-primary" />
                ) : weather.weather.main === 'Snow' ? (
                  <CloudSnow className="h-12 w-12 text-white glow-secondary" />
                ) : weather.weather.main === 'Thunderstorm' ? (
                  <Zap className="h-12 w-12 text-yellow-600 glow-accent" />
                ) : (
                  <Cloud className="h-12 w-12 text-gray-400 glow-secondary" />
                )}
              </motion.div>
            </motion.div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Wind className="h-5 w-5 text-teal-400" />, label: 'Wind', value: `${weather.wind.speed.value} ${weather.wind.speed.unit}`, subtext: weather.wind.direction.name, bg: 'bg-teal-800/20' },
                { icon: <Droplets className="h-5 w-5 text-blue-400" />, label: 'Humidity', value: `${weather.humidity.value}${weather.humidity.unit}`, bg: 'bg-blue-800/20' },
                { icon: <Eye className="h-5 w-5 text-gray-400" />, label: 'Visibility', value: `${(weather.visibility.value / 1000).toFixed(1)} km`, bg: 'bg-gray-800/20' },
                { icon: <Gauge className="h-5 w-5 text-purple-400" />, label: 'Pressure', value: `${weather.pressure.value} ${weather.pressure.unit}`, bg: 'bg-purple-800/20' },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  <div className={cn("glass-card p-4 glow-secondary", item.bg)}>
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                    </div>
                    <div className="mt-2 text-foreground">{item.value}</div>
                    {item.subtext && <div className="text-sm text-muted-foreground">{item.subtext}</div>}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Air Quality */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="bg-green-800/20 glass-card p-4 rounded-lg"
            >
              <h3 className="text-lg font-medium text-green-300 mb-2">Air Quality</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">AQI</span>
                <span className={cn('font-medium', aqiColor)}>{aqiLabel}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">PM2.5</span>
                  <span className="text-sm text-foreground">{weather.airQuality.components.pm2_5} μg/m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">PM10</span>
                  <span className="text-sm text-foreground">{weather.airQuality.components.pm10} μg/m³</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 5-Day Forecast */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-purple-300">5-Day Forecast</h3>
            {weather.forecast.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {weather.forecast.map((day, index) => (
                  <div key={index} className="bg-purple-800/20 glass-card p-4 rounded-lg flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {day.weather.main === 'Clear' ? (
                          <Sun className="h-8 w-8 text-yellow-500 glow-accent" />
                        ) : day.weather.main === 'Rain' ? (
                          <Umbrella className="h-8 w-8 text-blue-500 glow-primary" />
                        ) : day.weather.main === 'Snow' ? (
                          <CloudSnow className="h-8 w-8 text-white glow-secondary" />
                        ) : day.weather.main === 'Thunderstorm' ? (
                          <Zap className="h-8 w-8 text-yellow-600 glow-accent" />
                        ) : (
                          <Cloud className="h-8 w-8 text-gray-400 glow-secondary" />
                        )}
                        <span className="text-base font-medium text-purple-200">
                          {format(fromUnixTime(day.dt), 'EEEE')}
                        </span>
                      </div>
                      <span className="text-lg text-foreground">
                        {Math.round(day.temp.min)}° - {Math.round(day.temp.max)}°
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Umbrella className="h-5 w-5 text-blue-400" />
                        <span>{Math.round(day.pop * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="h-5 w-5 text-teal-400" />
                        <span>{day.wind_speed} m/s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-blue-400" />
                        <span>{day.humidity}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">No forecast data available</div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}