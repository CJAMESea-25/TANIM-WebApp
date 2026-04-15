import { apiGet, apiPost, apiPatch, apiDelete, apiDeleteAdmin } from '@/shared/services/apiClient';

// Actual farm table columns (from Supabase schema):
//   farm_id, farmer_id, farm_name, farm_location, farm_measurement, created_at
// NOTE: latitude/longitude require the DB migration to be run first.
// NOTE: There is NO soilType column — do NOT include it in payloads.

export async function getFarms() {
    try {
        // Full query including GPS columns (works after running the DB migration)
        const response = await apiGet<any[]>(
            '/farm?select=farm_id,farm_name,farm_location,farm_measurement,farmer_id,latitude,longitude,created_at'
        );
        return response || [];
    } catch {
        try {
            // Fallback: latitude/longitude columns may not exist yet in the DB
            const response = await apiGet<any[]>(
                '/farm?select=farm_id,farm_name,farm_location,farm_measurement,farmer_id,created_at'
            );
            return (response || []).map((f: any) => ({ ...f, latitude: null, longitude: null }));
        } catch {
            return [];
        }
    }
}

export async function createFarm(farmData: {
    farm_name: string;
    farm_measurement?: number;
    farmer_id: string;
    farm_location?: string;
    latitude?: number | null;
    longitude?: number | null;
    // soilType is intentionally omitted — it does not exist in the database
}) {
    // Build payload with only valid DB columns
    const basePayload: Record<string, any> = {
        farm_name:        farmData.farm_name,
        farmer_id:        farmData.farmer_id,
        farm_measurement: farmData.farm_measurement ?? 0,
    };
    if (farmData.farm_location) basePayload.farm_location = farmData.farm_location;

    try {
        // Try with GPS columns first (works after DB migration)
        const gpsPayload = { ...basePayload };
        if (farmData.latitude != null)  gpsPayload.latitude  = farmData.latitude;
        if (farmData.longitude != null) gpsPayload.longitude = farmData.longitude;

        const response = await apiPost<any[]>('/farm', gpsPayload);
        return response[0] || null;
    } catch {
        // GPS columns don't exist yet — retry with base columns only
        const response = await apiPost<any[]>('/farm', basePayload);
        return response[0] || null;
    }
}

export async function updateFarm(farmId: string, farmData: {
    farm_name?: string;
    farm_measurement?: number;
    farm_location?: string;
    latitude?: number | null;
    longitude?: number | null;
}) {
    const response = await apiPatch<any[]>(`/farm?farm_id=eq.${farmId}`, farmData);
    return response[0] || null;
}

export async function deleteFarm(farmId: string) {
    await apiDelete(`/farm?farm_id=eq.${farmId}`);
    return true;
}

