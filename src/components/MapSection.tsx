'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Location, POI, WeatherData } from '@/types';
import L from 'leaflet';
import { X, Plus, Map, Cloud, Gauge, Wind, Thermometer, Droplets, LocateFixed, Sun, CloudSnow, Umbrella, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, fromUnixTime, isBefore, isAfter } from 'date-fns';
import ReactDOMServer from 'react-dom/server';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const worldBounds: L.LatLngBoundsExpression = [[-90, -180], [90, 180]];

const getBackgroundImage = (weatherMain: string, sunrise: number, sunset: number) => {
  const now = new Date();
  const isDayTime = isAfter(now, fromUnixTime(sunrise)) && isBefore(now, fromUnixTime(sunset));
  const timeOfDay = isDayTime ? 'day' : 'night';

  switch (weatherMain.toLowerCase()) {
    case 'clear':
      return `/clear_${timeOfDay}.png`;
    case 'clouds':
      return `/cloudy_${timeOfDay}.png`;
    case 'rain':
      return `/rainy_${timeOfDay}.png`;
    case 'snow':
      return `/snowy_${timeOfDay}.png`;
    case 'thunderstorm':
      return `/thunderstorm_${timeOfDay}.png`;
    default:
      return `/fallback.png`;
  }
};

interface MapSectionProps {
  location: Location;
  onTempMarkerChange?: (marker: Location | null) => void;
  onCurrentLocationChange?: (location: Location | null) => void;
  onSearchThingsToDo?: (query: string) => Promise<{
    content: string;
    data: { pois: any[]; center: Location; radiusKm: number; weatherData?: WeatherData | WeatherData[] } | null;
  }>;
  searchMarker?: Location | null;
  searchRadius?: number;
  isTripPlanned?: boolean;
  pois?: POI[];
  currentLocation?: Location | null;
  onClearAll?: () => void;
}

