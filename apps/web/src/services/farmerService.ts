import { apiGet, apiPost } from './apiClient';
import { hashFarmerPassword } from '@/shared/lib/passwordHash';

export async function getFarmers() {
    // Equivalent: supabase.from('farmer').select('*')
    const response = await apiGet<any[]>('/farmer?select=*');
    return response || [];
}

export async function createFarmer(farmerData: any) {
    const payload = { ...farmerData };
    if (payload.password && typeof payload.password === 'string') {
        payload.password = await hashFarmerPassword(payload.password);
    }
    const response = await apiPost<any[]>('/farmer', payload);
    return response?.[0] || null;
}