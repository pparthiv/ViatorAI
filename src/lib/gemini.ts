import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini AI client
export const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

// Re-export the chat service
export { getChatResponse } from './services/chatService';

// Export helper functions for working with the Gemini AI model
export function createChatModel(modelName: string = 'gemini-2.0-flash') {
  return genAI.getGenerativeModel({ model: modelName });
}

export function createChat(model = createChatModel()) {
  return model.startChat();
}

// Export types
export type GeminiResponse = {
  content: string;
  data: {
    pois?: any[];
    center?: { lat: number; lng: number };
    radiusKm?: number;
    weatherData?: any; // Could be WeatherData | WeatherData[]
    suggestedLocations?: { name: string; lat: number; lng: number }[]; // Add this
  } | null;
};