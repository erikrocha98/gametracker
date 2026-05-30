import { useCallback, useEffect, useMemo, useState } from 'react'
import { Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { getCollection, removeFromWantToPlay } from '../../../services/games'
import { FeedbackModal } from '../../molecules/FeedbackModal'
import { PaginationControls } from '../../molecules/PaginationControls'
import { MyGamesGrid } from '../../organisms/MyGamesGrid'
import type { CollectionGame } from '../../../types/game'

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

  return (
    <>
      <PageWrapper>
        <PageTitle variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700 }}>
          {texts.myGames.pageTitle}
        </PageTitle>

        <MyGamesGrid items={pagedItems} loading={loading} error={error} onRemove={handleRemove} />

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

      <FeedbackModal
        type={feedback.type}
        message={feedback.message}
        open={feedback.open}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      />
    </>
  )
}