const currentLocationIcon = L.divIcon({
  className: 'current-location-marker',
  html: `<div style="width: 24px; height: 24px; background-color: #4285F4; border-radius: 50%; border: 4px solid #A0C5F9; box-shadow: 0 0 10px rgba(66, 133, 244, 0.6);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const tempMarkerIcon = L.divIcon({
  className: 'temp-marker',
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.7));">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
      <path d="M12 7v6"/>
      <path d="M9 10h6"/>
    </svg>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const searchMarkerIcon = L.divIcon({
  className: 'search-marker',
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.7));">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const spiralMarkerIcon = (priority: number) =>
  L.divIcon({
    className: 'spiral-marker',
    html: `<div style="width: 30px; height: 30px; background-color: #800080; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${priority}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });

const createPOIMarkerIcon = (category: string) => {
  const categoryStyles: { [key: string]: { color: string; emoji: string } } = {
    attraction: { color: '#FFD700', emoji: '🌟' },
    restaurant: { color: '#FF5733', emoji: '🍴' },
    park: { color: '#28A745', emoji: '🌳' },
    pub: { color: '#8B4513', emoji: '🍺' },
    museum: { color: '#6A5ACD', emoji: '🏛️' },
    unknown: { color: '#17A2B8', emoji: '📍' },
  };
  const { color, emoji } = categoryStyles[category.toLowerCase()] || categoryStyles.unknown;
  return L.divIcon({
    className: 'poi-marker',
    html: `<div style="width: 30px; height: 30px; background-color: ${color}; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;"><span style="font-size: 16px;">${emoji}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY || '';

interface TileLayerConfig {
  url: string;
  icon: React.FC<any>;
  color: string;
  label: string;
}

const tileLayers: Record<string, TileLayerConfig> = {
  base: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', icon: Map, color: 'text-blue-400', label: 'Base Map' },
  clouds: { url: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`, icon: Cloud, color: 'text-gray-400', label: 'Cloud Cover' },
  pressure: { url: `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${API_KEY}`, icon: Gauge, color: 'text-purple-400', label: 'Sea Level Pressure' },
  wind: { url: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${API_KEY}`, icon: Wind, color: 'text-teal-400', label: 'Wind Speed' },
  temperature: { url: `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`, icon: Thermometer, color: 'text-red-400', label: 'Temperature' },
  precipitation: { url: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`, icon: Droplets, color: 'text-blue-500', label: 'Precipitation' },
};

interface MapControlProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
  labelPosition?: 'left' | 'right';
}

const MapControl: React.FC<MapControlProps> = ({ icon, label, onClick, active, className, labelPosition = 'right' }) => (
  <div className="relative group">
    <button
      onClick={onClick}
      className={cn(
        "neomorphic w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200",
        active && "ring-2 ring-blue-500 ring-opacity-50",
        className
      )}
    >
      {icon}
    </button>
    <div className={cn(
      "absolute top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50",
      labelPosition === 'right' ? "left-12" : "right-12"
    )}>
      <div className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg">
        {label}
      </div>
    </div>
  </div>
);

const MapEventsHandler: React.FC<{
  isTaggingMode: boolean;
  setTempMarker: (loc: Location | null) => void;
  onTempMarkerChange?: (marker: Location | null) => void;
}> = ({ isTaggingMode, setTempMarker, onTempMarkerChange }) => {
  useMapEvents({
    click(e) {
      if (isTaggingMode) {
        const newMarker = { lat: e.latlng.lat, lng: e.latlng.lng };
        setTempMarker(newMarker);
        onTempMarkerChange?.(newMarker);
      }
    },
  });
  return null;
};

const SpiralWeatherWidget: React.FC<{ weatherData: WeatherData }> = ({ weatherData }) => {
  const { city, temperature, clouds } = weatherData;
  const { name: cityName, sunrise: citySunrise, sunset: citySunset } = city;
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });

  const backgroundImage = getBackgroundImage(weatherData.forecast[0].weather.main || 'Clear', citySunrise, citySunset);

  return (
    <div
      className="relative w-48 h-48 rounded-2xl overflow-y-auto shadow-lg bg-opacity-40 custom-scrollbar-2"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: 'black',
      }}
    >
      <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
        <div className="flex flex-col items-start">
          <div className="text-3xl font-bold mr-2 flex justify-between">
            <div className='flex-start'>{temperature.value.toFixed(0)}°</div>
            <div className='justify-items-end'>
              {clouds.name?.toLowerCase() === 'clear' ? (
                <Sun className="h-8 w-8" />
              ) : clouds.name?.toLowerCase() === 'rain' ? (
                <Umbrella className="h-8 w-8" />
              ) : clouds.name?.toLowerCase() === 'snow' ? (
                <CloudSnow className="h-8 w-8" />
              ) : clouds.name?.toLowerCase() === 'thunderstorm' ? (
                <Zap className="h-8 w-8" />
              ) : (
                <Cloud className="h-8 w-8" />
              )}
            </div>
          </div>
          <div className="text-xl font-semibold">{cityName}</div>
        </div>

        <div className="space-y-1 pt-5 pb-3">
          <div className="text-sm">{currentDate}</div>
          <div className="text-sm flex items-center" style={{ textTransform: 'capitalize'}}>
            {clouds.name ? clouds.name : 'Clear'}
          </div>
          <div className="text-sm">
            {temperature.min.toFixed(0)}° / {temperature.max.toFixed(0)}°
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MapSection({
  location,
  onTempMarkerChange,
  onCurrentLocationChange,
  onSearchThingsToDo,
  searchMarker,
  searchRadius,
  isTripPlanned,
  pois = [],
  currentLocation,
  onClearAll,
}: MapSectionProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [tempMarker, setTempMarker] = useState<Location | null>(null);
  const [isTaggingMode, setIsTaggingMode] = useState(false);
  const [activeLayer, setActiveLayer] = useState<string>('base');
  const [loadedLayers, setLoadedLayers] = useState<Record<string, L.TileLayer>>({});
  const [searchCenter, setSearchCenter] = useState<Location | null>(null);
  const [localSearchRadius, setLocalSearchRadius] = useState<number>(0);
  const [showSpiralCircle, setShowSpiralCircle] = useState(false);
  const initialized = useRef(false);
  const [poiBounds, setPoiBounds] = useState<L.LatLngBounds | null>(null);

  // console.log('MapSection: Received POIs:', pois);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
  
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setUserLocation(newLocation);
          onCurrentLocationChange?.(newLocation);
          if (mapRef.current) mapRef.current.setView([newLocation.lat, newLocation.lng], 14);
        },
        (error) => {
          setUserLocation(location);
          onCurrentLocationChange?.(location);
          if (mapRef.current) mapRef.current.setView([location.lat, location.lng], 14);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setUserLocation(location);
      onCurrentLocationChange?.(location);
      if (mapRef.current) mapRef.current.setView([location.lat, location.lng], 14);
    }
  }, [location, onCurrentLocationChange]);
  
  // Add new useEffect for bounds
  useEffect(() => {
    if (pois.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(
        pois.map((poi) => L.latLng(poi.lat, poi.lng))
      );
      setPoiBounds(bounds);
    } else {
      setPoiBounds(null);
    }
  }, [pois]);
  
  useEffect(() => {
    if (poiBounds && mapRef.current) {
      mapRef.current.fitBounds(poiBounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [poiBounds]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setUserLocation(newLocation);
          onCurrentLocationChange?.(newLocation);
          if (mapRef.current) mapRef.current.setView([newLocation.lat, newLocation.lng], 14);
        },
        (error) => {
          setUserLocation(location);
          onCurrentLocationChange?.(location);
          if (mapRef.current) mapRef.current.setView([location.lat, location.lng], 14);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setUserLocation(location);
      onCurrentLocationChange?.(location);
      if (mapRef.current) mapRef.current.setView([location.lat, location.lng], 14);
    }
  }, [location, onCurrentLocationChange]);

  useEffect(() => {
    if (searchMarker) {
      setSearchCenter(searchMarker);
      setLocalSearchRadius(searchRadius || 5 * 1000);
      if (mapRef.current) {
        mapRef.current.flyTo([searchMarker.lat, searchMarker.lng], 12, { duration: 1 });
      }
    }
  }, [searchMarker, searchRadius]);

  useEffect(() => {
    setShowSpiralCircle(pois.some(poi => poi.category === 'Weather Suggestion' && poi.priority));
  }, [pois]);

  const handleThingsToDo = async (query: string) => {
    if (!onSearchThingsToDo || !userLocation) return;

    const { data } = await onSearchThingsToDo(query);
    if (data) {
      setSearchCenter(data.center);
      setLocalSearchRadius(data.radiusKm * 1000);
      if (mapRef.current) {
        mapRef.current.flyTo([data.center.lat, data.center.lng], 12, { duration: 1 });
        setActiveLayer('base');
        Object.keys(loadedLayers).forEach(key => {
          if (loadedLayers[key]) mapRef.current?.removeLayer(loadedLayers[key]);
        });
      }
    }
  };

  const clearAll = () => {
    setTempMarker(null);
    setSearchCenter(null);
    setLocalSearchRadius(0);
    setShowSpiralCircle(false);
    onTempMarkerChange?.(null);
    onClearAll?.();
  };

  const centerOnCurrentLocation = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1 });
    }
  };

  const toggleTaggingMode = () => {
    setIsTaggingMode((prev) => !prev);
  };

  const handleLayerChange = (layerKey: string) => {
    if (!mapRef.current || !API_KEY || layerKey === activeLayer) return;

    const map = mapRef.current;

    if (activeLayer !== 'base' && loadedLayers[activeLayer]) {
      map.removeLayer(loadedLayers[activeLayer]);
    }

    if (!loadedLayers[layerKey] && layerKey !== 'base') {
      const newLayer = L.tileLayer(tileLayers[layerKey].url, {
        attribution: '© OpenWeatherMap',
        opacity: 0.7,
        noWrap: true,
      });
      setLoadedLayers((prev) => ({ ...prev, [layerKey]: newLayer }));
      newLayer.addTo(map);
    } else if (layerKey !== 'base') {
      loadedLayers[layerKey].addTo(map);
    }

    setActiveLayer(layerKey);
  };

  const getDestinationMarker = () => tempMarker || searchCenter;

  if (!userLocation) {
    return <div className="h-full flex items-center justify-center text-white">Loading map...</div>;
  }

  return (
    <div className="h-[400px] relative rounded-lg overflow-hidden shadow-lg bg-muted/20">
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={14}
        className="h-full w-full"
        zoomControl={true}
        ref={mapRef}
        maxBounds={worldBounds}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          url={tileLayers.base.url}
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          noWrap={true}
        />
        {activeLayer !== 'base' && loadedLayers[activeLayer] && <TileLayer url={tileLayers[activeLayer].url} noWrap={true} />}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={currentLocationIcon}>
          <Popup>You are here</Popup>
        </Marker>
        {tempMarker && (
          <Marker position={[tempMarker.lat, tempMarker.lng]} icon={tempMarkerIcon}>
            <Popup>Temporary Marker</Popup>
          </Marker>
        )}
        {searchCenter && (
          <Marker position={[searchCenter.lat, searchCenter.lng]} icon={searchMarkerIcon}>
            <Popup>Search Location</Popup>
          </Marker>
        )}
        {pois.map((poi) => {
          const isWeatherSuggestion = poi.category === 'Weather Suggestion';
          const weatherData = (window as any).latestSpiralWeatherData?.find((wd: WeatherData) => wd.city.name === poi.name) || {};

          // Render SpiralWeatherWidget to HTML string for Weather Suggestion
          const widgetHtml = isWeatherSuggestion
            ? ReactDOMServer.renderToString(
                <SpiralWeatherWidget weatherData={weatherData} />
              )
            : null;

          const markerIcon = isWeatherSuggestion && poi.priority
            ? spiralMarkerIcon(poi.priority)
            : createPOIMarkerIcon(poi.category);

          return (
            <React.Fragment key={poi.id}>
              <Marker
                position={[poi.lat, poi.lng]}
                icon={markerIcon}
              >
                <Popup
                  closeButton={false}
                  autoClose={false}
                  closeOnClick={false}
                  className="weather-popup" // Use a specific class for weather popups
                  maxWidth={150}
                  maxHeight={200}
                >
                  {isWeatherSuggestion && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          const popupElement = (e.target as HTMLElement).closest('.leaflet-popup');
                          if (popupElement) {
                            popupElement.remove(); // Close the popup
                          }
                        }}
                        className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-75 transition-all z-10"
                      >
                        <X size={14} />
                      </button>
                      <div
                        dangerouslySetInnerHTML={{ __html: widgetHtml || '' }}
                      />
                    </div>
                  )}
                  {!isWeatherSuggestion && `${poi.name} (${poi.category})`}
                </Popup>
              </Marker>
              {isWeatherSuggestion && (
                <Circle
                  center={[poi.lat, poi.lng]}
                  radius={20 * 1000}
                  pathOptions={{ color: '#800080', fillColor: '#800080', fillOpacity: 0.35, dashArray: '5, 5' }}
                />
              )}
            </React.Fragment>
          );
        })}
        {showSpiralCircle && currentLocation && (
          <Circle
            center={[currentLocation.lat, currentLocation.lng]}
            radius={200 * 1000}
            pathOptions={{ color: '#28A745', fillColor: '#28A745', fillOpacity: 0.1 }}
          />
        )}
        {searchCenter && localSearchRadius > 0 && !showSpiralCircle && (
          <Circle
            center={[searchCenter.lat, searchCenter.lng]}
            radius={localSearchRadius}
            pathOptions={{ color: '#4285F4', fillColor: '#A0C5F9', fillOpacity: 0.2 }}
          />
        )}
        {isTripPlanned && getDestinationMarker() && (
          <Polyline
            positions={[[userLocation.lat, userLocation.lng], [getDestinationMarker()!.lat, getDestinationMarker()!.lng]]}
            pathOptions={{ color: '#4285F4', weight: 4, opacity: 0.5, dashArray: '10, 10' }}
          />
        )}
        <MapEventsHandler isTaggingMode={isTaggingMode} setTempMarker={setTempMarker} onTempMarkerChange={onTempMarkerChange} />
      </MapContainer>

      <div className="absolute bottom-4 left-4 flex flex-col space-y-3 z-[1000]">
        <MapControl
          icon={<X size={20} />}
          label="Clear markers and POIs"
          onClick={clearAll}
          className="bg-accent text-accent-foreground hover:bg-accent/80"
        />
        <MapControl
          icon={<LocateFixed size={20} />}
          label="Center on current location"
          onClick={centerOnCurrentLocation}
          className="bg-primary text-primary-foreground hover:bg-primary/80"
        />
        <MapControl
          icon={<Plus size={20} className={isTaggingMode ? "rotate-45" : ""} />}
          label={isTaggingMode ? "Cancel marker placement" : "Place a marker"}
          onClick={toggleTaggingMode}
          active={isTaggingMode}
          className={cn(isTaggingMode ? "bg-green-500 text-white hover:bg-green-600" : "bg-secondary text-foreground hover:bg-secondary/80")}
        />
        <MapControl
          icon={<Map size={20} />}
          label="Discover nearby attractions"
          onClick={() => handleThingsToDo('Things to do in this location')}
          className="bg-teal-500 text-white hover:bg-teal-600"
        />
      </div>

      <div className="absolute top-4 right-4 flex flex-col space-y-3 z-[1000]">
        {Object.entries(tileLayers).map(([key, { icon: Icon, color, label }]) => (
          <MapControl
            key={key}
            icon={<Icon size={20} className={color} />}
            label={label}
            onClick={() => handleLayerChange(key)}
            active={activeLayer === key}
            className={cn("bg-secondary text-foreground hover:bg-secondary/80", activeLayer === key && "opacity-50 cursor-not-allowed")}
            labelPosition="left"
          />
        ))}
      </div>
    </div>
  );
}