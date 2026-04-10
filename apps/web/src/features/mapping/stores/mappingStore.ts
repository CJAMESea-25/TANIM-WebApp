// Mapping store
// Lightweight Zustand store to track selected parcel and active layers

import { create } from 'zustand';
import { GISMapState, MapLayer } from '@/features/mapping/types/mappingTypes';

interface MappingStore extends GISMapState {
  setSelectedParcel: (id: string | null) => void;
  toggleLayer: (layerId: string) => void;
  setZoom: (zoom: number) => void;
  setCenter: (center: [number, number]) => void;
}

const defaultLayers: MapLayer[] = [
  { id: 'farms',     label: 'Farm Parcels',   visible: true,  color: '#3a5a40' },
  { id: 'soil',      label: 'Soil Zones',     visible: false, color: '#8aaa6a' },
  { id: 'waterways', label: 'Waterways',      visible: false, color: '#4a90c4' },
];

export const useMappingStore = create<MappingStore>((set) => ({
  selectedParcelId: null,
  activeLayers: defaultLayers,
  zoom: 12,
  center: [8.4542, 124.6319], // default: CDO, Philippines

  setSelectedParcel: (id) => set({ selectedParcelId: id }),

  toggleLayer: (layerId) =>
    set((state) => ({
      activeLayers: state.activeLayers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ),
    })),

  setZoom: (zoom) => set({ zoom }),
  setCenter: (center) => set({ center }),
}));
