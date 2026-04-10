import { apiGet, apiPost } from './apiClient';
import { hashFarmerPassword, verifyFarmerPassword } from '@/shared/lib/passwordHash';

export interface LoginRequest {
    username?: string;
    password?: string;
    phone?: string;
}

export async function loginAdmin(credentials: LoginRequest): Promise<any> {
    // Equivalent: supabase.from('admin').select('*').eq('username', ...).eq('password', ...)
    const response = await apiGet<any[]>(`/admin?username=eq.${credentials.username}&password=eq.${credentials.password}&select=*`);
    
    if (response && response.length > 0) {
        // Return a shape that the LoginPage expects (simulating the old custom API response format)
        return {
            status: 'success',
            data: response[0]
        };
    }
    
    throw new Error('Invalid username or password.');
}

export async function loginFarmer(credentials: LoginRequest): Promise<any> {
    const phone = credentials.username || credentials.phone || '';
    const password = credentials.password || '';
    if (!phone || !password) {
        throw new Error('Invalid phone number or password.');
    }
    const q = encodeURIComponent(phone);
    const response = await apiGet<any[]>(
        `/farmer?or=(phone.eq.${q},phone_number.eq.${q})&select=*`
    );
    if (!response?.length) {
        throw new Error('Invalid phone number or password.');
    }
    for (const row of response) {
        if (await verifyFarmerPassword(password, row.password)) {
            const { password: _removed, ...data } = row;
            return { status: 'success', data };
        }
    }
    throw new Error('Invalid phone number or password.');
}

export async function signupFarmer(data: any): Promise<any> {
    const payload = { ...data };
    if (payload.password && typeof payload.password === 'string') {
        payload.password = await hashFarmerPassword(payload.password);
    }
    const response = await apiPost<any[]>('/farmer', payload);
    return { status: 'success', data: response[0] };
}

export async function signupAdmin(credentials: any): Promise<any> {
    const response = await apiPost<any[]>('/admin', credentials);
    return { status: 'success', data: response[0] };
}
