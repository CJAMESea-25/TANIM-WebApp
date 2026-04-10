import { useQuery } from '@tanstack/react-query'
import { getTanimSystems } from '../services/systemService'

export function useTanimSystems() {
    return useQuery({
        queryKey: ['systems'],
        queryFn: getTanimSystems
    })
}
