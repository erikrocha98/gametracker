import { useCallback, useEffect, useState } from 'react'
import { getCollection, type CollectionStatus } from '../../../services/games'
import type { CollectionGame } from '../../../types/game'
import type { ActivityFilterValue } from '../../molecules/ActivityFilters'
import { CatalogCollection } from '../../organisms/CatalogCollection'
import { CatalogHero } from '../../organisms/CatalogHero'

const FILTER_TO_STATUS: Record<ActivityFilterValue, CollectionStatus | null> = {
  added: 'want_to_play',
  finished: 'finished',
  reviews: null,
}

export function CatalogPage() {
  const [filter, setFilter] = useState<ActivityFilterValue>('added')
  const [items, setItems] = useState<CollectionGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refetchKey, setRefetchKey] = useState(0)

  useEffect(() => {
    const status = FILTER_TO_STATUS[filter]
    if (status === null) return

    getCollection(status)
      .then((data) => {
        setItems(data.items)
        setError(false)
      })
      .catch((err) => {
        if (err instanceof Response && err.status === 404) return
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [filter, refetchKey])

  const handleFilterChange = useCallback((value: ActivityFilterValue) => {
    setFilter(value)
    if (FILTER_TO_STATUS[value] !== null) setLoading(true)
  }, [])

  const handleItemAdded = useCallback(() => {
    setLoading(true)
    setRefetchKey((k) => k + 1)
  }, [])

  const isReviews = FILTER_TO_STATUS[filter] === null
  const displayItems = isReviews ? [] : items
  const displayLoading = isReviews ? false : loading

  return (
    <>
      <CatalogHero />
      <CatalogCollection
        items={displayItems}
        loading={displayLoading}
        error={error}
        filter={filter}
        onFilterChange={handleFilterChange}
        onItemAdded={handleItemAdded}
      />
    </>
  )
}
