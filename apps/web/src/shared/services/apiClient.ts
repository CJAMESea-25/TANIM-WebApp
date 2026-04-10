import { ENV } from '../config/env';

const BASE_URL = `${ENV.SUPABASE_URL}/rest/v1`;
const ANON_KEY = ENV.SUPABASE_ANON_KEY;

function getAuthToken(): string | null {
    return localStorage.getItem('ACCESS_TOKEN');
}

function buildHeaders(includeAuth = true, method = 'GET'): HeadersInit {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
    };

    if (method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
        headers['Prefer'] = 'return=representation';
    }

    // Since the app uses custom table-based auth instead of Supabase Auth,
    // we must strictly use the ANON_KEY JWT for all Supabase REST requests.
    // Otherwise, old tokens from localStorage cause "No suitable key" errors.
    headers['Authorization'] = `Bearer ${ANON_KEY}`;

    return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
            const errorBody = await response.json();
            if (typeof errorBody.message === 'string') {
                errorMessage = errorBody.message;
            } else if (errorBody.hint) {
                errorMessage += ` (${errorBody.hint})`;
            }
        } catch {
            // ignore JSON parse errors for error body
        }
        throw new Error(errorMessage);
    }
    // For 204 No Content, return empty
    if (response.status === 204) return {} as T;
    return response.json();
}

export async function apiGet<T = any>(endpoint: string, includeAuth = true): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: buildHeaders(includeAuth, 'GET'),
    });
    return handleResponse<T>(response);
}

export async function apiPost<T = any>(endpoint: string, body: any, includeAuth = true): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: buildHeaders(includeAuth, 'POST'),
        body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
}

export async function apiPut<T = any>(endpoint: string, body: any, includeAuth = true): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: buildHeaders(includeAuth, 'PUT'),
        body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
}

export async function apiPatch<T = any>(endpoint: string, body: any, includeAuth = true): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: buildHeaders(includeAuth, 'PATCH'),
        body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
}

export async function apiDelete<T = any>(endpoint: string, includeAuth = true): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: buildHeaders(includeAuth, 'DELETE'),
    });
    return handleResponse<T>(response);
}
