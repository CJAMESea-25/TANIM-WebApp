import { apiGet, apiPost } from '@/shared/services/apiClient';

export interface LoginRequest {
    username?: string;
    password?: string;
    phone?: string;
}

export async function loginAdmin(credentials: LoginRequest): Promise<any> {
    const response = await apiGet<any[]>(`/admin?username=eq.${credentials.username}&password=eq.${credentials.password}&select=*`);
    
    if (response && response.length > 0) {
        return {
            status: 'success',
            data: response[0]
        };
    }
    
    throw new Error('Invalid username or password.');
}

export async function loginFarmer(credentials: LoginRequest): Promise<any> {
    const response = await apiGet<any[]>(`/farmer?phone=eq.${credentials.username || credentials.phone}&password=eq.${credentials.password}&select=*`);
    
    if (response && response.length > 0) {
        return {
            status: 'success',
            data: response[0]
        };
    }
    
    throw new Error('Invalid phone number or password.');
}

export async function signupFarmer(data: any): Promise<any> {
    const response = await apiPost<any[]>('/farmer', data);
    return { status: 'success', data: response[0] };
}

export async function signupAdmin(credentials: any): Promise<any> {
    const response = await apiPost<any[]>('/admin', credentials);
    return { status: 'success', data: response[0] };
}
