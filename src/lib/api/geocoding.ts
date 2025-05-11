export async function getCoordinatesFromPlaceName(placeName: string): Promise<[number, number] | null> {
  const url = `/api/geocoding?q=${encodeURIComponent(placeName)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.length > 0) {
      const { lon, lat } = data[0];
      return [lon, lat];
    }
    return null;
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return null;
  }
}

export async function getPlaceNameFromCoordinates(lat: number, lon: number): Promise<string | null> {
  const url = `/api/geocoding?lat=${lat}&lon=${lon}`;
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