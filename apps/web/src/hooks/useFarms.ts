import { useQuery } from '@tanstack/react-query'
import { getFarms } from '../services/farmService'

export function useFarms() {
    return useQuery({
        queryKey: ['farms'],
        queryFn: getFarms
    })
}
