import { apiGet, apiPost, apiPatch, apiDelete } from '@/shared/services/apiClient';
import { hashFarmerPassword } from '@/shared/lib/passwordHash';

// Actual farmer table columns (from Supabase schema):
//   farmer_id, username, password, first_name, last_name, phone_number, created_at

export async function getFarmers() {
    const response = await apiGet<any[]>('/farmer?select=*');
    return response || [];
}

export async function createFarmer(farmerData: {
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
}) {
    // Build payload with only valid DB columns
    const payload: Record<string, any> = {
        username: farmerData.username,
        password: await hashFarmerPassword(farmerData.password),
    };
    if (farmerData.first_name)   payload.first_name   = farmerData.first_name;
    if (farmerData.last_name)    payload.last_name    = farmerData.last_name;
    if (farmerData.phone_number) payload.phone_number = farmerData.phone_number;

    const response = await apiPost<any[]>('/farmer', payload);
    return response?.[0] || null;
}

export async function updateFarmer(id: string, farmerData: Partial<{
    username: string;
    password?: string;
    first_name: string;
    last_name: string;
    phone_number: string;
}>) {
    const payload = { ...farmerData };
    if (payload.password) {
        payload.password = await hashFarmerPassword(payload.password);
    } else {
        delete payload.password;
    }
    
    // Use farmer_id for Supabase REST endpoint eq match
    const response = await apiPatch<any[]>(`/farmer?farmer_id=eq.${id}`, payload);
    return response?.[0] || null;
}

export async function deleteFarmer(id: string) {
    return await apiDelete<any>(`/farmer?farmer_id=eq.${id}`);
}
