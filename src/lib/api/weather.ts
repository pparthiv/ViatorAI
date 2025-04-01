const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;

export async function getWeatherData(lat: number, lon: number): Promise<any | null> {
  if (!API_KEY) return null;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=en`;
  // console.log('Fetching weather data from:', url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.cod === 200) return data;
    return null;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

export async function getWeatherForecast(lat: number, lon: number): Promise<any | null> {
  if (!API_KEY) return null;

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=en`;
  // console.log('Fetching weather forecast from:', url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.cod === '200') return data;
    return null;
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return null;
  }
}

export async function getCurrentAirPollution(lat: number, lon: number): Promise<any | null> {
  if (!API_KEY) return null;

  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}&lang=en`;
  // console.log('Fetching current air pollution from:', url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.list && data.list.length > 0) return data;
    return null;
  } catch (error) {
    console.error('Error fetching air pollution:', error);
    return null;
  }
}

export async function getForecastAirPollution(lat: number, lon: number): Promise<any[] | null> {
  if (!API_KEY) return null;

  const url = `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&lang=en`;
  // console.log('Fetching forecast air pollution from:', url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.list && data.list.length > 0) return data.list;
    return null;
  } catch (error) {
    console.error('Error fetching forecast air pollution:', error);
    return null;
  }
}