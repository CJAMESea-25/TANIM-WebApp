import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export async function getSoilTests() {
    const { data, error } = await supabase
        .from('soil_health_test')
        .select('*')

    if (error) throw error
    return data
}

export function useSoilTests() {
    return useQuery({
        queryKey: ['soil_tests'],
        queryFn: getSoilTests
    })
}
