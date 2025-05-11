export async function getWeatherData(lat: number, lon: number): Promise<any | null> {
  const url = `/api/weather?lat=${lat}&lon=${lon}&type=weather`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather request failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data.cod === 200) return data;
    return null;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

export async function getWeatherForecast(lat: number, lon: number): Promise<any | null> {
  const url = `/api/weather?lat=${lat}&lon=${lon}&type=forecast`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Forecast request failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data.cod === '200') return data;
    return null;
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return null;
  }
}

export async function getCurrentAirPollution(lat: number, lon: number): Promise<any | null> {
  const url = `/api/weather?lat=${lat}&lon=${lon}&type=air_pollution`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Air pollution request failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data.list && data.list.length > 0) return data;
    return null;
  } catch (error) {
    console.error('Error fetching air pollution:', error);
    return null;
  }
}

export async function getForecastAirPollution(lat: number, lon: number): Promise<any[] | null> {
  const url = `/api/weather?lat=${lat}&lon=${lon}&type=air_pollution_forecast`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Air pollution forecast request failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data && data.length > 0) return data;
    return null;
  } catch (error) {
    console.error('Error fetching forecast air pollution:', error);
    return null;
  }
}