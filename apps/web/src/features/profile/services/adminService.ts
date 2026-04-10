import { apiGet, apiPost, apiPatch, apiDelete } from '@/shared/services/apiClient';

// Admin table columns: admin_id, username, password, created_at

export async function getAdmins() {
    const response = await apiGet<any[]>('/admin?select=admin_id,username,created_at&order=created_at.asc');
    return response || [];
}

export async function createAdmin(data: { username: string; password: string }) {
    const response = await apiPost<any[]>('/admin', {
        username: data.username,
        password: data.password,
    });
    return response?.[0] || null;
}

export async function updateAdmin(adminId: string, data: { username?: string; password?: string }) {
    const payload: Record<string, string> = {};
    if (data.username) payload.username = data.username;
    if (data.password) payload.password = data.password;
    const response = await apiPatch<any[]>(`/admin?admin_id=eq.${adminId}`, payload);
    return response?.[0] || null;
}

export async function deleteAdmin(adminId: string) {
    await apiDelete(`/admin?admin_id=eq.${adminId}`);
    return true;
}
