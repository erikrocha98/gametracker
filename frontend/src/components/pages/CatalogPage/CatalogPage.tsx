import { useCallback, useEffect, useState } from 'react'
import { getCollection, getUserReviews, type CollectionStatus } from '../../../services/games'
import type { CollectionGame, UserReview } from '../../../types/game'
import type { ActivityFilterValue } from '../../molecules/ActivityFilters'
import { CatalogCollection } from '../../organisms/CatalogCollection'
import { CatalogHero } from '../../organisms/CatalogHero'

const FILTER_TO_STATUS: Record<ActivityFilterValue, CollectionStatus | null> = {
  added: 'want_to_play',
  finished: 'finished',
  reviews: null,
}

function reviewToCollectionGame(review: UserReview): CollectionGame {
  return {
    id: 0,
    gameId: review.gameId,
    name: review.name,
    coverUrl: review.coverUrl,
    platforms: review.platforms,
    releaseYear: review.releaseYear,
    rating: review.rating,
    status: 'finished',
  }
}

export function CatalogPage() {
  const [filter, setFilter] = useState<ActivityFilterValue>('added')
  const [items, setItems] = useState<CollectionGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refetchKey, setRefetchKey] = useState(0)

  useEffect(() => {
    let active = true
    const status = FILTER_TO_STATUS[filter]
    const request =
      status === null
        ? getUserReviews().then((data) => data.items.map(reviewToCollectionGame))
        : getCollection(status).then((data) => data.items)

    request
      .then((collectionItems) => {
        if (!active) return
        setItems(collectionItems)
        setError(false)
      })
      .catch((err) => {
        if (!active) return
        if (err instanceof Response && err.status === 404) {
          setItems([])
          setError(false)
          return
        }
        setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [filter, refetchKey])

  const handleFilterChange = useCallback((value: ActivityFilterValue) => {
    setFilter(value)
    setLoading(true)
  }, [])

  const handleItemAdded = useCallback(() => {
    setLoading(true)
    setRefetchKey((k) => k + 1)
  }, [])

  return (
    <>
      <CatalogHero />
      <CatalogCollection
        items={items}
        loading={loading}
        error={error}
        filter={filter}
        onFilterChange={handleFilterChange}
        onItemAdded={handleItemAdded}
      />
    </>
  )
}
