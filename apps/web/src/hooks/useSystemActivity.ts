import { useQuery } from '@tanstack/react-query'
import { getTanimSystems } from '../services/systemService'

export function useSystemActivity() {
    return useQuery({
        queryKey: ['system_activity'],
        queryFn: getTanimSystems
    })
}
