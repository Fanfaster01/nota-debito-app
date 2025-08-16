"use client"

import { useState, useEffect } from 'react'

interface Item {
  id: string
  name: string
  description?: string
}

interface UseProductPricesResult {
  prices: Record<string, number>
  loading: boolean
  error: Error | null
}

export function useProductPrices(items: Item[]): UseProductPricesResult {
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true)
        const responses = await Promise.all(
          items.map(item => 
            Promise.race([
              fetch(`/api/listas-precios/bunker/prices?itemId=${item.id}`).then(res => res.json()),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 5000)
              )
            ])
          )
        )
        
        const newPrices: Record<string, number> = {}
        responses.forEach((response, index) => {
          newPrices[items[index].id] = response.price || 0
        })
        
        setPrices(newPrices)
        setLoading(false)
      } catch (err) {
        setError(err as Error)
        console.error('Error fetching prices:', err)
        setLoading(false)
      }
    }

    if (items && items.length > 0) {
      fetchPrices()
    }
  }, [JSON.stringify(items)])

  return { prices, loading, error }
}