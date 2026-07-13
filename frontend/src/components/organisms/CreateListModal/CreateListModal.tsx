import { useCallback, useEffect, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import styled from 'styled-components'
import { colors } from '../../../theme/colors'
import { texts } from '../../../constants/texts'
import { createList, updateList } from '../../../services/lists'
import { FormField } from '../../molecules/FormField'
import { FeedbackModal } from '../../molecules/FeedbackModal'
import { listSchema } from './listSchema'
import type { ListFormData } from './listSchema'
import type { GameList } from '../../../types/list'

export interface CreateListModalProps {
  open: boolean
  onClose: () => void
  list?: GameList | null
  onSaved?: (saved: GameList) => void
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export function CreateListModal({ open, onClose, list = null, onSaved }: CreateListModalProps) {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; open: boolean }>({
    type: 'success',
    message: '',
    open: false,
  })
  const isEditing = list !== null
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ListFormData>({
    resolver: zodResolver(listSchema),
    defaultValues: { name: '', description: '' },
  })

  useEffect(() => {
    if (open) reset({ name: list?.name ?? '', description: list?.description ?? '' })
  }, [open, list, reset])

  const handleFormSubmit = useCallback(
    async (data: ListFormData) => {
      const description = data.description?.trim() ? data.description : null
      try {
        const saved = isEditing
          ? await updateList(list.id, data.name, description)
          : await createList(data.name, description)
        onClose()
        onSaved?.(saved)
        setFeedback({
          type: 'success',
          message: isEditing ? texts.myLists.editSuccessMessage : texts.myLists.createSuccessMessage,
          open: true,
        })
      } catch {
        setFeedback({
          type: 'error',
          message: isEditing ? texts.myLists.editErrorMessage : texts.myLists.createErrorMessage,
          open: true,
        })
      }
    },
    [isEditing, list, onClose, onSaved],
  )

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: colors.textPrimary }}>
          {isEditing ? texts.myLists.modalEditTitle : texts.myLists.modalCreateTitle}
        </DialogTitle>
        <Form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormField
              label={texts.myLists.nameLabel}
              name="name"
              register={register}
              error={errors.name?.message}
              placeholder={texts.myLists.namePlaceholder}
            />
            <FormField
              label={texts.myLists.descriptionLabel}
              name="description"
              register={register}
              error={errors.description?.message}
              placeholder={texts.myLists.descriptionPlaceholder}
            />
          </DialogContent>
          <DialogActions>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {texts.myLists.saveButton}
            </Button>
          </DialogActions>
        </Form>
      </Dialog>

      <FeedbackModal
        type={feedback.type}
        message={feedback.message}
        open={feedback.open}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      />
    </>
  )
}
