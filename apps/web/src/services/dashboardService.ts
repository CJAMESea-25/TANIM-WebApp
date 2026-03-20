import { supabase } from '../lib/supabaseClient'

export async function getDashboardStats() {

    const farmers = await supabase.from('farmer').select('*', { count: 'exact', head: true })

    const farms = await supabase.from('farm').select('*', { count: 'exact', head: true })

    const systems = await supabase.from('tanim_system').select('*', { count: 'exact', head: true })

    return {
        farmers: farmers.count,
        farms: farms.count,
        systems: systems.count
    }
}