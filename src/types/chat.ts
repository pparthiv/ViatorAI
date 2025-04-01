export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  data?: any;
  weatherData?: any;
}

export interface ChatResponse {
  content: string;
  data: {
    pois?: any[];
    center?: Location;
    radiusKm?: number;
    weatherData?: any;
    suggestedLocations?: { name: string; lat: number; lng: number }[];
  } | null;
}

export interface ChatHistory {
  role: 'user' | 'model';
  parts: string;
}