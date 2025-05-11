'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ChatWindow from '@/components/ChatWindow';
import WeatherSection from '@/components/WeatherSection';
import NewsSection from '@/components/NewsSection';
import { Message, Location, POI, WeatherData } from '@/types';
import { getChatResponse } from '@/lib/services/chatService';
import { getLocationNews } from '@/lib/api/news';
import { getPlaceNameFromCoordinates } from '@/lib/api/geocoding';
import { motion } from 'framer-motion';

const MapSection = dynamic(() => import('@/components/MapSection'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] relative bg-slate-800/50 rounded-lg animate-pulse" />
  ),
});

interface ChatResponse {
  content: string;
  data: {
    pois: POI[];
    center: Location;
    radiusKm: number;
    weatherData?: WeatherData | WeatherData[];
  } | null;
}

interface MainAppProps {
  initialMessage?: string | null;
}

export default function MainApp({ initialMessage }: MainAppProps) {
  const [isClient, setIsClient] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial-greeting',
      content: 'Hello to ViatorAI! Let me know how I can help you to travel and explore. For how to guide the app, please type Help in the chat. If the location is not correct, turn on your GPS and click on the relocate button on the top right of the header',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [location, setLocation] = useState<Location>({ lat: 51.505, lng: -0.09 });
  const [tempMarker, setTempMarker] = useState<Location | null>(null);
  const [searchMarker, setSearchMarker] = useState<Location | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(0);
  const [isTripPlanned, setIsTripPlanned] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationLoaded, setLocationLoaded] = useState<boolean>(false);
  const [pois, setPois] = useState<POI[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [defaultPlaceName, setDefaultPlaceName] = useState<string>('London');

  useEffect(() => {
    setIsClient(true);
    checkLocation();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      fetchPlaceNameAndNews();
    }
  }, [currentLocation]);

  useEffect(() => {
    if (initialMessage && isClient && locationLoaded && currentLocation) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: initialMessage,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      handleSendMessage(initialMessage, true);
    }
  }, [initialMessage, isClient, locationLoaded, currentLocation]);

  const checkLocation = async () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(newLocation);
          setLocation(newLocation);
          setLocationLoaded(true);
          setShowGpsModal(false);
        },
        async () => {
          setCurrentLocation({ lat: 51.505, lng: -0.09 });
          setLocation({ lat: 51.505, lng: -0.09 });
          setLocationLoaded(true);
          setShowGpsModal(true);
          const name = await getPlaceNameFromCoordinates(51.505, -0.09);
          setDefaultPlaceName(name || 'London');
        }
      );
    } else {
      setCurrentLocation({ lat: 51.505, lng: -0.09 });
      setLocation({ lat: 51.505, lng: -0.09 });
      setLocationLoaded(true);
      setShowGpsModal(true);
      const name = await getPlaceNameFromCoordinates(51.505, -0.09);
      setDefaultPlaceName(name || 'London');
    }
  };

  const fetchPlaceNameAndNews = async () => {
    if (!currentLocation) return;

    setLoadingNews(true);
    try {
      const name = await getPlaceNameFromCoordinates(currentLocation.lat, currentLocation.lng);
      if (name) {
        setPlaceName(name);
        const news = await getLocationNews(name, 10);
        if (news) {
          setArticles(news);
        } else {
          setArticles([]);
          console.warn('MainApp: No news articles found for:', name);
        }
      } else {
        setArticles([]);
        console.warn('MainApp: Could not fetch place name for coordinates:', currentLocation);
      }
    } catch (error) {
      console.error('MainApp: Error fetching place name or news:', error);
      setArticles([]);
    } finally {
      setLoadingNews(false);
    }
  };

  const handleSendMessage = async (content: string, isInitialMessage = false): Promise<ChatResponse> => {
    if (!locationLoaded || !currentLocation) {
      const response: ChatResponse = {
        content: 'Please wait, location is still loading...',
        data: null,
      };
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: response.content,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
      return response;
    }

    if (!isInitialMessage) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
    }

    const isTripPlanning = content.toLowerCase().startsWith('plan a trip');
    setIsTripPlanned(isTripPlanning);

    try {
      const geminiResponse = await getChatResponse(
        content,
        tempMarker ? [tempMarker.lng, tempMarker.lat] : undefined,
        currentLocation ? [currentLocation.lng, currentLocation.lat] : undefined
      );

      const response: ChatResponse = {
        content: geminiResponse.content,
        data: geminiResponse.data
          ? {
              pois: (geminiResponse.data.pois || []).map((poi) => ({
                id: poi.id?.toString() || Date.now().toString(),
                lat: poi.lat,
                lng: poi.lng || poi.lon || 0,
                name: poi.name || (poi.tags && poi.tags.name) || 'Unnamed',
                category:
                  poi.category ||
                  (poi.tags && (poi.tags.amenity || poi.tags.leisure || poi.tags.tourism)) ||
                  'unknown',
                priority: poi.priority,
              })),
              center: geminiResponse.data.center || currentLocation || { lat: 51.505, lng: -0.09 },
              radiusKm: geminiResponse.data.radiusKm || 5,
              weatherData: geminiResponse.data.weatherData,
            }
          : null,
      };

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: 'bot',
        timestamp: new Date(),
        data: response.data,
      };
      setMessages((prev) => [...prev, botResponse]);

      if (response.data && response.data.pois && response.data.pois.length > 0) {
        setPois(response.data.pois);
        if (typeof window !== 'undefined') {
          (window as any).latestSpiralWeatherData = response.data.weatherData || [];
        }
      }

      if (response.data?.center) {
        setSearchMarker(response.data.center);
        setSearchRadius(response.data.radiusKm * 1000);
      }

      return response;
    } catch (error) {
      console.error('MainApp: Error getting chat response:', error);
      const response: ChatResponse = {
        content: 'Sorry, something went wrong.',
        data: null,
      };
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: response.content,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
      return response;
    }
  };

  const handleLocationChange = (loc: Location | null) => {
    if (loc) {
      setCurrentLocation(loc);
      setLocationLoaded(true);
      setShowGpsModal(false);
    } else {
      console.warn('MainApp: Received null location in handleLocationChange');
      setShowGpsModal(true);
    }
  };

  const handlePOIsUpdated = (pois: POI[], center: Location, radiusKm: number) => {
    setPois(pois);
    setSearchMarker(center);
    setSearchRadius(radiusKm * 1000);
  };

  const handleClearAll = () => {
    setTempMarker(null);
    setSearchMarker(null);
    setSearchRadius(0);
    setPois([]);
    setIsTripPlanned(false);
  };

  const handleSearchMarkerChange = (marker: Location | null, radiusKm?: number) => {
    setSearchMarker(marker);
    setSearchRadius(radiusKm ? radiusKm * 1000 : 0);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2A44] to-[#1A3657]">
      <Header isMainApp onRefreshLocation={checkLocation} />
      {showGpsModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mb-4">Location Not Found</h3>
            <p className="text-indigo-600 dark:text-indigo-400/80 mb-4">
              Please turn on your GPS. Using {defaultPlaceName} for now.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowGpsModal(false)}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg"
              >
                OK
              </button>
              <button
                onClick={() => {
                  checkLocation();
                  setShowGpsModal(false);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Retry
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      <main className="pt-20 pb-12">
        <div className="content-container max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
              <div className="glass-card p-1 shadow-lg rounded-lg overflow-hidden">
                <div className="h-[400px] relative">
                  <MapSection
                    location={location}
                    onTempMarkerChange={setTempMarker}
                    onCurrentLocationChange={handleLocationChange}
                    onSearchThingsToDo={handleSendMessage}
                    searchMarker={searchMarker}
                    searchRadius={searchRadius}
                    isTripPlanned={isTripPlanned}
                    pois={pois}
                    currentLocation={currentLocation}
                    onClearAll={handleClearAll}
                  />
                </div>
              </div>
              {locationLoaded && currentLocation ? (
                <div className="glass-card p-1 shadow-lg rounded-lg overflow-hidden h-[800px]">
                  <ChatWindow
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    currentLocation={currentLocation}
                    onPOIsUpdated={handlePOIsUpdated}
                    onSearchMarkerChange={handleSearchMarkerChange}
                  />
                </div>
              ) : (
                <div className="glass-card p-1 shadow-lg rounded-lg overflow-hidden h-[800px] flex items-center justify-center text-foreground">
                  <div className="text-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-lg">Loading location... Please wait.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="lg:col-span-5 space-y-8">
              {locationLoaded && currentLocation ? (
                <div className="glass-card p-1 shadow-lg rounded-lg overflow-hidden">
                  <WeatherSection currentLocation={currentLocation} />
                </div>
              ) : (
                <div className="glass-card p-1 shadow-lg rounded-lg overflow-hidden h-[400px] flex items-center justify-center text-foreground">
                  <div className="text-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-lg">Loading weather...</p>
                  </div>
                </div>
              )}
              {locationLoaded && currentLocation ? (
                <div className="glass-card p-1 shadow-lg rounded-lg overflow-hidden">
                  <NewsSection articles={articles} loading={loadingNews} currentLocation={currentLocation} />
                </div>
              ) : (
                <div className="glass-card p-1 shadow-lg rounded-lg overflow-hidden h-[400px] flex items-center justify-center text-foreground">
                  <div className="text-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-lg">Loading news...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}