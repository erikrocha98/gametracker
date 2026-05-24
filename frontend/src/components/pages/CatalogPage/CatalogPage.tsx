import { useEffect, useState } from 'react'
import { getCollection } from '../../../services/games'
import type { CollectionGame } from '../../../types/game'
import { CatalogCollection } from '../../organisms/CatalogCollection'
import { CatalogHero } from '../../organisms/CatalogHero'

export function CatalogPage() {
  const [items, setItems] = useState<CollectionGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getCollection()
      .then((data) => setItems(data.items))
      .catch((err) => {
        if (err instanceof Response && err.status === 404) return
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <CatalogHero />
      <CatalogCollection items={items} loading={loading} error={error} />
    </>
  )
}
