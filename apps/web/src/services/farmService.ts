import { supabase } from '../lib/supabaseClient'

export async function getFarms() {
    const { data, error } = await supabase
        .from('farm')
        .select('*')

    if (error) throw error
    return data
}
