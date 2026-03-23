import { getFarms } from './farmService';
import { getFarmers } from './farmerService';
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