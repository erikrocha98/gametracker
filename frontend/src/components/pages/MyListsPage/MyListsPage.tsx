import { useCallback, useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import { Button, Typography } from '@mui/material'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { deleteList, getLists } from '../../../services/lists'
import { ConfirmDialog } from '../../molecules/ConfirmDialog'
import { FeedbackModal } from '../../molecules/FeedbackModal'
import { CreateListModal } from '../../organisms/CreateListModal'
import { MyListsGrid } from '../../organisms/MyListsGrid'
import type { GameList } from '../../../types/list'

const PageWrapper = styled.div`
  padding: 32px 0 64px;
`

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 32px;
`

export function MyListsPage() {
  const [items, setItems] = useState<GameList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingList, setEditingList] = useState<GameList | null>(null)
  const [deletingList, setDeletingList] = useState<GameList | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; open: boolean }>({
    type: 'success',
    message: '',
    open: false,
  })

  useEffect(() => {
    getLists()
      .then((data) => setItems(data.items))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const handleCreateClick = useCallback(() => {
    setEditingList(null)
    setModalOpen(true)
  }, [])

  const handleEdit = useCallback((list: GameList) => {
    setEditingList(list)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback((list: GameList) => {
    setDeletingList(list)
  }, [])

  const handleCancelDelete = useCallback(() => {
    setDeletingList(null)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingList) return
    setDeleteLoading(true)
    try {
      await deleteList(deletingList.id)
      setItems((prev) => prev.filter((l) => l.id !== deletingList.id))
      setFeedback({ type: 'success', message: texts.myLists.deleteSuccessMessage, open: true })
      setDeletingList(null)
    } catch {
      setFeedback({ type: 'error', message: texts.myLists.deleteErrorMessage, open: true })
    } finally {
      setDeleteLoading(false)
    }
  }, [deletingList])

  const handleSaved = useCallback((saved: GameList) => {
    setItems((prev) => {
      const exists = prev.some((l) => l.id === saved.id)
      return exists ? prev.map((l) => (l.id === saved.id ? saved : l)) : [saved, ...prev]
    })
  }, [])

  return (
    <>
      <PageWrapper>
        <TitleRow>
          <Typography variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700 }}>
            {texts.myLists.pageTitle}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateClick}>
            {texts.myLists.createButton}
          </Button>
        </TitleRow>

        <MyListsGrid
          items={items}
          loading={loading}
          error={error}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreate={handleCreateClick}
        />
      </PageWrapper>

      <CreateListModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        list={editingList}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deletingList !== null}
        title={texts.myLists.deleteConfirmTitle}
        description={texts.myLists.deleteConfirmDescription(deletingList?.name ?? '')}
        confirmLabel={texts.myLists.deleteConfirmButton}
        cancelLabel={texts.myLists.deleteCancelButton}
        onConfirm={handleConfirmDelete}
        onClose={handleCancelDelete}
        loading={deleteLoading}
        destructive
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
