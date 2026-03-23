import { apiGet, apiPost } from './apiClient';

export async function getSoilTests() {
    // Equivalent: supabase.from('soil_health_test').select('*')
    const response = await apiGet<any[]>('/soil_health_test?select=*');
    return response || [];
}

export async function createSoilTest(testData: any) {
    // Equivalent: supabase.from('soil_health_test').insert([testData]).select()
    const response = await apiPost<any[]>('/soil_health_test', testData);
    return response[0] || null;
}
