import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const type = searchParams.get('type');
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_SPIRAL_API_KEY;

  // Validate parameters
  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  if (!type || !['forecast', 'air_pollution_forecast'].includes(type)) {
    return NextResponse.json({ error: 'Invalid or missing type parameter' }, { status: 400 });
  }

  if (!apiKey) {
    console.error('spiral-weather/route.ts: OPENWEATHERMAP_SPIRAL_API_KEY not configured');
    return NextResponse.json({ error: 'Spiral weather API key is not configured' }, { status: 500 });
  }

  try {
    let url: string;
    switch (type) {
      case 'forecast':
        url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=en`;
        break;
      case 'air_pollution_forecast':
        url = `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&lang=en`;
        break;
      default:
        throw new Error('Invalid type');
    }

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`spiral-weather/route.ts: OpenWeatherMap API failed for ${type}:`, response.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch spiral weather data' }, { status: response.status });
    }

    const data = await response.json();

    if (type === 'air_pollution_forecast') {
      return NextResponse.json(data.list || []);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(`spiral-weather/route.ts: Error fetching ${type} data:`, error);
    return NextResponse.json({ error: 'Failed to fetch spiral weather data' }, { status: 500 });
  }
}