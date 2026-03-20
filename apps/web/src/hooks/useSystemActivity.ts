import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export async function getTanimSystems() {
    const { data, error } = await supabase
        .from('tanim_system')
        .select('*')

    if (error) throw error
    return data
}

export function useSystemActivity() {
    return useQuery({
        queryKey: ['system_activity'],
        queryFn: getTanimSystems
    })
}
