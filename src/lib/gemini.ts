export type GeminiResponse = {
  content: string;
  data: {
    pois?: any[];
    center?: { lat: number; lng: number };
    radiusKm?: number;
    weatherData?: any;
    suggestedLocations?: { name: string; lat: number; lng: number }[];
  } | null;
};

export async function sendChatMessage(
  message: string,
  history: { role: string; parts: string }[],
  tempMarkerCoords?: [number, number],
  currentLocationCoords?: [number, number],
  modelName: string = 'gemini-2.0-flash'
): Promise<GeminiResponse> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history,
        tempMarkerCoords,
        currentLocationCoords,
        modelName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('gemini.ts: Error sending chat message:', error);
    return { content: 'Yikes, something went wrong with the chat. Try again soon!', data: null };
  }
}