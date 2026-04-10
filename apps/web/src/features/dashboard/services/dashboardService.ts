import { getFarms } from '@/features/farms/services/farmService';
import { getFarmers } from '@/features/farmers/services/farmerService';
import { getTanimSystems } from './systemService';

export async function getDashboardStats() {
    const [farms, farmers, systems] = await Promise.all([
        getFarms().catch(() => []),
        getFarmers().catch(() => []),
        getTanimSystems().catch(() => []),
    ]);

    return {
        farmers: farmers.length,
        farms: farms.length,
        systems: systems.length,
    };
}
