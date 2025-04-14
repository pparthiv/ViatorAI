export interface Location {
  lat: number;
  lng: number;
}

export interface POI {
  id: string | number;
  lat: number;
  lng: number;
  name?: string; // Optional, as it might come from tags.name or chat response
  category?: string; // Derived from tags or chat response
  priority?: number; // For spiral markers
  tags?: {
    name?: string;
    amenity?: string;
    leisure?: string;
    tourism?: string;
  };
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MarkerIcon {
  className: string;
  html: string;
  iconSize: [number, number];
  iconAnchor: [number, number];
  popupAnchor?: [number, number];
}