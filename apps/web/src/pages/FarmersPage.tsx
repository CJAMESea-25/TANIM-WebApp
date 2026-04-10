import { useEffect, useState } from 'react'
import { getFarmers } from '@/features/farmers/services/farmerService'
import { Farmer } from '@/features/farmers/types/farmer'

export default function FarmersPage() {
    const [farmers, setFarmers] = useState<Farmer[]>([])

    useEffect(() => {
        async function loadFarmers() {
            const data = await getFarmers()
            if (data) setFarmers(data)
        }

        loadFarmers()
    }, [])

    return (
        <div>
            <h1>Farmers</h1>
            {farmers.map((f: Farmer) => (
                <p key={f.farmer_id}>{f.username}</p>
            ))}
        </div>
    )
}