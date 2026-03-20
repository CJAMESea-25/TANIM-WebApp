import type { Database } from './database.types'

export type Farm = Database['public']['Tables']['farm']['Row']
export type FarmInsert = Database['public']['Tables']['farm']['Insert']
export type FarmUpdate = Database['public']['Tables']['farm']['Update']
