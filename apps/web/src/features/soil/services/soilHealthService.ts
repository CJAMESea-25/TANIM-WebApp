import { apiGet } from '@/shared/services/apiClient';

export interface WeatherResponse {
    status: string;
    message: string;
    data: any;
}

export async function getWeatherToday() {
    const response = await apiGet<WeatherResponse>('/weather');
    return response.data;
}
