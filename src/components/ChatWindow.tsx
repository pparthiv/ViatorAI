'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Cloud, Wind, Droplets, Sun, Moon, Gauge, TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Message, WeatherData, Location, POI } from '@/types';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (content: string) => Promise<{
    content: string;
    data: { pois: any[]; center: Location; radiusKm: number; weatherData?: WeatherData | WeatherData[] } | null;
  }>;
  currentLocation: Location;
  onPOIsUpdated?: (pois: POI[], center: Location, radiusKm: number) => void;
  onSearchMarkerChange?: (marker: Location | null, radiusKm?: number) => void;
}

function parseMarkdown(text: string): string {
  let html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/<\/li>\n<li>/g, '</li><li>')
    .replace(/<li>.+<\/li>/g, '<ul>$&</ul>')
    .replace(/\n/g, '<br>');
  return html;
}

const WeatherCard: React.FC<{ weatherData: WeatherData }> = ({ weatherData }) => (
  <Card className="my-2">
    <CardHeader>
      <CardTitle>
        <Cloud className="mr-2 h-5 w-5 text-blue-500" /> {weatherData.city.name}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-4">
        <div>
          <div className="text-3xl font-bold text-cyan-400">
            {weatherData.temperature.value.toFixed(0)}°{weatherData.temperature.unit}
          </div>
          <div className="text-sm text-blue-600">Feels like {weatherData.temperature.feels_like.toFixed(2)}°</div>
        </div>
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {weatherData.clouds.name.toLowerCase().includes('clear') ? (
            <Sun className="h-8 w-8 text-yellow-500" />
          ) : weatherData.clouds.name.toLowerCase().includes('rain') ? (
            <Cloud className="h-8 w-8 text-blue-500" />
          ) : (
            <Cloud className="h-8 w-8 text-gray-400" />
          )}
        </motion.div>
        <div className="text-xs text-gray-600 capitalize">{weatherData.clouds.name}</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Wind className="h-4 w-4 text-teal-500" />
          <span className="text-sm text-gray-800">{weatherData.wind.speed.value.toFixed(2)} m/s, {weatherData.wind.direction.code}</span>
        </div>
        <div className="flex items-center gap-1">
          <Droplets className="h-4 w-4 text-blue-400" />
          <span className="text-sm text-gray-800">{weatherData.humidity.value}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Sun className="h-4 w-4 text-yellow-400" />
          <span className="text-sm text-gray-800">{new Date(weatherData.city.sunrise * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex items-center gap-1">
          <Moon className="h-4 w-4 text-indigo-500" />
          <span className="text-sm text-gray-800">{new Date(weatherData.city.sunset * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Gauge className="h-4 w-4 text-red-500" />
          <span className="text-sm text-gray-800">
            AQI {weatherData.airQuality.index} ({weatherData.airQuality.index === 5 ? 'Very Poor' : weatherData.airQuality.index === 4 ? 'Poor' : weatherData.airQuality.index === 3 ? 'Moderate' : 'Good'})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-800">{weatherData.airQuality.components.pm2_5.toFixed(1)} µg/m³</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="h-4 w-4 text-purple-500" />
          <span className="text-sm text-gray-800">{weatherData.airQuality.components.o3.toFixed(2)} µg/m³</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span className="text-sm text-gray-800">{weatherData.forecast.length > 1 ? `AQI ${weatherData.airQuality.index} to ${weatherData.forecast[1].humidity > 50 ? 4 : 3}` : 'N/A'}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function ChatWindow({ messages, onSendMessage, currentLocation, onPOIsUpdated, onSearchMarkerChange }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    };
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    setInput('');
    setIsTyping(true);

    try {
      const response = await onSendMessage(input);
      if (response.data && onPOIsUpdated) {
        const mappedPois: POI[] = response.data.pois.map((poi) => ({
          id: poi.id?.toString() || Date.now().toString(),
          lat: poi.lat,
          lng: poi.lng || poi.lon,
          name: poi.name || (poi.tags && poi.tags.name) || 'Unnamed',
          category:
            poi.category ||
            (poi.tags && (poi.tags.amenity || poi.tags.leisure || poi.tags.tourism)) ||
            'unknown',
          priority: poi.priority,
        }));
        onPOIsUpdated(mappedPois, response.data.center, response.data.radiusKm);
      }

      if (response.data?.weatherData && Array.isArray(response.data.weatherData)) {
        (window as any).latestSpiralWeatherData = response.data.weatherData;
      }

      const planTripMatch = input.match(/^Plan a trip to\s+([A-Za-z\s]+)(?:\s+for\s+(\d+)\s+days)?$/i);
      if (planTripMatch) {
        if (response.data?.center && onSearchMarkerChange) {
          onSearchMarkerChange(response.data.center, response.data.radiusKm);
        }
      } else {
        const tellMeAboutMatch = input.match(/^Tell me about\s+([A-Za-z\s]+)$/i);
        if ((tellMeAboutMatch || planTripMatch) && response.data?.center && onSearchMarkerChange) {
          onSearchMarkerChange(response.data.center, response.data.radiusKm);
        }
      }

      messages.push({
        id: Date.now().toString(),
        content: response.content,
        sender: 'bot',
        timestamp: new Date(),
        data: response.data,
      });

      setIsTyping(false);
    } catch (error) {
      console.error('ChatWindow: Error processing message:', error);
      messages.push({
        id: Date.now().toString(),
        content: 'Oops, something went wrong. Please try again!',
        sender: 'bot',
        timestamp: new Date(),
      });
      setIsTyping(false);
    }
  };

    const getFollowUpQuestions = (messageContent: string): string[] => {
    const lowerContent = messageContent.toLowerCase();
    const locationMatch = messages[messages.length - 1]?.content.match(/Location name: (\w+)/i)?.[1] || 'this location';

    const possibleQuestions = {
      weather: [
        `What's the 5-day forecast for ${locationMatch}?`,
        `What should I wear in ${locationMatch} today?`,
        `How's the air quality in ${locationMatch}?`,
        `What are some colder places I can go to?`,
        `What are some warm places that I can go to?`,
        `What are some air pollution less places that I can go to?`,
        `What are some windy places that I can go to?`,
        `What are some calm places with low wind?`,
      ],
      news: [
        `Any recent news from ${locationMatch}?`,
        `What are the updates regarding ${locationMatch} in the past 2 days?`,
        `Tell me about news from ${locationMatch} in the past month`,
      ],
      activities: [
        `What are the things I can do in ${locationMatch}?`,
        `What’s nearby in ${locationMatch} within 10 km?`,
      ],
      general: [
        `Tell me about ${locationMatch}`,
        `Plan a trip to ${locationMatch}`,
      ],
    };

    if (lowerContent.includes('weather') || lowerContent.includes('forecast') || lowerContent.includes('air quality') || lowerContent.includes('wear') || lowerContent.includes('rainy')) {
      return possibleQuestions.weather;
    } else if (lowerContent.includes('news') || lowerContent.includes('updates')) {
      return possibleQuestions.news;
    } else if (lowerContent.includes('things to do') || lowerContent.includes('nearby')) {
      return possibleQuestions.activities;
    }
    return possibleQuestions.general;
  };

  const handleFollowUpClick = (question: string) => {
    setInput(question);
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <div className="flex flex-col w-full h-[800px] bg-white bg-opacity-90 bg-[url('/texture.png')] rounded-lg shadow-lg border border-gray-200">
      <div className="flex justify-between items-center p-4 border-b border-gray-300 bg-gray-100 shrink-0">
        <h2 className="text-xl font-bold text-gray-800">ViatorAI Companion</h2>
      </div>

      <ScrollArea className="flex-1 p-4 custom-scrollbar" ref={scrollAreaRef}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'mb-4',
              message.sender === 'user' ? 'text-right' : 'text-left'
            )}
          >
            {message.data?.weatherData && message.sender === 'bot' && (
              Array.isArray(message.data.weatherData) ? (
                message.data.weatherData.map((wd: WeatherData, index: number) => (
                  <WeatherCard key={index} weatherData={wd} />
                ))
              ) : (
                <WeatherCard weatherData={message.data.weatherData} />
              )
            )}
            <div
              className={cn(
                'inline-block p-3 rounded-lg max-w-[80%] shadow-sm',
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-green-200 text-gray-800'
              )}
            >
              <div
                dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
                className="prose max-w-none"
              />
            </div>
            {message.sender === 'bot' && (
              <div className="mt-2 flex flex-wrap gap-2 justify-start">
                {getFollowUpQuestions(message.content).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleFollowUpClick(question)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors duration-200"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ))}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2 text-gray-500"
          >
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            <span>Typing...</span>
          </motion.div>
        )}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-300 bg-gray-50 shrink-0">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about travel or weather..."
            disabled={isTyping}
            className="flex-1 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 shadow-md',
              (isTyping || !input.trim()) && 'opacity-50 cursor-not-allowed'
            )}
            title="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}