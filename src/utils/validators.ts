export function isValidLatitude(lat: number): boolean {
  return !isNaN(lat) && lat >= -90 && lat <= 90;
}

export function isValidLongitude(lng: number): boolean {
  return !isNaN(lng) && lng >= -180 && lng <= 180;
}

export function isValidCoordinates(lat: number, lng: number): boolean {
  return isValidLatitude(lat) && isValidLongitude(lng);
}

export function isValidAPIKey(key: string | undefined): boolean {
  return typeof key === 'string' && key.length > 0;
}

export function validateEnvironmentVariables(): string[] {
  const errors: string[] = [];
  
  if (!process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY) {
    errors.push('OpenWeatherMap API key is missing');
  }
  if (!process.env.NEXT_PUBLIC_NEWS_API_KEY) {
    errors.push('News API key is missing');
  }
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    errors.push('Gemini API key is missing');
  }
  
  return errors;
}