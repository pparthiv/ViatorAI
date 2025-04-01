'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ChatWindow from '@/components/ChatWindow';
import WeatherSection from '@/components/WeatherSection';
import NewsSection from '@/components/NewsSection';
import { Message, Location, POI } from '@/types';
import { getChatResponse } from '@/lib/gemini';
import { getLocationNews } from '@/lib/api/news';
import { getPlaceNameFromCoordinates } from '@/lib/api/geocoding';

const MapSection = dynamic(() => import('@/components/MapSection'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] relative bg-slate-800/50 rounded-lg animate-pulse" />
  ),
});

interface ChatResponse {
  content: string;
  data: {
    pois: any[];
    center: Location;
    radiusKm: number;
    weatherData?: any;
  } | null;
}

export default function MainApp() {
  const [isClient, setIsClient] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (currentLocation) {
      fetchPlaceNameAndNews();
    }
  }, [currentLocation]);

  const fetchPlaceNameAndNews = async () => {
    if (!currentLocation) return;

    setLoadingNews(true);
    try {
      const name = await getPlaceNameFromCoordinates(currentLocation.lat, currentLocation.lng);
      if (name) {
        setPlaceName(name);
        // console.log('MainApp: Fetched place name:', name);

        const news = await getLocationNews(name, 10);
        if (news) {
          setArticles(news);
          // console.log('MainApp: News articles set:', news);
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

  const handleSendMessage = async (content: string): Promise<ChatResponse> => {
    if (!locationLoaded || !currentLocation) {
      // console.log('MainApp: Cannot send message, location not ready. locationLoaded:', locationLoaded, 'currentLocation:', currentLocation);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), content: 'Please wait, location is still loading...', sender: 'bot', timestamp: new Date() },
      ]);
      return { content: 'Location not ready', data: null };
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);

    const isTripPlanning = content.toLowerCase().startsWith('plan a trip');
    setIsTripPlanned(isTripPlanning);

    try {
      const response = await getChatResponse(
        content,
        tempMarker ? [tempMarker.lng, tempMarker.lat] : undefined,
        currentLocation ? [currentLocation.lng, currentLocation.lat] : undefined
      );
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: 'bot',
        timestamp: new Date(),
        data: response.data,
      };
      setMessages((prev) => [...prev, botResponse]);

      if (response.data && response.data.pois && response.data.pois.length > 0) {
        const mappedPois: POI[] = response.data.pois.map(poi => ({
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
        // console.log('MainApp: Setting POIs:', mappedPois);
        setPois(mappedPois);
        (window as any).latestSpiralWeatherData = response.data.weatherData || [];
      } else {
        // console.log('MainApp: No POIs to set from response:', response.data);
      }

      return response as ChatResponse;
    } catch (error) {
      console.error('MainApp: Error getting chat response:', error);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), content: 'Sorry, something went wrong.', sender: 'bot', timestamp: new Date() },
      ]);
      return { content: 'Error occurred', data: null };
    }
  };

  const handleLocationChange = (loc: Location | null) => {
    // console.log('MainApp: handleLocationChange called with:', loc);
    if (loc) {
      setCurrentLocation(loc);
      setLocationLoaded(true);
      // console.log('MainApp: Location successfully set to:', loc);
    } else {
      console.warn('MainApp: Received null location in handleLocationChange');
    }
  };

  const handlePOIsUpdated = (pois: POI[], center: Location, radiusKm: number) => {
    setPois(pois);
  };

  const handleClearAll = () => {
    setTempMarker(null);
    setSearchMarker(null);
    setSearchRadius(0);
    setPois([]);
    setIsTripPlanned(false);
  };

  const handleSearchMarkerChange = (marker: Location | null, radiusKm?: number) => {
    // console.log('MainApp: Setting search marker:', marker, 'with radius:', radiusKm);
    setSearchMarker(marker);
    setSearchRadius(radiusKm ? radiusKm * 1000 : 0);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2A44] to-[#1A3657]">
      <Header />
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