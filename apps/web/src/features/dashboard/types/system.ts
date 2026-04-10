import type { Database } from '@/shared/types/database.types'

export type TanimSystem = Database['public']['Tables']['tanim_system']['Row']
export type TanimSystemInsert = Database['public']['Tables']['tanim_system']['Insert']
export type TanimSystemUpdate = Database['public']['Tables']['tanim_system']['Update']
