import { useCallback, useEffect, useMemo, useState } from 'react'
import { Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { getCollection, rateGame, removeFromWantToPlay, removeRating, setGameStatus } from '../../../services/games'
import { FeedbackModal } from '../../molecules/FeedbackModal'
import { PaginationControls } from '../../molecules/PaginationControls'
import { AddToListDialog } from '../../organisms/AddToListDialog'
import { MyGamesGrid } from '../../organisms/MyGamesGrid'
import type { CollectionGame, GameStatus } from '../../../types/game'

const PageWrapper = styled.div`
  padding: 32px 0 64px;
`

const PageTitle = styled(Typography)`
  margin-bottom: 32px !important;
`

export function MyGamesPage() {
  const [items, setItems] = useState<CollectionGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [addToListGameId, setAddToListGameId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; open: boolean }>({
    type: 'success',
    message: '',
    open: false,
  })

  useEffect(() => {
    getCollection()
      .then((data) => setItems(data.items))
      .catch((err) => {
        if (err instanceof Response && err.status === 404) return
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setPage(1)
  }, [])

  const handleRemove = useCallback(async (gameId: string) => {
    try {
      await removeFromWantToPlay(gameId)
      setItems((prev) => prev.filter((g) => g.gameId !== gameId))
      setFeedback({ type: 'success', message: texts.myGames.removeSuccessMessage, open: true })
    } catch {
      setFeedback({ type: 'error', message: texts.myGames.removeErrorMessage, open: true })
    }
  }, [])

  const handleStatusChange = useCallback(async (gameId: string, status: GameStatus) => {
    try {
      await setGameStatus(gameId, status)
      setItems((prev) => prev.map((g) => (g.gameId === gameId ? { ...g, status } : g)))
      setFeedback({ type: 'success', message: texts.myGames.statusChangeSuccessMessage, open: true })
    } catch {
      setFeedback({ type: 'error', message: texts.myGames.statusChangeErrorMessage, open: true })
    }
  }, [])

  const handleAddToList = useCallback((gameId: string) => {
    setAddToListGameId(gameId)
  }, [])

  const handleCloseAddToList = useCallback(() => {
    setAddToListGameId(null)
  }, [])

  const handleRate = useCallback(async (gameId: string, value: number | null) => {
    try {
      if (value === null) {
        await removeRating(gameId)
        setItems((prev) => prev.map((g) => (g.gameId === gameId ? { ...g, rating: null } : g)))
        setFeedback({ type: 'success', message: texts.myGames.ratingRemovedMessage, open: true })
      } else {
        const updated = await rateGame(gameId, value)
        setItems((prev) => prev.map((g) => (g.gameId === gameId ? { ...g, rating: updated.rating ?? value } : g)))
        setFeedback({ type: 'success', message: texts.myGames.rateSuccessMessage, open: true })
      }
    } catch {
      const message = value === null ? texts.myGames.removeRatingErrorMessage : texts.myGames.rateErrorMessage
      setFeedback({ type: 'error', message, open: true })
    }
  }, [])

  return (
    <>
      <PageWrapper>
        <PageTitle variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700 }}>
          {texts.myGames.pageTitle}
        </PageTitle>

        <MyGamesGrid
          items={pagedItems}
          loading={loading}
          error={error}
          onRemove={handleRemove}
          onRate={handleRate}
          onStatusChange={handleStatusChange}
          onAddToList={handleAddToList}
        />

        {!loading && !error && items.length > 0 && (
          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={items.length}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </PageWrapper>

      <AddToListDialog
        open={addToListGameId !== null}
        gameId={addToListGameId}
        onClose={handleCloseAddToList}
      />

      <FeedbackModal
        type={feedback.type}
        message={feedback.message}
        open={feedback.open}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      />
    </>
  )
}
