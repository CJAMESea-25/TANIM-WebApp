import { apiGet, apiPost, apiPatch } from './apiClient';

export async function getTanimSystems() {
    // Equivalent: supabase.from('tanim_system').select('*')
    const response = await apiGet<any[]>('/tanim_system?select=*');
    return response || [];
}

export async function createSystem(systemData: any) {
    const response = await apiPost<any[]>('/tanim_system', systemData);
    return response[0] || null;
}

export async function updateSystem(systemId: string, systemData: any) {
    const response = await apiPatch<any[]>(`/tanim_system?id=eq.${systemId}`, systemData);
    return response[0] || null;
}
