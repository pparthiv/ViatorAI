"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { Location } from "@/types";
import React from "react";

interface MapComponentProps {
  currentLocation: Location;
  mapLoaded: boolean;
}

const MapComponent = React.memo(({ currentLocation, mapLoaded }: MapComponentProps) => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Fix Leaflet marker icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    }
  }, []);

  return (
    <div className="relative w-full h-full isolate">
      <div className="absolute inset-0 z-0">
        {mapLoaded ? (
          <MapContainer
            center={[currentLocation.lat, currentLocation.lng]}
            zoom={13}
            style={{ height: "100%", width: "100%", borderRadius: "12px" }}
            className="z-0"
            zoomControl={false}
            scrollWheelZoom={false}
            dragging={false}
            doubleClickZoom={false}
            touchZoom={false}
            boxZoom={false}
            keyboard={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[currentLocation.lat, currentLocation.lng]} />
          </MapContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin w-10 h-10 border-4 border-indigo-300 border-t-transparent rounded-full"></div>
              <p className="text-indigo-300 text-sm font-medium">Loading your location...</p>
            </div>
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
      <div className="absolute bottom-6 left-6 right-6">
        <h3 className="text-indigo-300 text-xl font-bold mb-2">Discover Your World</h3>
        <p className="text-indigo-300/80 text-sm">Explore breathtaking destinations around the globe</p>
      </div>
    </div>
  );
});

export default MapComponent;