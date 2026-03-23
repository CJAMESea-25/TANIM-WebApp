import { apiGet, apiPost } from './apiClient';

export async function getFarmers() {
    // Equivalent: supabase.from('farmer').select('*')
    const response = await apiGet<any[]>('/farmer?select=*');
    return response || [];
}

export async function createFarmer(farmerData: any) {
    const response = await apiPost<any[]>('/farmer', farmerData);
    return response?.[0] || null;
}