// Mapping feature types
// GIS map feature, farm parcel, and layer data models

export interface FarmParcel {
  id: string;
  farm_id: string;
  farm_name: string;
  farmer_id: string;
  latitude: number;
  longitude: number;
  area_hectares: number;
  soil_type?: string;
  location_label?: string;
}

export interface MapLayer {
  id: string;
  label: string;
  visible: boolean;
  color: string;
}

export interface GISMapState {
  selectedParcelId: string | null;
  activeLayers: MapLayer[];
  zoom: number;
  center: [number, number]; // [lat, lng]
}
