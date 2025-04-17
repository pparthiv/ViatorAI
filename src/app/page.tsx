"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Globe, Github, Menu, X, Cloud, MapPin, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";
import { Location } from "@/types";
import Image from "next/image";
import React from "react";

// Dynamically import MainApp
const MainApp = dynamic(() => import("@/components/MainApp"), {
  loading: () => (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  ),
  ssr: false,
});

// Dynamically import MapComponent to avoid SSR issues with Leaflet
const MapComponent = dynamic(
  () =>
    import("@/components/MapComponent").then((mod) => mod.default),
  {
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-300 border-t-transparent rounded-full"></div>
          <p className="text-indigo-300 text-sm font-medium">Loading your location...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

// Sample destinations and queries
const popularDestinations = [
  {
    name: "Paris",
    country: "France",
    image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=2070&auto=format&fit=crop",
    temperature: 21,
    weather: "Partly Cloudy",
  },
  {
    name: "Tokyo",
    country: "Japan",
    image: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=2036&auto=format&fit=crop",
    temperature: 24,
    weather: "Clear",
  },
  {
    name: "New York",
    country: "USA",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=2070&auto=format&fit=crop",
    temperature: 18,
    weather: "Rainy",
  },
  {
    name: "Sydney",
    country: "Australia",
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=2070&auto=format&fit=crop",
    temperature: 26,
    weather: "Sunny",
  },
];

const travelQueries = [
  "Plan a trip to Rome for 5 days",
  "Weather in San Francisco today",
  "Things to do in Tokyo",
  "Air quality in London",
  "5-day forecast for Berlin",
  "Events in New York this weekend",
  "Rainy places to visit",
  "Current temperature in Dubai",
];

export default function Home() {
  const [showMainApp, setShowMainApp] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location>({ lat: 51.505, lng: -0.09 });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [initialChatMessage, setInitialChatMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
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

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setInitialChatMessage(`Tell me about ${searchQuery}`);
    } else {
      setInitialChatMessage(null);
    }
    setShowMainApp(true);
  };

  const memoizedCurrentLocation = useMemo(() => currentLocation, [currentLocation.lat, currentLocation.lng]);

  if (showMainApp) {
    return <MainApp initialMessage={initialChatMessage} />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-b from-[#0F2A44] to-[#1A3657]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.8 }}>
                <Image src='/viatorai_color_logo.png' height={24} width={24} alt='Viator AI Logo'/>
              </motion.div>
              <span className="font-semibold text-xl text-indigo-700 dark:text-indigo-300">ViatorAI</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#"
              className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors"
            >
              Home
            </a>
            <a
              href="#"
              className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors"
            >
              Explore
            </a>
            <a
              href="#"
              className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors"
            >
              Weather
            </a>
            <a
              href="#"
              className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors"
            >
              Contact
            </a>
            <Link
              href="https://github.com/pparthiv/ViatorAI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors"
            >
              <Github className="h-5 w-5" />
            </Link>
          </nav>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <a
                href="#"
                className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors py-2"
              >
                Home
              </a>
              <a
                href="#"
                className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors py-2"
              >
                Explore
              </a>
              <a
                href="#"
                className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors py-2"
              >
                Weather
              </a>
              <a
                href="#"
                className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors py-2"
              >
                Contact
              </a>
              <Link
                href="https://github.com/pparthiv/ViatorAI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Github className="h-5 w-5" />
                <span>GitHub</span>
              </Link>
            </div>
          </motion.div>
        )}
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-white to-indigo-50 dark:from-[#0F2A44] dark:to-[#1A3657]">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-3 mb-8"
            >
              <Image src='/viatorai_color_logo.png' height={48} width={48} alt='Viator AI Logo'/>
              <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-500 dark:from-indigo-300 dark:to-purple-400">
                ViatorAI
              </h1>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Badge variant="outline" className="mb-4 text-indigo-700 border-indigo-500/30 bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-400/30 dark:bg-indigo-400/10">
                    Your AI Travel Companion
                  </Badge>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-indigo-700 dark:text-indigo-300 leading-tight">
                    Experience The Magic Of <span className="text-indigo-500 dark:text-indigo-400">Travel!</span>
                  </h1>
                  <p className="mt-4 text-lg text-indigo-600 dark:text-indigo-400 max-w-lg font-light">
                    Discover the world with weather-smart journey planning. Find perfect destinations based on your
                    weather preferences.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col sm:flex-row gap-4 items-center"
                >
                  <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
                    <div className="relative flex-1 w-full sm:w-auto">
                      <Input
                        type="text"
                        placeholder="Where would you like to go?"
                        className="glass-input h-12 pr-10 text-base text-indigo-700 dark:text-indigo-300 placeholder-indigo-500/50 dark:placeholder-indigo-400/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-500/40 dark:text-indigo-400/40" />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="glass-card h-12 px-6 rounded-full text-base font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 dark:hover:bg-indigo-400/20 transition-all duration-300 sm:w-auto"
                    >
                      Explore Now
                    </motion.button>
                  </form>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex flex-wrap gap-3 pt-4"
                >
                  <p className="text-sm text-indigo-600 dark:text-indigo-400/60 mr-2">Popular searches:</p>
                  {travelQueries.slice(0, 3).map((query, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="glass-card cursor-pointer text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 dark:hover:bg-indigo-400/20 transition-colors"
                      onClick={() => {
                        setSearchQuery(query);
                        setInitialChatMessage(`Tell me about ${query}`);
                        setShowMainApp(true);
                      }}
                    >
                      {query}
                    </Badge>
                  ))}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                className="relative h-[400px] rounded-xl overflow-hidden glass-card"
              >
                <MapComponent currentLocation={memoizedCurrentLocation} mapLoaded={mapLoaded} />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="py-8">
          <div className="container mx-auto px-4">
            <hr className="border-indigo-200 dark:border-indigo-800/30" />
          </div>
        </div>

        {/* Popular Destinations */}
        <section className="py-16 bg-white dark:bg-[#0F2A44]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 mb-8">Popular Destinations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularDestinations.map((destination, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group cursor-pointer"
                >
                  <Card className="glass-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:text-indigo-700">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={destination.image}
                        alt={destination.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-3 right-3 bg-slate-900/80 rounded-full px-2 py-1 text-xs font-medium text-white">
                        {destination.temperature}°C
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-white">{destination.name}</h3>
                          <p className="text-sm text-white">{destination.country}</p>
                        </div>
                        <Badge variant="outline" className="bg-indigo-600/30 text-white border-indigo-300/30">
                          4.8 ★
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="py-8">
          <div className="container mx-auto px-4">
            <hr className="border-indigo-200 dark:border-indigo-800/30" />
          </div>
        </div>

        {/* Journey Steps */}
        <section className="py-16 bg-gradient-to-b from-indigo-50 to-white dark:from-[#1A3657] dark:to-[#0F2A44]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 mb-4">Journey To The Skies Made Simple!</h2>
              <p className="text-indigo-600 dark:text-indigo-400 max-w-2xl mx-auto font-light">
                Planning your perfect weather-based trip is easy with our simple process
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "Step 1",
                  title: "Find Your Destination",
                  description: "Search for locations with your preferred weather conditions and attractions.",
                  icon: MapPin,
                  color: "bg-blue-500",
                },
                {
                  step: "Step 2",
                  title: "Check Weather",
                  description: "Get detailed weather forecasts and climate information for your chosen destination.",
                  icon: Cloud,
                  color: "bg-primary",
                },
                {
                  step: "Step 3",
                  title: "Plan Your Journey",
                  description: "Create your itinerary based on weather patterns and local recommendations.",
                  icon: Globe,
                  color: "bg-green-500",
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <Card className="h-full border-slate-200 dark:border-slate-800">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center mb-4`}>
                        <step.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-primary">{step.step}</p>
                        <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                        <p className="text-slate-300">{step.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-7 transform -translate-y-1/2 z-10">
                      <ArrowRight className="h-6 w-6 text-slate-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="glass-card py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Image src='/viatorai_color_logo.png' height={24} width={24} alt='Viator AI Logo'/>
                  <span className="font-semibold text-xl text-indigo-700 dark:text-indigo-300">ViatorAI</span>
                </div>
                <p className="text-indigo-600 dark:text-indigo-400/60 text-sm">
                  Your intelligent travel companion for weather-smart journey planning.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-indigo-600 dark:text-indigo-400/60 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm">
                      Home
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-indigo-600 dark:text-indigo-400/60 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm">
                      Explore
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-indigo-600 dark:text-indigo-400/60 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm">
                      Weather
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-indigo-600 dark:text-indigo-400/60 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm">
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-indigo-600 dark:text-indigo-400/60 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm">
                      Support
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-indigo-600 dark:text-indigo-400/60 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-indigo-600 dark:text-indigo-400/60 hover:text-indigo-500 dark:hover:text-indigo-400 text-sm">
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-4">Subscribe</h3>
                <p className="text-indigo-600 dark:text-indigo-400/60 text-sm mb-4">Get the latest updates and offers.</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Your email"
                    className="glass-input text-indigo-700 dark:text-indigo-300 placeholder-indigo-500/50 dark:placeholder-indigo-400/50"
                  />
                  <Button size="sm" className="bg-indigo-500 text-indigo-300 hover:bg-indigo-600">
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
            <div className="border-t border-indigo-500/10 dark:border-indigo-400/10 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
              <p className="text-indigo-600 dark:text-indigo-400/60 text-sm">© {new Date().getFullYear()} ViatorAI. All rights reserved.</p>
              <div className="flex gap-4 mt-4 sm:mt-0">
                <a href="#" className="text-indigo-600 dark:text-indigo-400/60 hover:text-indigo-500 dark:hover:text-indigo-400">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="text-indigo-600 dark:text-indigo-400/60 hover:text-indigo-500 dark:hover:text-indigo-400">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-indigo-600 dark:text-indigo-400/60 hover:text-indigo-500 dark:hover:text-indigo-400">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}