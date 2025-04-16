'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Cloud, CloudRain, CloudSnow, Sun, Zap, Wind, Gauge, TrendingUp, Moon, Droplet, Sunrise } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomCard, CustomCardContent, CustomCardHeader, CustomCardTitle } from '@/components/ui/custom-card';
import { cn } from '@/lib/utils';
import { Message, WeatherData, Location, POI } from '@/types';
import { ArrowRight, Clock } from "lucide-react"
import { CloudBackground } from './ui/cloud-background';

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

export const WeatherCard: React.FC<{ weatherData: WeatherData }> = ({ weatherData }) => {
  // Calculate time until sunset
  const now = new Date()
  const sunset = new Date(weatherData.city.sunset * 1000)
  const timeUntilSunset =
    sunset > now
      ? `+${Math.floor((sunset.getTime() - now.getTime()) / (1000 * 60 * 60))}:${String(Math.floor(((sunset.getTime() - now.getTime()) / (1000 * 60)) % 60)).padStart(2, "0")}`
      : ""

  // Get AQI text
  const getAqiText = (index: number) => {
    if (index <= 2) return "Good"
    if (index === 3) return "Moderate"
    if (index === 4) return "Poor"
    return "Very Poor"
  }

  return (
    <CustomCard>
      <CustomCardHeader>
        <div className="absolute inset-0 rounded-xl">
          <CloudBackground />
        </div>
      </CustomCardHeader>

      <CustomCardContent>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">{weatherData.city.name}</h1>
            <div className="flex items-baseline">
              <span className="text-6xl font-bold text-blue-500">
                {weatherData.temperature.value.toFixed(0)}°{weatherData.temperature.unit}
              </span>
            </div>
            <div className="text-slate-600 text-lg">Feels like {weatherData.temperature.feels_like.toFixed(1)}°</div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-28 h-28">
                {weatherData.forecast[0].weather.main === 'Clear' ? (
                  <Sun className="w-28 h-28 text-yellow-500" />
                ) : weatherData.forecast[0].weather.main === 'Rain' ? (
                  <CloudRain className="w-28 h-28 text-blue-500" />
                ) : weatherData.forecast[0].weather.main === 'Snow' ? (
                  <CloudSnow className="w-28 h-28 text-white" />
                ) : weatherData.forecast[0].weather.main === 'Thunderstorm' ? (
                  <Zap className="w-28 h-28 text-yellow-600" />
                ) : (
                  <Cloud className="w-28 h-28 text-gray-400" />
                )}
            </div>
            <span className="text-slate-700 text-lg" style={{ textTransform: 'capitalize' }}>{weatherData.clouds.name}</span>
          </div>
        </div>

        <div className="border-t border-b border-gray-200 py-4 my-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-gray-500" />
              <span className="text-slate-700">
                {weatherData.wind.speed.value.toFixed(1)} m/s, {weatherData.wind.direction.code}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-blue-500" />
              <span className="text-slate-700">{weatherData.humidity.value}%</span>
            </div>

            <div className="flex items-center gap-2">
              <Sun className="h-6 w-6 text-yellow-500" />
              <span className="text-slate-700">
                {new Date(weatherData.city.sunrise * 1000).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-purple-500" />
              <span className="text-slate-700">{timeUntilSunset} Hours</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-red-500" />
            <span className="text-slate-700">
              AQI {weatherData.airQuality.index} ({getAqiText(weatherData.airQuality.index)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-gray-600" />
            <span className="text-slate-700">{weatherData.airQuality.components.pm2_5.toFixed(1)} µg/m³</span>
          </div>

          <div className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-purple-500" />
            <span className="text-slate-700">{weatherData.airQuality.components.o3.toFixed(1)} µg/m³</span>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-slate-700">
              AQI {weatherData.airQuality.index} to{" "}
              {weatherData.forecast.length > 1 ? (weatherData.forecast[1].humidity > 50 ? 4 : 3) : "N/A"}
            </span>
          </div>
        </div>
      </CustomCardContent>
    </CustomCard>
  )
}

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
      <div className="flex justify-between items-center p-4 border-b border-gray-300 bg-gray-100 shrink-0 rounded-lg">
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
            <div className="max-w-[80%] w-full mb-2">
              {message.data?.weatherData && message.sender === 'bot' && (
                Array.isArray(message.data.weatherData) ? (
                  message.data.weatherData.map((wd: WeatherData, index: number) => (
                    <WeatherCard key={index} weatherData={wd} />
                  ))
                ) : (
                  <WeatherCard weatherData={message.data.weatherData} />
                )
              )}
            </div>
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

      <form onSubmit={handleSubmit} className="p-4 border-y border-gray-300 bg-gray-50 shrink-0 rounded-b-lg">
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