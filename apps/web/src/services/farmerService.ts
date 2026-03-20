import { supabase } from '../lib/supabaseClient'

export async function getFarmers() {
    const { data, error } = await supabase
        .from('farmer')
        .select('*')

    if (error) throw error
    return data
}