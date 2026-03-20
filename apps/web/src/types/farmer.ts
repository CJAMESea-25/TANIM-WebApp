import type { Database } from './database.types'

export type Farmer = Database['public']['Tables']['farmer']['Row']
export type FarmerInsert = Database['public']['Tables']['farmer']['Insert']
export type FarmerUpdate = Database['public']['Tables']['farmer']['Update']
