// Mapping feature service
// Handles fetching and transforming geospatial farm data

import { FarmParcel } from '@/features/mapping/types/mappingTypes';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * Fetch all farm parcels with location data from the API.
 * Falls back gracefully if the endpoint doesn't exist yet.
 */
export const fetchFarmParcels = async (): Promise<FarmParcel[]> => {
  try {
    const res = await fetch(`${API_BASE}/farms/parcels`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
};

/**
 * Fetch a single farm parcel by ID.
 */
export const fetchFarmParcel = async (id: string): Promise<FarmParcel | null> => {
  try {
    const res = await fetch(`${API_BASE}/farms/parcels/${id}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
};
