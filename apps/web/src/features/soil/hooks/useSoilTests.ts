import { useQuery } from '@tanstack/react-query'
import { getSoilTests } from '../services/soil.service'

export function useSoilTests() {
    return useQuery({
        queryKey: ['soil_tests'],
        queryFn: getSoilTests
    })
}
