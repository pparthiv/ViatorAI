const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;

export async function getCoordinatesFromPlaceName(placeName: string): Promise<[number, number] | null> {
  if (!API_KEY) return null;

  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(placeName)}&limit=1&appid=${API_KEY}&lang=en`;
  // console.log('Fetching coordinates for:', url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.length > 0) {
      const { lon, lat } = data[0];
      // console.log('Location found:', [lon, lat]);
      return [lon, lat];
    }
    return null;
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return null;
  }
}

export async function getPlaceNameFromCoordinates(lat: number, lon: number): Promise<string | null> {
  if (!API_KEY) return null;

  const url = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}&lang=en`;
  // console.log('Fetching place name from:', url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.length > 0) {
      return data[0].name || data[0].city || 'this spot';
    }
    return null;
  } catch (error) {
    console.error('Error fetching place name:', error);
    return null;
  }
}