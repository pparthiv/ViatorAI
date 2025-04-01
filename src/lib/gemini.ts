import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export { getChatResponse } from './services/chatService';

export function createChatModel(modelName: string = 'gemini-2.0-flash') {
  return genAI.getGenerativeModel({ model: modelName });
}

export function createChat(model = createChatModel()) {
  return model.startChat();
}

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