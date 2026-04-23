import { apiGet, apiPost } from '@/shared/services/apiClient';

export async function getSoilTests() {
    const response = await apiGet<any[]>('/soil_health_test?select=*');
    return response || [];
}

/** All rows from `soil_health_test` for a farm, newest first (by `created_at`). */
export async function getSoilHealthTestsByFarmId(farmId: string) {
    const id = encodeURIComponent(farmId);
    const response = await apiGet<any[]>(
        `/soil_health_test?select=*&farm_id=eq.${id}&order=created_at.desc`,
    );
    return response || [];
}

export async function createSoilTest(testData: any) {
    const response = await apiPost<any[]>('/soil_health_test', testData);
    return response[0] || null;
}
