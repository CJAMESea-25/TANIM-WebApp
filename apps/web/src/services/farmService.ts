import { apiGet, apiPost, apiPatch, apiDelete } from './apiClient';

export async function getFarms() {
    // Equivalent: supabase.from('farm').select('*')
    // Note: PostgREST returns an array directly
    const response = await apiGet<any[]>('/farm?select=*');
    return response || [];
}

export async function createFarm(farmData: any) {
    // Equivalent: supabase.from('farm').insert([farmData]).select()
    const response = await apiPost<any[]>('/farm', farmData);
    return response[0] || null;
}

export async function updateFarm(farmId: string, farmData: any) {
    // Equivalent: supabase.from('farm').update(farmData).eq('id', farmId).select()
    const response = await apiPatch<any[]>(`/farm?id=eq.${farmId}`, farmData);
    return response[0] || null;
}

export async function deleteFarm(farmId: string) {
    // Equivalent: supabase.from('farm').delete().eq('id', farmId)
    await apiDelete(`/farm?id=eq.${farmId}`);
    return true;
}
