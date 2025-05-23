export interface WeatherData {
  city: {
    name: string;
    country: string;
    sunrise: number;
    sunset: number;
    timezone: number;
  };
  temperature: {
    value: number;
    min: number;
    max: number;
    feels_like: number;
    unit: string;
  };
  humidity: {
    value: number;
    unit: string;
  };
  pressure: {
    value: number;
    unit: string;
  };
  wind: {
    speed: {
      value: number;
      unit: string;
      name: string;
    };
    direction: {
      value: number;
      code: string;
      name: string;
    };
  };
  clouds: {
    value: number;
    name: string;
  };
  visibility: {
    value: number;
  };
  airQuality: {
    index: number;
    components: {
      co: number;
      no2: number;
      o3: number;
      pm2_5: number;
      pm10: number;
    };
  };
  forecast: DayForecast[];
}

export interface DayForecast {
  dt: number;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  };
  pop: number;
  humidity: number;
}

export interface AirQualityData {
  index: number;
  label: string;
  color: string;
}