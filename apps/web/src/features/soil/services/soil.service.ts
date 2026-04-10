import { apiGet, apiPost } from '@/shared/services/apiClient';

export async function getSoilTests() {
    const response = await apiGet<any[]>('/soil_health_test?select=*');
    return response || [];
}

export async function createSoilTest(testData: any) {
    const response = await apiPost<any[]>('/soil_health_test', testData);
    return response[0] || null;
}
