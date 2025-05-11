// /src/app/api/news/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const pageSize = searchParams.get('pageSize') || '10';
  const daysBack = searchParams.get('daysBack') || '7';
  const apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY;

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://viator-ai.vercel.app/',
  ];

  const origin = request.headers.get('origin');
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : '' },
    });
  }

  if (!apiKey) {
    console.error('news/route.ts: NEXT_PUBLIC_NEWS_API_KEY not configured');
    return NextResponse.json({ error: 'News API key is not configured' }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : '' },
    });
  }

  try {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(daysBack));
    const from = fromDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${from}&pageSize=${pageSize}&sortBy=popularity&apiKey=${apiKey}&language=en`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('news/route.ts: NewsAPI failed:', response.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch news data' }, {
        status: response.status,
        headers: { 'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : '' },
      });
    }

    const data = await response.json();

    const headers = new Headers();
    if (origin && allowedOrigins.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }

    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error('news/route.ts: Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news data' }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : '' },
    });
  }
}

export async function OPTIONS(request: Request) {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://your-frontend.com',
  ];
  const origin = request.headers.get('origin');

  const headers = new Headers();
  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }

  return new Response(null, {
    status: 200,
    headers,
  });
}