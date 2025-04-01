'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Wind, Cloud, Sun, MapPin, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';

const MainApp = dynamic(() => import('@/components/MainApp'), {
  loading: () => (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  ),
});

const sampleQueries = [
  "Plan a trip to Rome for 5 days.",
  "How’s the weather in San Francisco today?",
  "Show me things to do in Tokyo",
  "How's the air quality in London?",
  "What's the 5-day forecast for Berlin?",
  "Any events in New York this weekend?",
  "Is it going to rain in Singapore?",
  "What are some fun things to do in Mumbai?",
  "What are some rainy places I can go to?",
  "Current temperature in Dubai?",
  "Weather forecast for Sydney",
  "What are the latest news updates from Delhi?",
  "What are some calm places with low wind?",
];

const additionalQueries = [
  "Plan a trip to Jaipur for 5 days.",  
  "How’s the weather in Bangalore today?",  
  "Show me things to do in Chennai",  
  "How's the air quality in Mumbai?",  
  "What's the 5-day forecast for Hyderabad?",  
  "Any events in Kolkata this weekend?",  
  "Is it going to rain in Pune?",  
  "What are some fun things to do in Ahmedabad?",  
  "What are some rainy places I can go to?",  
  "Current temperature in Delhi?",  
  "Weather forecast for Goa",  
  "What are the latest news updates from Lucknow?",  
];

export default function Home() {
  const [showMainApp, setShowMainApp] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ lat: 51.505, lng: -0.09 });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [floatingIcons, setFloatingIcons] = useState([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setMapLoaded(true);
        },
        () => {
          setMapLoaded(true);
        }
      );
    } else {
      setMapLoaded(true);
    }

  }, []);

  if (showMainApp) {
    return <MainApp />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2A44] to-[#1A3657] relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(62,87,229,0.1),transparent_50%),radial-gradient(circle_at_80%_40%,rgba(229,62,62,0.1),transparent_50%),radial-gradient(circle_at_40%_60%,rgba(62,229,121,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(229,162,62,0.1),transparent_50%)]"></div>
        </div>

        {/* Floating Weather Icons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          {floatingIcons.map((icon, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={icon}
              animate={{
                y: [0, -20, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            >
              {i % 4 === 0 ? (
                <Sun className="text-yellow-500/20" size={24} />
              ) : i % 4 === 1 ? (
                <Cloud className="text-blue-500/20" size={24} />
              ) : i % 4 === 2 ? (
                <Wind className="text-teal-500/20" size={24} />
              ) : (
                <MapPin className="text-red-500/20" size={24} />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      <Header />

      <main className="relative pt-20">
        {/* Hero Section */}
        <section className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="p-2 rounded-full bg-indigo-600/30 backdrop-blur-sm"
              >
                <Globe className="w-12 h-12 text-indigo-300" />
              </motion.div>
              <h1 className="text-6xl font-extrabold text-white tracking-tight glow-text font-serif">
                ViatorAI
              </h1>
            </div>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto font-light tracking-wide">
              Your intelligent travel companion for weather-smart journey planning
            </p>
          </motion.div>

          {/* Map Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-2xl mx-auto mb-12"
          >
            <div className="glass-card p-1 shadow-lg h-[300px] relative overflow-hidden rounded-xl">
              {!mapLoaded ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                    <p className="text-indigo-300 text-sm font-medium">Loading your location...</p>
                  </div>
                </div>
              ) : (
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                    currentLocation.lng - 0.02
                  }%2C${currentLocation.lat - 0.02}%2C${
                    currentLocation.lng + 0.02
                  }%2C${
                    currentLocation.lat + 0.02
                  }&layer=mapnik&marker=${currentLocation.lat}%2C${
                    currentLocation.lng
                  }&scrollWheelZoom=false&zoomControl=false`}
                  className="w-full h-full border-0 rounded-xl"
                ></iframe>
              )}
            </div>
          </motion.div>

          {/* Query Carousels */}
          <div className="w-full max-w-4xl mx-auto overflow-hidden mb-6">
            <motion.div
              animate={{
                x: [0, -1920, 0],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear",
              }}
              className="flex gap-4 whitespace-nowrap"
            >
              {[...sampleQueries, ...sampleQueries].map((query, i) => (
                <div
                  key={i}
                  className="glass-card px-6 py-3 rounded-full text-white/80 hover:text-white/100 transition-colors cursor-pointer font-light"
                >
                  {query}
                </div>
              ))}
            </motion.div>
          </div>

          <div className="w-full max-w-4xl mx-auto overflow-hidden mb-12">
            <motion.div
              animate={{
                x: [0, -1920, 0],
              }}
              transition={{
                duration: 35,
                repeat: Infinity,
                ease: "linear",
                delay: 5,
              }}
              className="flex gap-4 whitespace-nowrap"
            >
              {[...additionalQueries, ...additionalQueries].map((query, i) => (
                <div
                  key={i}
                  className="glass-card px-6 py-3 rounded-full text-white/80 hover:text-white/100 transition-colors cursor-pointer font-light"
                >
                  {query}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Explore Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMainApp(true)}
            className="glass-card px-8 py-4 rounded-full text-lg font-medium text-white flex items-center gap-2 hover:bg-white/20 transition-all duration-300"
          >
            Explore Now
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-white text-center mb-16">
              Your All-in-One Travel Companion
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Cloud,
                  title: "Real-time Weather",
                  description:
                    "Get accurate weather forecasts and air quality data for any location worldwide.",
                },
                {
                  icon: MapPin,
                  title: "Smart Location Planning",
                  description:
                    "Discover nearby attractions and plan your itinerary based on weather conditions.",
                },
                {
                  icon: Globe,
                  title: "Travel Insights",
                  description:
                    "Access local news, events, and travel recommendations tailored to your destination.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-card p-6 rounded-xl text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-600/30 flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-indigo-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-blue-200 font-light leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
