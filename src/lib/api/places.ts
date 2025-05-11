export async function getNearbyPOIs(lat: number, lon: number, radiusKm: number): Promise<any[] | null> {
  if (lat < -90 || lat > 90) {
    console.error(`Invalid latitude: ${lat}. Must be between -90 and 90.`);
    return null;
  }
  if (lon < -180 || lon > 180) {
    console.error(`Invalid longitude: ${lon}. Must be between -180 and 180.`);
    return null;
  }

  const radiusMeters = radiusKm * 1000;
  const query = `[out:json][timeout:25];
(
  node["tourism"="attraction"](around:${radiusMeters},${lat},${lon});
  node["amenity"="restaurant"](around:${radiusMeters},${lat},${lon});
  node["leisure"="park"](around:${radiusMeters},${lat},${lon});
  node["amenity"="pub"](around:${radiusMeters},${lat},${lon});
  node["tourism"="museum"](around:${radiusMeters},${lat},${lon});
);
out body;`.replace(/\s+/g, ' ');

  const url = 'https://overpass-api.de/api/interpreter';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      console.error('Overpass API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      return null;
    }

    const data = await response.json();
    if (data.elements && data.elements.length > 0) {
      return data.elements.slice(0, 10);
    }
    return null;
  } catch (error) {
    console.error('Network error fetching POIs from Overpass API:', error);
    return null;
  }
}