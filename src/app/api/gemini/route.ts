import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('gemini/route.ts: GEMINI_API_KEY not configured');
    return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
  }

  try {
    const { message, history, tempMarkerCoords, currentLocationCoords, modelName = 'gemini-2.0-flash' } = await request.json();

    if (!message || !history) {
      return NextResponse.json({ error: 'Message and history are required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const chat = model.startChat({ history });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text().trim();

    return NextResponse.json({ content: responseText, data: null });
  } catch (error) {
    console.error('gemini/route.ts: Error processing Gemini request:', error);
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}