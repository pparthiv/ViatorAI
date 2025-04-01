export interface Location {
  lat: number;
  lng: number;
}

export interface POI {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category: string;
  priority?: number;
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